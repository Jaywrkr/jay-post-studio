import { generateText } from "ai";
import { createAnthropic } from "@ai-sdk/anthropic";
import { isTooCloseToJayHistory, jayPerformanceEvidence, jayWinningMechanism } from "@/lib/jay-evidence";

type Tension =
  | "time"
  | "freedom"
  | "limits"
  | "money"
  | "identity"
  | "routine"
  | "other";
type Angle = "reflective" | "direct" | "contrarian";
type Direction = {
  id: string;
  title: string;
  templateId: string;
  label: string;
  copy: string;
  counterpoint?: string;
  uppercase?: boolean;
};

const templateIds = new Set([
  "jay-quiet-paper",
  "jay-four-sides",
  "jay-mirror",
  "jay-centered-caps",
]);
const requestWindows = new Map<string, { count: number; resetAt: number }>();
const requestLimit = 8;
const requestWindowMs = 10 * 60 * 1000;
const model = process.env.ANTHROPIC_MODEL || "claude-sonnet-5";
const anthropic = createAnthropic({
  headers: process.env.ANTHROPIC_WORKSPACE_ID
    ? { "anthropic-workspace-id": process.env.ANTHROPIC_WORKSPACE_ID }
    : undefined,
});
const reportGenerationFailure = (error: unknown) => {
  const detail = error instanceof Error ? `${error.name}: ${error.message}` : "Unknown provider error";
  console.error(`[JAY AI] idea generation failed with ${model}. ${detail}`);
};
const coreSolutionsPattern = /\b(cliente|clientes|empresa|empresas|equipo|equipos|liderazgo|líder|líderes|salario|ascenso|networking|mentor|mentoría|industria|ventas|marketing|empleabilidad|certificaci[oó]n|freelanc\w*|coaching|roi|impuestos|delegaci[oó]n|carrera profesional|marca personal)\b/i;
const foreignLeakPattern = /\b(after|before|because|actually|however|though|maybe|still|work|job|business|career|team|client|meeting|deadline|feedback|growth|leadership)\b/i;
const jayEditorialWorld = "JAY speaks about the private decisions that shape an ordinary life: keeping your word when nobody applauds; what repeated silence and tolerated habits eventually cost; changing before a crisis forces you; time, attention and postponed conversations; money as margin and freedom; identity, comfort, responsibility and the consequences of staying the same. JAY is not CoreSolutions. Never introduce clients, companies, teams, leadership, salaries, careers, sales, marketing, networking, mentoring, consulting, workplace performance or business productivity unless those subjects are explicitly present in the user's original idea.";
const jayClarityRule = "Clarity matters more than brevity. Every line must be grammatical, complete and immediately understandable without a caption. Do not delete context to sound minimal. Avoid vague pseudo-profundity and avoid stacking metaphors. Keep one observation, one tension and one consequence.";
const jayReferenceVoice = "Verified high-performing JAY references: 'El orgullo silencioso de cumplir tu palabra vale más que cualquier reconocimiento externo que puedas recibir.' 'Lo que repites en silencio termina pesando más que lo que prometes en voz alta.' 'No todo cambio necesita una gran razón. A veces basta con que ya no quieras seguir igual.' 'Puedes agradecer profundamente una etapa y no querer regresar jamás.' 'El futuro no respeta tus excusas.' 'El tiempo no avisa cuándo deja de esperar.' 'Quien resuelve gana tiempo. Quien solo explica, lo pierde justificándose.' Study their mechanisms: a recognizable behavior, a moral or emotional tension, and a consequence. Do not reuse, remix or closely paraphrase their wording.";
const jayEvidence = `${jayPerformanceEvidence} ${jayWinningMechanism}`;
const jayQualityGate = "Silently reject and rewrite any direction that fails one of these tests: it is immediately understandable; it identifies a real behavior, decision or scene; it contains one tension or consequence; it avoids generic coaching; it is not a paraphrase of a reference or another direction.";

const frames: Record<Tension, { contrast: string; mirror: string; pressure: string }> = {
  time: {
    contrast: "La velocidad no corrige el rumbo.",
    mirror: "Tus prioridades dejan recibos.",
    pressure: "TU CALENDARIO NUNCA DICE ALGÚN DÍA.",
  },
  freedom: {
    contrast: "No toda seguridad es libertad.",
    mirror: "La comodidad también cobra intereses.",
    pressure: "LA LIBERTAD NECESITA ESPACIO VACÍO.",
  },
  limits: {
    contrast: "No todo límite es una limitación.",
    mirror: "Tus límites revelan tus prioridades.",
    pressure: "SER FUERTE TAMBIÉN ES RETIRARSE.",
  },
  money: {
    contrast: "No todo lo importante produce dinero.",
    mirror: "Lo suficiente necesita una definición.",
    pressure: "NO TODO LO QUE PRODUCE DINERO IMPORTA.",
  },
  identity: {
    contrast: "Cambiar de opinión no es inconsistencia.",
    mirror: "No todo cambio necesita explicación.",
    pressure: "NO NECESITAS PERMISO PARA CAMBIAR.",
  },
  routine: {
    contrast: "La rutina puede esconder una renuncia.",
    mirror: "La disciplina también necesita auditorías.",
    pressure: "LA COSTUMBRE ANESTESIA.",
  },
  other: {
    contrast: "No toda paz merece silencio.",
    mirror: "La curiosidad también es disciplina.",
    pressure: "EL EGO ODIA LAS PREGUNTAS CORRECTAS.",
  },
};

