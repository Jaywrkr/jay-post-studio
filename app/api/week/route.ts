import { generateText } from "ai";
import { anthropic } from "@ai-sdk/anthropic";

type Tension = "time" | "freedom" | "limits" | "money" | "identity" | "routine" | "other";
type Objective = "discovery" | "depth" | "human" | "direction";
type Format = "text art" | "SIMPLE" | "carousel" | "context";
type Theme = { id: string; title: string; thesis: string; tension: Tension };
type WeekPost = {
  day: string;
  role: string;
  objective: Objective;
  format: Format;
  pillar: string;
  successMetric: string;
  title: string;
  label: string;
  templateId: string;
  copy: string;
  caption: string;
  counterpoint?: string;
  uppercase?: boolean;
  slides?: string[];
};
type Week = { title: string; thesis: string; arc: string; posts: WeekPost[] };

const tensions = new Set<Tension>(["time", "freedom", "limits", "money", "identity", "routine", "other"]);
const requestWindows = new Map<string, { count: number; resetAt: number }>();
const requestLimit = 8;
const requestWindowMs = 10 * 60 * 1000;

const normalize = (value: unknown, max = 420) =>
  typeof value === "string" ? value.replace(/\s+/g, " ").trim().slice(0, max) : "";
const normalCaption = (value: unknown) =>
  typeof value === "string"
    ? value.replace(/\r/g, "").replace(/\n{3,}/g, "\n\n").trim().slice(0, 900)
    : "";

const plans: Array<Pick<WeekPost, "day" | "role" | "objective" | "format" | "successMetric" | "templateId">> = [
  { day: "LUN", role: "Entrada", objective: "discovery", format: "text art", successMetric: "Alcance + compartidos", templateId: "jay-mirror" },
  { day: "MAR", role: "Profundizar", objective: "depth", format: "carousel", successMetric: "Guardados", templateId: "jay-four-sides" },
  { day: "JUE", role: "Presionar", objective: "discovery", format: "SIMPLE", successMetric: "Compartidos", templateId: "jay-centered-caps" },
  { day: "VIE", role: "Aterrizar", objective: "human", format: "context", successMetric: "Comentarios con sentido", templateId: "jay-quiet-paper" },
  { day: "DOM", role: "Cerrar", objective: "direction", format: "text art", successMetric: "Seguidores ganados", templateId: "jay-mirror" },
];

const themeFallback = (seed: string): Theme[] => {
  const root = seed || "La vida que construyes mientras intentas cumplir con todo";
  return [
    { id: "tolerar", title: "El costo de tolerar", thesis: `${root}. Lo que toleras no es neutral: también diseña tu vida.`, tension: "limits" },
    { id: "version", title: "La versión que sostienes", thesis: "Cambiar no siempre exige empezar de cero; a veces exige dejar de sostener una identidad que ya venció.", tension: "identity" },
    { id: "urgencia", title: "La urgencia prestada", thesis: "No todo lo que exige atención merece dirigir tu semana.", tension: "time" },
    { id: "libertad", title: "La libertad incómoda", thesis: "La libertad no aparece cuando todo es fácil, sino cuando dejas de negociar lo esencial.", tension: "freedom" },
  ];
};

const fallbackWeek = (topic: string, tension: Tension): Week => {
  const premise = topic || "Lo que toleras en silencio también construye la vida de la que luego quieres escapar.";
  const posts: WeekPost[] = [
    {
      ...plans[0], pillar: "Autorresponsabilidad", title: "La entrada", label: "Mirror · texto denso", copy: premise,
      caption: `Hay cosas que no se rompen de golpe. Se aceptan poco a poco hasta que un día ya parecen parte de tu carácter.\n\nLa pregunta no es solo qué quieres cambiar. También es qué has estado enseñándole a tu vida que puede seguir tolerando.`,
    },
    {
      ...plans[1], pillar: "El costo invisible", title: "La idea detrás", label: "Carousel · contraste", copy: "Lo que toleras no siempre te destruye. A veces solo te distrae de construir algo mejor.", counterpoint: premise,
      caption: `Tolerar no siempre parece una decisión. Por eso es tan difícil verla.\n\nEste carrusel no es para juzgar lo que aún no cambias. Es para distinguir entre paciencia y resignación.`,
      slides: ["Lo que toleras no siempre te destruye.", "A veces solo te distrae.", "La paciencia tiene una dirección.", "La resignación también."],
    },
    {
      ...plans[2], pillar: "Límites", title: "El golpe", label: "SIMPLE · contraste", copy: "NO TODO LO QUE SOPORTAS TE HACE MÁS FUERTE.", uppercase: true,
      caption: `Hay una versión de la fortaleza que solo sabe aguantar.\n\nPero aguantar no siempre es resistir. A veces es posponer la conversación que podría devolverte tiempo, energía o dignidad.`,
    },
    {
      ...plans[3], pillar: "Proceso real", title: "La escena humana", label: "Quiet Paper · contexto", copy: "La parte difícil no fue cambiar. Fue admitir cuánto tiempo había llamado paciencia a no decidir.",
      caption: `Esto no lo escribo desde una versión resuelta de mí. Lo escribo porque sigo notando los lugares donde normalizo lo que ya me pesa.\n\nNo todo cambio empieza con una decisión grande. Algunos empiezan cuando dejas de justificar lo obvio.`,
    },
    {
      ...plans[4], pillar: "La idea central", title: "El cierre", label: "Mirror · recordatorio", copy: "Tu vida no cambia cuando encuentras una respuesta perfecta. Cambia cuando dejas de proteger lo que ya sabes que te cuesta demasiado.",
      caption: `No necesitas convertir esta semana en una reinvención. Basta con mirar una cosa que has estado tolerando y dejar de llamarla normal.\n\nEso también cuenta como empezar.`,
    },
  ];
  return { title: "El costo de tolerar", thesis: premise, arc: "Observar → nombrar el costo → confrontar → aterrizar → integrar", posts };
};

