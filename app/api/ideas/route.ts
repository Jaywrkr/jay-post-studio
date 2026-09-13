import { generateText } from "ai";

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

const frames: Record<Tension, { contrast: string; mirror: string }> = {
  time: {
    contrast: "No todo lo urgente merece tu vida.",
    mirror: "El tiempo también se pierde en lo que toleras.",
  },
  freedom: {
    contrast: "La libertad no siempre se siente cómoda.",
    mirror: "Toda libertad importante trae una renuncia.",
  },
  limits: {
    contrast: "Decir que sí también es elegir un costo.",
    mirror: "Un límite no necesita una defensa larga.",
  },
  money: {
    contrast: "Ganar más no siempre compra más vida.",
    mirror: "El dinero resuelve algunos problemas y revela otros.",
  },
  identity: {
    contrast: "Cambiar incomoda a quien necesitaba que siguieras igual.",
    mirror: "No tienes que seguir siendo una versión antigua de ti.",
  },
  routine: {
    contrast: "Lo conocido no siempre es lo correcto.",
    mirror: "La rutina puede ocultar una decisión que ya no eliges.",
  },
  other: {
    contrast: "No todo necesita más esfuerzo.",
    mirror: "La parte difícil casi siempre es admitirlo.",
  },
};

const normalize = (value: unknown, max = 260) =>
  typeof value === "string"
    ? value.replace(/\s+/g, " ").trim().slice(0, max)
    : "";

const fallback = (idea: string, tension: Tension, angle: Angle): Direction[] => {
  const frame = frames[tension];
  const premise =
    angle === "direct"
      ? `Esto es lo que cuesta admitir:\n\n${idea}`
      : angle === "contrarian"
        ? `${frame.contrast}\n\n${idea}`
        : idea;
  const reminder =
    angle === "direct"
      ? "No necesitas otra excusa mejor escrita."
      : angle === "contrarian"
        ? frame.mirror
        : frame.contrast;
  return [
    {
      id: "quiet",
      title: "Decirlo sin ruido",
      label: "Quiet Paper · reflexión directa",
      templateId: "jay-quiet-paper",
      copy: premise,
    },
    {
      id: "contrast",
      title: "La pregunta incómoda",
      label: "Four Sides · tensión y remate",
      templateId: "jay-four-sides",
      copy: `${reminder}\n\nQuizá la pregunta no es cómo conseguir más.`,
      counterpoint: idea,
    },
    {
      id: "mirror",
      title: "La parte que se repite",
      label: "Mirror · idea que no puedes ignorar",
      templateId: "jay-mirror",
      copy: `${idea}\n\n${frame.mirror}`,
    },
    {
      id: "caps",
      title: "El recordatorio",
      label: "Centered Caps · una verdad frontal",
      templateId: "jay-centered-caps",
      copy: `${reminder}\n\n${idea}`,
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

export async function POST(request: Request) {
  let body: { idea?: unknown; tension?: unknown; angle?: unknown };
  try {
    body = await request.json();
  } catch {
    return Response.json({ error: "Invalid request." }, { status: 400 });
  }

  const idea = normalize(body.idea, 220);
  const tension = Object.hasOwn(frames, String(body.tension))
    ? (body.tension as Tension)
    : "other";
  const angle = ["reflective", "direct", "contrarian"].includes(String(body.angle))
    ? (body.angle as Angle)
    : "reflective";
  if (!idea) return Response.json({ error: "An idea is required." }, { status: 400 });

  const editorialRoutes = fallback(idea, tension, angle);
  if (!process.env.AI_GATEWAY_API_KEY && !process.env.VERCEL_OIDC_TOKEN) {
    return Response.json({ routes: editorialRoutes, source: "editorial" });
  }

  try {
    const { text } = await generateText({
      model: "anthropic/claude-sonnet-5",
      maxOutputTokens: 900,
      system:
        "You are the editorial partner for JAY POST STUDIO. Write only in Spanish. " +
        "The voice is observant, precise, restrained and human: never motivational, never generic, never use emojis, hashtags or calls to action. " +
        "Keep each route legible on a 1080px minimalist post. Preserve the emotional truth of the source idea; do not invent claims. " +
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
