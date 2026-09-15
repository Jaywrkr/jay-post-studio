import { generateText } from "ai";
import { createAnthropic } from "@ai-sdk/anthropic";
import { isTooCloseToJayHistory, jayPerformanceEvidence, jayWinningMechanism } from "@/lib/jay-evidence";

type TemplateProfile = {
  name: string;
  kind: "single" | "split" | "segments" | "photo";
  min: number;
  max: number;
  segmentMax?: number;
};

const profiles: Record<string, TemplateProfile> = {
  "jay-quiet-paper": { name: "Papel sobrio", kind: "single", min: 55, max: 145 },
  "jay-quiet-ink": { name: "Tinta sobria", kind: "single", min: 45, max: 115 },
  "jay-centered-caps": { name: "Mayúsculas centradas", kind: "single", min: 30, max: 85 },
  "jay-simple-paper": { name: "SIMPLE claro", kind: "single", min: 45, max: 125 },
  "jay-simple-ink": { name: "SIMPLE oscuro", kind: "single", min: 35, max: 105 },
  "jay-mirror": { name: "Espejo", kind: "single", min: 40, max: 92 },
  "jay-four-sides": { name: "Cuatro lados", kind: "split", min: 35, max: 100 },
  "jay-circle-quote": { name: "Cita circular", kind: "single", min: 35, max: 95 },
  "jay-venn": { name: "Diagrama", kind: "segments", min: 12, max: 75, segmentMax: 28 },
  "jay-repeater": { name: "Repetición", kind: "single", min: 25, max: 72 },
  "jay-grain-left": { name: "Grano izquierdo", kind: "single", min: 55, max: 145 },
  "jay-grain-right": { name: "Grano derecho", kind: "single", min: 55, max: 145 },
  "jay-message": { name: "Mensaje", kind: "single", min: 42, max: 90 },
  "jay-reminder": { name: "Recordatorio", kind: "segments", min: 12, max: 72, segmentMax: 26 },
  "jay-photo-reference": { name: "Foto con texto", kind: "photo", min: 42, max: 105 },
};

const model = process.env.ANTHROPIC_MODEL || "claude-sonnet-5";
const anthropic = createAnthropic({
  headers: process.env.ANTHROPIC_WORKSPACE_ID
    ? { "anthropic-workspace-id": process.env.ANTHROPIC_WORKSPACE_ID }
    : undefined,
});
const requestWindows = new Map<string, { count: number; resetAt: number }>();
const blockedProfessional = /\b(cliente|clientes|empresa|empresas|equipo|equipos|liderazgo|salario|ascenso|networking|mentor|industria|ventas|marketing|empleabilidad|certificaci[oó]n|freelanc\w*|coaching|roi|impuestos|delegaci[oó]n|carrera profesional|marca personal)\b/i;
const foreignLeak = /\b(after|before|because|actually|however|though|maybe|still|work|job|business|career|team|client|meeting|deadline|feedback|growth|leadership)\b/i;
const voseoLeak = /\b(notás|respondés|decís|sentís|podés|tenés|querés|hacés|sabés|elegís|seguís|dejás|mirás|pensás|creés|ganás|perdés|vivís|cumplís|evitás|cambiás|esperás|buscás|encontrás|llegás|usás|dás|sos)\b/i;
const trailingConnector = /\b(que|de|del|la|el|los|las|un|una|con|sin|por|para|sobre|porque|aunque|cuando|como|si|y|o)$/i;

const normalize = (value: unknown, max = 500) => typeof value === "string"
  ? value.replace(/\s+/g, " ").trim().slice(0, max)
  : "";
const comparable = (value: string) => value
  .normalize("NFD")
  .replace(/[\u0300-\u036f]/g, "")
  .toLowerCase()
  .replace(/[^a-z0-9ñ\s]/g, " ")
  .replace(/\s+/g, " ")
  .trim();
const cleanEnding = (value: string) => value.replace(/[¿?¡!.,;:]+$/, "").trim();
const validCopy = (value: unknown, min: number, max: number) => {
  const copy = normalize(value, max + 1);
  if (copy.length < min || copy.length > max) return "";
  if (copy.split(/\s+/).length < 6 || trailingConnector.test(cleanEnding(copy))) return "";
  return copy;
};
const decode = (value: string) => {
  const clean = value.trim().replace(/^```(?:json)?\s*/i, "").replace(/\s*```$/, "");
  const candidate = clean.match(/\{[\s\S]*\}/)?.[0];
  if (!candidate) return null;
  try { return JSON.parse(candidate) as Record<string, unknown>; } catch { return null; }
};
const canGenerate = (request: Request) => {
  const now = Date.now();
  const client = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "unknown";
  const current = requestWindows.get(client);
  if (!current || current.resetAt <= now) {
    requestWindows.set(client, { count: 1, resetAt: now + 10 * 60 * 1000 });
    return true;
  }
  if (current.count >= 20) return false;
  current.count += 1;
  return true;
};