const normalize = (value: unknown, max = 260) =>
  typeof value === "string"
    ? value.replace(/\s+/g, " ").trim().slice(0, max)
    : "";
const graphicCopy = (value: string, max: number) => {
  const clean = normalize(value, max + 1);
  if (clean.length <= max) return clean;
  const sentences = clean.match(/[^.!?]+[.!?]+/g) || [];
  const complete = sentences.find((sentence) => sentence.trim().length <= max)?.trim();
  if (complete) return complete;
  const shortened = clean.slice(0, Math.max(1, max - 1)).replace(/\s+\S*$/, "").replace(/[,:;\-–—]+$/, "").trim();
  return `${shortened}.`;
};
const decodeJson = (text: string): unknown => {
  const clean = text.trim().replace(/^```(?:json)?\s*/i, "").replace(/\s*```$/, "");
  const candidates = [clean, clean.match(/\[[\s\S]*\]/)?.[0], clean.match(/\{[\s\S]*\}/)?.[0]];
  for (const candidate of candidates) {
    if (!candidate) continue;
    try { return JSON.parse(candidate); } catch { /* Try the next valid shape. */ }
  }
  return null;
};
const copyLimit = (templateId: string) =>
  templateId === "jay-quiet-paper" ? 145 : templateId === "jay-four-sides" ? 100 : 85;
const strictCopy = (value: unknown, max: number) => {
  const clean = typeof value === "string" ? value.replace(/\s+/g, " ").trim() : "";
  if (!clean || clean.length > max) return "";
  if (clean.split(/\s+/).length < 6) return "";
  if (/\b(que|de|del|la|el|los|las|un|una|con|sin|por|para|sobre|porque|aunque|cuando|como|si|y|o)$/i.test(clean.replace(/[¿?¡!.,;:]+$/, "").trim())) return "";
  return clean;
};

const fallback = (idea: string, tension: Tension, angle: Angle): Direction[] => {
  const frame = frames[tension];
  const premise = angle === "direct"
    ? graphicCopy(`Esto es lo que cuesta admitir: ${idea}`, 145)
    : angle === "contrarian"
      ? graphicCopy(`${frame.contrast} ${idea}`, 145)
      : graphicCopy(idea, 145);
  const pressure = frame.pressure;
  return [
    {
      id: "quiet",
      title: graphicCopy(premise, 50),
      label: "Papel sobrio · idea central",
      templateId: "jay-quiet-paper",
      copy: premise,
    },
    {
      id: "contrast",
      title: graphicCopy(frame.contrast, 50),
      label: "Cuatro lados · contraste",
      templateId: "jay-four-sides",
      copy: graphicCopy(frame.contrast, 100),
      counterpoint: graphicCopy(premise, 85),
    },
    {
      id: "mirror",
      title: graphicCopy(frame.mirror, 50),
      label: "Espejo · observación",
      templateId: "jay-mirror",
      copy: graphicCopy(frame.mirror, 85),
    },
    {
      id: "caps",
      title: graphicCopy(pressure, 50),
      label: "Mayúsculas centradas · presión",
      templateId: "jay-centered-caps",
      copy: graphicCopy(pressure, 85),
      uppercase: true,
    },
  ];
};

const parseDirections = (text: string, allowProfessional = false): Direction[] | null => {
  const decoded = decodeJson(text);
  const value = Array.isArray(decoded)
    ? decoded
    : decoded && typeof decoded === "object" && Array.isArray((decoded as { routes?: unknown }).routes)
      ? (decoded as { routes: unknown[] }).routes
      : null;
  if (!value) return null;
  try {
    if (value.length !== 4) return null;
    const directions = value.map((item, index): Direction | null => {
      const templateId = normalize(item?.templateId, 50);
      const copy = strictCopy(item?.copy, copyLimit(templateId));
      const counterpoint = strictCopy(item?.counterpoint, 85);
      const completeRoute = `${item?.title || ""} ${copy} ${counterpoint}`;
      if (!templateIds.has(templateId) || !copy || foreignLeakPattern.test(completeRoute) || (!allowProfessional && coreSolutionsPattern.test(completeRoute)) || isTooCloseToJayHistory(completeRoute)) return null;
      if (templateId === "jay-four-sides" && !counterpoint) return null;
      return {
        id: `ai-${index}`,
        title: normalize(item?.title, 50) || "Nueva dirección",
        label: normalize(item?.label, 80) || "Dirección JAY",
        templateId,
        copy,
        ...(templateId === "jay-four-sides"
          ? { counterpoint }
          : {}),
        ...(item?.uppercase === true ? { uppercase: true } : {}),
      };
    });
    return directions.every(Boolean) ? (directions as Direction[]) : null;
  } catch { return null; }
};

