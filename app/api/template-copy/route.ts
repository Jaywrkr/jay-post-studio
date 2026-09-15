import { generateText } from "ai";
import { createAnthropic } from "@ai-sdk/anthropic";
import { isTooCloseToJayHistory, jayPerformanceEvidence, jayWinningMechanism } from "@/lib/jay-evidence";

type TemplateProfile = {
  name: string;
  kind: "single" | "split" | "segments" | "photo";
  min: number;
  max: number;
  segmentMax?: number;
  segmentLimits?: number[];
  guidance: string;
};

const profiles: Record<string, TemplateProfile> = {
  "jay-reminder": {
    name: "Recordatorio vertical",
    kind: "segments",
    min: 12,
    max: 52,
    segmentMax: 18,
    segmentLimits: [18, 18, 18],
    guidance: "Divide una afirmación contundente en tres fragmentos cortos. El primero puede tener una o dos palabras; el segundo y el tercero deben tener al menos dos palabras para ocupar dos líneas. Cada fragmento debe caber sin cambiar la tipografía: máximo 18 caracteres. Los tres deben formar una sola oración clara al leerse de arriba hacia abajo.",
  },
  "jay-repeater": {
    name: "Repetición",
    kind: "single",
    min: 25,
    max: 38,
    guidance: "Escribe una sola afirmación contundente que funcione repetida trece veces y que no necesite contexto adicional.",
  },
  "jay-centered-statement": {
    name: "Frase centrada",
    kind: "single",
    min: 45,
    max: 76,
    guidance: "Escribe una observación completa y concreta que quepa exactamente en una o dos líneas visuales a tamaño fijo.",
  },
  "jay-venn": {
    name: "Diagrama",
    kind: "segments",
    min: 12,
    max: 75,
    segmentMax: 32,
    segmentLimits: [14, 32, 16],
    guidance: "Devuelve una sola oración dividida en tres fragmentos que conserven gramática y sentido. El fragmento superior mide máximo 14 caracteres; el central máximo 32 y al menos dos palabras; el inferior máximo 16 y al menos dos palabras. Deben quedar dentro de los tres círculos sin cambiar su tipografía ni posición.",
  },
  "jay-wide-statement": {
    name: "Frase amplia",
    kind: "single",
    min: 70,
    max: 120,
    guidance: "Desarrolla una idea completa que quepa en dos o tres líneas a tamaño fijo, con una observación reconocible y una consecuencia clara.",
  },
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
type SafeFallback = { title: string; copy: string; segments?: [string, string, string] };
const safeFallbacks: Record<string, SafeFallback[]> = {
  "jay-reminder": [
    { title: "Cumplir cuando nadie mira", copy: "Nadie mira, igual lo haces, así te formas", segments: ["Nadie mira", "igual lo haces", "así te formas"] },
    { title: "El estándar que sostienes", copy: "No era urgente, pero lo hiciste sin explicarlo", segments: ["No era urgente", "pero lo hiciste", "sin explicarlo"] },
    { title: "La promesa privada", copy: "Podías dejarlo, nadie iba a saber, pero cumpliste", segments: ["Podías dejarlo", "nadie iba a saber", "pero cumpliste"] },
  ],
  "jay-repeater": [
    { title: "La palabra sin público", copy: "Tu palabra pesa más sin público" },
    { title: "El estándar pequeño", copy: "Lo pequeño también revela tu estándar" },
    { title: "Promesas que escuchas", copy: "Lo que prometes también te escucha" },
  ],
  "jay-centered-statement": [
    { title: "El peso de aplazar", copy: "Lo que evitas cinco minutos puede pesarte todo el día." },
    { title: "Sostener la decisión", copy: "Puedes explicar tu decisión o empezar a sostenerla." },
    { title: "La conversación pendiente", copy: "Esa conversación no se resuelve mientras la ensayas en silencio." },
  ],
  "jay-venn": [
    { title: "Una promesa hecha", copy: "Te prometiste algo sencillo y lo hiciste", segments: ["Te prometiste", "algo sencillo", "y lo hiciste"] },
    { title: "Cumplir sin escenario", copy: "Nadie mira, pero cumpliste, igual cuenta", segments: ["Nadie mira", "pero cumpliste", "igual cuenta"] },
    { title: "Hacerlo sin insistencia", copy: "Ibas a hacerlo, nadie insistió, pero lo hiciste", segments: ["Ibas a hacerlo", "nadie insistió", "pero lo hiciste"] },
  ],
  "jay-wide-statement": [
    { title: "El precio de tolerar", copy: "Lo que toleras para no incomodarte termina enseñándote cuánto te cuesta cambiar." },
    { title: "La decisión que ocupa", copy: "Una decisión pendiente no desaparece cuando la pospones. Solo ocupa más espacio dentro de ti." },
    { title: "El límite que sabes", copy: "Decir que sí para evitar un momento incómodo puede robarte semanas de tranquilidad." },
  ],
};
const fallbackCaption = (copy: string) => `Hay decisiones que no necesitan testigos para revelar algo de ti. No son grandes escenas ni momentos que alguien vaya a recordar. Son detalles: responder lo que has evitado, terminar lo que empezaste, decir la verdad aunque sea más incómodo. Ahí se forma el estándar con el que vives.\n\n${copy} No para demostrar nada, sino para dejar de depender de la versión de ti que aparece cuando alguien está mirando. La confianza propia no llega por una declaración grande. Se construye cuando haces lo que dijiste que harías, incluso cuando nadie tendría cómo comprobarlo.`;
const chooseSafeFallback = (templateId: string, exclude: string[]) => {
  const options = safeFallbacks[templateId] || safeFallbacks["jay-centered-statement"];
  const available = options.filter((option) => !exclude.some((item) => comparable(item) === comparable(option.copy)));
  const pool = available.length ? available : options;
  return pool[Date.now() % pool.length];
};

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
  for (let attempt = 0; attempt < 5; attempt += 1) {
    try {
      const result = await generateText({
        model: anthropic(model),
        providerOptions: { anthropic: { thinking: { type: "disabled" } } },
        maxOutputTokens: 1200,
        system: `Eres el editor de JAY POST STUDIO. Escribe únicamente en español latino neutro y usa conjugaciones de tú. Nunca uses voseo ni formas como notás, respondés, decís, sentís, podés, tenés, querés, hacés, sabés o sos. JAY habla de decisiones privadas que forman una vida ordinaria: cumplir la palabra sin aplausos, hábitos tolerados, conversaciones aplazadas, atención, tiempo, dinero como margen de libertad, identidad, comodidad, responsabilidad y consecuencias de seguir igual. JAY no es CoreSolutions: prohíbe clientes, empresas, equipos, liderazgo, ventas, marketing, carreras y productividad profesional. La claridad importa más que sonar profundo. Cada texto debe describir una conducta, decisión o escena reconocible; mostrar una tensión; y dejar una consecuencia o criterio concreto. No uses motivación genérica, terapia, clickbait, metáforas apiladas, emojis, hashtags ni llamadas a la acción. ${jayPerformanceEvidence} ${jayWinningMechanism} No reutilices ni parafrasees frases históricas. Devuelve solo JSON válido con title, copy, caption, optional counterpoint y optional segments. El caption debe tener exactamente dos párrafos separados por \\n\\n, entre 70 y 115 palabras, y desarrollar la idea sin repetir el copy.`,
        prompt: `Crea una idea JAY completamente nueva para la plantilla ${profile.name}. El copy debe medir entre ${profile.min} y ${profile.max} caracteres, contar una idea completa y no terminar en un conector. Instrucción específica: ${profile.guidance} ${splitInstruction} ${segmentInstruction} El título debe describir la idea en 4 a 9 palabras. Semilla creativa: ${Date.now()}-${attempt}. No uses estas ideas recientes ni variaciones cercanas:\n${exclude.join("\n") || "Ninguna."}${attempt ? "\nLa respuesta anterior no pasó la validación. Reescribe desde cero, cuenta caracteres y revisa claridad, gramática y estructura antes de responder." : ""}`,
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
        segments.length === 3 && segments.every((segment, index) => (
          segment.length >= 3 && segment.length <= (profile.segmentLimits?.[index] || profile.segmentMax || 28)
        ))
      );
      const multiLineSegmentsValid = profile.kind !== "segments" || (
        templateId !== "jay-reminder" && templateId !== "jay-venn"
      ) || segments.slice(1).every((segment) => segment.split(/\s+/).filter(Boolean).length >= 2);
      if (!copy || !title || captionWords < 70 || captionWords > 115 || paragraphs.length !== 2 || !segmentsValid || !multiLineSegmentsValid || (profile.kind === "split" && !counterpoint)) continue;
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
  console.warn(`[JAY AI] template copy rejected after validation; using calibrated fallback. ${raw.slice(0, 1200)}`);
  const fallback = chooseSafeFallback(templateId, exclude);
  return Response.json({
    ...fallback,
    caption: fallbackCaption(fallback.copy),
  });
}