const parseThemes = (text: string): Theme[] | null => {
  const match = text.match(/\[[\s\S]*\]/);
  if (!match) return null;
  try {
    const value = JSON.parse(match[0]);
    if (!Array.isArray(value) || value.length !== 4) return null;
    const themes = value.map((item, index) => ({
      id: `ai-theme-${index}`,
      title: normalize(item?.title, 55),
      thesis: normalize(item?.thesis, 240),
      tension: tensions.has(item?.tension) ? item.tension as Tension : "other",
    }));
    return themes.every((item) => item.title && item.thesis) ? themes : null;
  } catch { return null; }
};

const parseWeek = (text: string): Week | null => {
  const match = text.match(/\{[\s\S]*\}/);
  if (!match) return null;
  try {
    const value = JSON.parse(match[0]);
    if (!Array.isArray(value?.posts) || value.posts.length !== 5) return null;
    const posts: Array<WeekPost | null> = value.posts.map((item: Record<string, unknown>, index: number): WeekPost | null => {
      const plan = plans[index];
      const templateId = plan.templateId;
      const copy = normalCaption(item.copy);
      const caption = normalCaption(item.caption);
      if (!copy || !caption) return null;
      const slides = Array.isArray(item.slides)
        ? item.slides.map((slide: unknown) => normalize(slide, 100)).filter(Boolean).slice(0, 5)
        : undefined;
      return {
        ...plan,
        title: normalize(item.title, 55) || plan.role,
        label: normalize(item.label, 80) || `${plan.format} · ${plan.role}`,
        templateId,
        copy,
        caption,
        pillar: normalize(item.pillar, 65) || "Idea central",
        ...(templateId === "jay-four-sides" && normalize(item.counterpoint) ? { counterpoint: normalize(item.counterpoint) } : {}),
        ...(plan.format === "SIMPLE" ? { uppercase: true } : {}),
        ...(slides?.length ? { slides } : {}),
      };
    });
    if (posts.some((post) => !post)) return null;
    return {
      title: normalize(value.title, 65) || "Semana JAY",
      thesis: normalize(value.thesis, 240),
      arc: normalize(value.arc, 180) || "Observar → confrontar → integrar",
      posts: posts as WeekPost[],
    };
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
  let body: { mode?: unknown; seed?: unknown; topic?: unknown; tension?: unknown };
  try { body = await request.json(); } catch { return Response.json({ error: "Invalid request." }, { status: 400 }); }
  const mode = body.mode === "themes" ? "themes" : "week";
  const seed = normalize(body.seed, 220);
  const topic = normalize(body.topic, 240);
  const tension = tensions.has(String(body.tension) as Tension) ? body.tension as Tension : "other";

  if (mode === "week" && !topic) return Response.json({ error: "A weekly theme is required." }, { status: 400 });
  if (!process.env.ANTHROPIC_API_KEY) {
    return Response.json(mode === "themes" ? { themes: themeFallback(seed), source: "editorial" } : { week: fallbackWeek(topic, tension), source: "editorial" });
  }
  if (!canGenerate(request)) return Response.json({ error: "Try again in a few minutes." }, { status: 429 });

  try {
    if (mode === "themes") {
      const { text } = await generateText({
        model: anthropic("claude-sonnet-5"),
        maxOutputTokens: 700,
        system: "You are the editorial partner for JAY POST STUDIO. Write only in Spanish. Generate ideas for a thoughtful personal brand, not motivational quotes. Voice: precise, restrained, human and slightly uncomfortable. Return only valid JSON: exactly 4 objects with title, thesis, tension. tension must be one of time, freedom, limits, money, identity, routine, other. Each idea must sustain five distinct but coherent posts across one week.",
        prompt: `Optional starting thought: ${seed || "No seed. Find the most relevant tension for JAY."}`,
      });
      return Response.json({ themes: parseThemes(text) || themeFallback(seed), source: parseThemes(text) ? "ai" : "editorial" });
    }
    const { text } = await generateText({
      model: anthropic("claude-sonnet-5"),
      maxOutputTokens: 1800,
      system: "You are the editorial partner for JAY POST STUDIO. Write only in Spanish. Build one coherent five-post week for a personal brand. Each post must stand alone, but together they should feel like five perspectives around one central tension: entry, depth, pressure, human grounding, and closure. Never motivational, generic, salesy, use emojis, hashtags, or direct calls to action. Return only valid JSON object with title, thesis, arc, and posts. posts must be exactly 5 objects in this fixed order: (1) text art discovery / jay-mirror, (2) carousel depth / jay-four-sides with 4-5 short slides and counterpoint, (3) SIMPLE discovery / jay-centered-caps / uppercase true, (4) personal context / jay-quiet-paper, (5) closing text art / jay-mirror. Each object needs title, label, templateId, copy, caption, pillar, optional counterpoint, uppercase, slides. Copy must fit a 1080px graphic; captions should be 2 concise paragraphs and add meaning instead of repeating the image.",
      prompt: `Tema semanal: ${topic}\nTensión: ${tension}\nObjetivo: crecer una marca personal reconocible por ideas precisas que cuestionan lo que la gente tolera.`,
    });
    const week = parseWeek(text);
    return Response.json({ week: week || fallbackWeek(topic, tension), source: week ? "ai" : "editorial" });
  } catch {
    return Response.json(mode === "themes" ? { themes: themeFallback(seed), source: "editorial" } : { week: fallbackWeek(topic, tension), source: "editorial" });
  }
}
