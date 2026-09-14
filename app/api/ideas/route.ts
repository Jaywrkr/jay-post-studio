import { generateText } from "ai";
import { anthropic } from "@ai-sdk/anthropic";

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
  return `${clean.slice(0, max).replace(/\s+\S*$/, "").trim()}…`;
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
      label: "Quiet Paper · idea central",
      templateId: "jay-quiet-paper",
      copy: premise,
    },
    {
      id: "contrast",
      title: graphicCopy(frame.contrast, 50),
      label: "Four Sides · contraste",
      templateId: "jay-four-sides",
      copy: graphicCopy(frame.contrast, 100),
      counterpoint: graphicCopy(premise, 85),
    },
    {
      id: "mirror",
      title: graphicCopy(frame.mirror, 50),
      label: "Mirror · observación",
      templateId: "jay-mirror",
      copy: graphicCopy(frame.mirror, 85),
    },
    {
      id: "caps",
      title: graphicCopy(pressure, 50),
      label: "Centered Caps · presión",
      templateId: "jay-centered-caps",
      copy: graphicCopy(pressure, 85),
      uppercase: true,
    },
  ];
};

const parseDirections = (text: string): Direction[] | null => {
  const match = text.match(/\[[\s\S]*\]/);
  if (!match) return null;
  try {
    const value = JSON.parse(match[0]);
    if (!Array.isArray(value) || value.length !== 4) return null;
    const directions = value.map((item, index): Direction | null => {
      const templateId = normalize(item?.templateId, 50);
      const copy = normalize(item?.copy);
      if (!templateIds.has(templateId) || !copy) return null;
      return {
        id: `ai-${index}`,
        title: normalize(item?.title, 50) || "Nueva dirección",
        label: normalize(item?.label, 80) || "JAY direction",
        templateId,
        copy,
        ...(templateId === "jay-four-sides" && normalize(item?.counterpoint)
          ? { counterpoint: normalize(item.counterpoint) }
          : {}),
        ...(item?.uppercase === true ? { uppercase: true } : {}),
      };
    });
    return directions.every(Boolean) ? (directions as Direction[]) : null;
  } catch {
    return null;
  }
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

  const editorialRoutes = fallback(idea, tension, angle);
  if (!process.env.ANTHROPIC_API_KEY) {
    return Response.json({ routes: editorialRoutes, source: "editorial" });
  }
  if (!canGenerate(request)) {
    return Response.json({ error: "Inténtalo de nuevo en unos minutos." }, { status: 429 });
  }

  try {
    const { text } = await generateText({
      model: anthropic("claude-sonnet-5"),
      maxOutputTokens: 900,
      system:
        "You are the editorial partner for JAY POST STUDIO. Write only in Spanish. " +
        "The voice is observant, precise, restrained and human: never motivational, generic, therapeutic, decorative, or salesy; never use emojis, hashtags or calls to action. It names a hidden cost, a contradiction, an assumption, or the consequence people avoid seeing. Reference lines: 'La costumbre anestesia.' 'Tus prioridades dejan recibos.' 'La comodidad también cobra intereses.' 'No todo límite es una limitación.' Preserve the emotional truth of the source idea; do not invent claims. " +
        "Keep every route legible on a 1080px minimalist post: do not exceed 145 characters for quiet paper, 100 for four sides, 85 for mirror or centered caps. " +
        "Return only valid JSON: an array of exactly 4 objects with title, label, templateId, copy, optional counterpoint and optional uppercase. " +
        "Use these exact templateIds once each: jay-quiet-paper, jay-four-sides, jay-mirror, jay-centered-caps. " +
        "For jay-four-sides, provide a short counterpoint. Keep copy below 230 characters.",
      prompt: `Idea original: ${idea}\nTensión: ${tension}\nÁngulo editorial: ${angle}`,
    });
    const routes = parseDirections(text);
    return Response.json({ routes: routes || editorialRoutes, source: routes ? "ai" : "editorial" });
  } catch {
    return Response.json({ routes: editorialRoutes, source: "editorial" });
  }
}