export async function POST(request: Request) {
  let body: { templateId?: unknown; exclude?: unknown };
  try { body = await request.json(); } catch {
    return Response.json({ error: "Solicitud inválida." }, { status: 400 });
  }
  const templateId = normalize(body.templateId, 60);
  const profile = profiles[templateId];
  if (!profile) return Response.json({ error: "Esta plantilla no admite generación automática." }, { status: 400 });
  if (!process.env.ANTHROPIC_API_KEY) return Response.json({ error: "Claude no está disponible." }, { status: 503 });
  if (!canGenerate(request)) return Response.json({ error: "Espera unos minutos antes de generar más textos." }, { status: 429 });
  const exclude = Array.isArray(body.exclude)
    ? body.exclude.map((item) => normalize(item, 180)).filter(Boolean).slice(-80)
    : [];
  const segmentInstruction = profile.kind === "segments"
    ? `También devuelve segments con exactamente 3 fragmentos. Cada fragmento debe tener sentido dentro de una sola composición, máximo ${profile.segmentMax} caracteres, y los tres deben construir una lectura clara en orden.`
    : "Omite segments.";
  const splitInstruction = profile.kind === "split"
    ? "Devuelve counterpoint: una segunda idea completa de 30 a 85 caracteres que tensione la primera sin repetirla."
    : "Omite counterpoint.";
  let raw = "";
  for (let attempt = 0; attempt < 3; attempt += 1) {
    try {
      const result = await generateText({
        model: anthropic(model),
        providerOptions: { anthropic: { thinking: { type: "disabled" } } },
        maxOutputTokens: 1200,
        system: `Eres el editor de JAY POST STUDIO. Escribe únicamente en español latino neutro y usa conjugaciones de tú. Nunca uses voseo ni formas como notás, respondés, decís, sentís, podés, tenés, querés, hacés, sabés o sos. JAY habla de decisiones privadas que forman una vida ordinaria: cumplir la palabra sin aplausos, hábitos tolerados, conversaciones aplazadas, atención, tiempo, dinero como margen de libertad, identidad, comodidad, responsabilidad y consecuencias de seguir igual. JAY no es CoreSolutions: prohíbe clientes, empresas, equipos, liderazgo, ventas, marketing, carreras y productividad profesional. La claridad importa más que sonar profundo. Cada texto debe describir una conducta, decisión o escena reconocible; mostrar una tensión; y dejar una consecuencia o criterio concreto. No uses motivación genérica, terapia, clickbait, metáforas apiladas, emojis, hashtags ni llamadas a la acción. ${jayPerformanceEvidence} ${jayWinningMechanism} No reutilices ni parafrasees frases históricas. Devuelve solo JSON válido con title, copy, caption, optional counterpoint y optional segments. El caption debe tener exactamente dos párrafos separados por \\n\\n, entre 70 y 115 palabras, y desarrollar la idea sin repetir el copy.`,
        prompt: `Crea una idea JAY completamente nueva para la plantilla ${profile.name}. El copy debe medir entre ${profile.min} y ${profile.max} caracteres, contar una idea completa y no terminar en un conector. ${splitInstruction} ${segmentInstruction} El título debe describir la idea en 4 a 9 palabras. Semilla creativa: ${Date.now()}-${attempt}. No uses estas ideas recientes ni variaciones cercanas:\n${exclude.join("\n") || "Ninguna."}${attempt ? "\nLa respuesta anterior no pasó la validación. Reescribe desde cero, cuenta caracteres y revisa claridad, gramática y estructura antes de responder." : ""}`,
      });
      raw = result.text;
      const parsed = decode(raw);
      if (!parsed) continue;
      const copy = validCopy(parsed.copy, profile.min, profile.max);
      const title = normalize(parsed.title, 70);
      const caption = typeof parsed.caption === "string"
        ? parsed.caption
            .replace(/\\n\\n/g, "\n\n")
            .replace(/\r/g, "")
            .replace(/[ \t]+/g, " ")
            .replace(/\n{3,}/g, "\n\n")
            .trim()
            .slice(0, 900)
        : "";
      const counterpoint = profile.kind === "split" ? validCopy(parsed.counterpoint, 30, 85) : "";
      const segments = profile.kind === "segments" && Array.isArray(parsed.segments)
        ? parsed.segments.map((item) => normalize(item, (profile.segmentMax || 28) + 1))
        : [];
      const combined = [title, copy, counterpoint, ...segments, caption].join(" ");
      const duplicate = exclude.some((item) => comparable(item) === comparable(copy));
      const paragraphs = caption.split(/\n\n+/).filter(Boolean);
      const captionWords = caption.split(/\s+/).filter(Boolean).length;
      const segmentsValid = profile.kind !== "segments" || (
        segments.length === 3 && segments.every((segment) => segment.length >= 3 && segment.length <= (profile.segmentMax || 28))
      );
      if (!copy || !title || captionWords < 70 || captionWords > 115 || paragraphs.length !== 2 || !segmentsValid || (profile.kind === "split" && !counterpoint)) continue;
      if (blockedProfessional.test(combined) || foreignLeak.test(combined) || voseoLeak.test(combined) || duplicate || isTooCloseToJayHistory([title, copy, counterpoint, ...segments].join(" "))) continue;
      return Response.json({
        title,
        copy,
        caption,
        ...(counterpoint ? { counterpoint } : {}),
        ...(segments.length ? { segments } : {}),
      });
    } catch (error) {
      console.error(`[JAY AI] template copy failed with ${model}.`, error);
    }
  }
  console.warn(`[JAY AI] template copy rejected after validation. ${raw.slice(0, 1200)}`);
  return Response.json({ error: "Claude no produjo un texto con la calidad JAY requerida. Inténtalo otra vez." }, { status: 502 });
}