const canGenerate = (request: Request) => {
  const now = Date.now();
  const client = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "unknown";
  const current = requestWindows.get(client);
  if (!current || current.resetAt <= now) {
    requestWindows.set(client, { count: 1, resetAt: now + requestWindowMs });
    return true;
  }
  if (current.count >= requestLimit) return false;
  current.count += 1;
  return true;
};

export async function POST(request: Request) {
  let body: { idea?: unknown; tension?: unknown; angle?: unknown };
  try {
    body = await request.json();
  } catch {
    return Response.json({ error: "Solicitud inválida." }, { status: 400 });
  }

  const idea = normalize(body.idea, 220);
  const tension = Object.hasOwn(frames, String(body.tension))
    ? (body.tension as Tension)
    : "other";
  const angle = ["reflective", "direct", "contrarian"].includes(String(body.angle))
    ? (body.angle as Angle)
    : "reflective";
  if (!idea) return Response.json({ error: "Escribe una idea primero." }, { status: 400 });

  if (!process.env.ANTHROPIC_API_KEY) {
    console.warn("[JAY AI] ANTHROPIC_API_KEY is unavailable; refusing to create filler directions.");
    return Response.json({ error: "Claude no está disponible. No se crearon direcciones de relleno." }, { status: 503 });
  }
  if (!process.env.ANTHROPIC_WORKSPACE_ID) {
    console.warn("[JAY AI] ANTHROPIC_WORKSPACE_ID is unavailable; an unscoped key may be rejected by Anthropic.");
  }
  if (!canGenerate(request)) {
    return Response.json({ error: "Inténtalo de nuevo en unos minutos." }, { status: 429 });
  }

  try {
    const allowProfessional = coreSolutionsPattern.test(idea);
    let text = "";
    let routes: Direction[] | null = null;
    for (let attempt = 0; attempt < 2 && !routes; attempt += 1) {
      const result = await generateText({
        model: anthropic(model),
        providerOptions: { anthropic: { thinking: { type: "disabled" } } },
        maxOutputTokens: 2100,
        system: `You are the editorial partner for JAY POST STUDIO. Write only in neutral Latin American Spanish using tú forms; never use voseo or insert an English word. ${jayEditorialWorld} ${jayClarityRule} ${jayReferenceVoice} ${jayEvidence} ${jayQualityGate} Preserve the exact human truth of the source idea instead of attaching an unrelated aphorism. Create four genuinely different treatments: a developed observation, a clean contrast, a human reframing and a direct claim. Never motivational, therapeutic, clickbait, generic, decorative or salesy. Never use emojis, hashtags or calls to action. Use complete sentences with at least six words. Every copy must communicate its full idea by itself; never put the missing consequence in a second sentence that would exceed the visual limit. Keep every route legible on a 1080px post: maximum 145 characters for quiet paper, 100 for four sides, 85 for mirror or centered caps. Count characters before returning; the app rejects instead of truncating. Return only valid JSON: exactly 4 objects with title, label, templateId, copy, optional counterpoint and optional uppercase. Use these exact templateIds once each: jay-quiet-paper, jay-four-sides, jay-mirror, jay-centered-caps. For jay-four-sides provide a short counterpoint.`,
        prompt: `Idea original: ${idea}\nTensión: ${tension}\nÁngulo editorial: ${angle}.${attempt ? " La respuesta anterior resultó confusa, ajena a JAY o incumplió la estructura. Reescríbela desde cero con más claridad." : ""}`,
      });
      text = result.text;
      routes = parseDirections(text, allowProfessional);
    }
    if (!routes) {
      console.warn(`[JAY AI] Idea response failed JAY scope or parsing. Raw response: ${text.slice(0, 2400)}`);
      return Response.json({ error: "Claude no produjo direcciones con la calidad JAY requerida. Inténtalo otra vez." }, { status: 502 });
    }
    return Response.json({ routes, source: "ai" });
  } catch (error) {
    reportGenerationFailure(error);
    return Response.json({ error: "No se pudieron crear direcciones JAY con Claude. Inténtalo otra vez." }, { status: 502 });
  }
}

void fallback;
