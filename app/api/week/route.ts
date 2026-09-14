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
  { day: "LUN", role: "Entrada", objective: "discovery", format: "text art", successMetric: "Alcance + compartidos", templateId: "jay-quiet-ink" },
  { day: "MAR", role: "Profundizar", objective: "depth", format: "carousel", successMetric: "Guardados", templateId: "jay-four-sides" },
  { day: "JUE", role: "Presionar", objective: "discovery", format: "SIMPLE", successMetric: "Compartidos", templateId: "jay-centered-caps" },
  { day: "VIE", role: "Aterrizar", objective: "human", format: "context", successMetric: "Comentarios con sentido", templateId: "jay-quiet-paper" },
  { day: "DOM", role: "Cerrar", objective: "direction", format: "text art", successMetric: "Seguidores ganados", templateId: "jay-quiet-paper" },
];

const layoutCycles = [
  ["jay-quiet-ink", "jay-four-sides", "jay-centered-caps", "jay-quiet-paper", "jay-grain-right"],
  ["jay-grain-left", "jay-four-sides", "jay-simple-ink", "jay-message", "jay-circle-quote"],
  ["jay-quiet-paper", "jay-four-sides", "jay-simple-paper", "jay-message", "jay-quiet-ink"],
  ["jay-mirror", "jay-four-sides", "jay-centered-caps", "jay-grain-left", "jay-quiet-paper"],
  ["jay-quiet-ink", "jay-four-sides", "jay-simple-ink", "jay-quiet-paper", "jay-grain-left"],
  ["jay-grain-right", "jay-four-sides", "jay-centered-caps", "jay-quiet-paper", "jay-circle-quote"],
  ["jay-quiet-paper", "jay-four-sides", "jay-simple-paper", "jay-grain-left", "jay-quiet-ink"],
  ["jay-circle-quote", "jay-four-sides", "jay-simple-ink", "jay-quiet-paper", "jay-grain-right"],
];

const weeklyPlansFor = (seed: string) => {
  const index = [...seed].reduce((total, char) => total + char.charCodeAt(0), 0) % layoutCycles.length;
  return plans.map((plan, postIndex) => ({ ...plan, templateId: layoutCycles[index][postIndex] }));
};

const graphicLimit = (format: Format) =>
  format === "carousel" ? 100 : format === "SIMPLE" ? 85 : format === "context" ? 155 : 145;
const graphicCopy = (value: string, max: number) => {
  const clean = normalize(value, max + 1);
  if (clean.length <= max) return clean;
  return `${clean.slice(0, max).replace(/\s+\S*$/, "").replace(/[,:;]$/, "").trim()}…`;
};

const curatedEditorialThemes: Array<Omit<Theme, "id">> = [
  { title: "El costo de tolerar", thesis: "Lo que toleras no es neutral: también diseña la vida que luego intentas cambiar.", tension: "limits" },
  { title: "La versión que sostienes", thesis: "Cambiar no siempre exige empezar de cero; a veces exige dejar de sostener una identidad que ya venció.", tension: "identity" },
  { title: "La urgencia prestada", thesis: "No todo lo que exige atención merece dirigir tu semana.", tension: "time" },
  { title: "La libertad incómoda", thesis: "La libertad aparece cuando dejas de negociar lo esencial.", tension: "freedom" },
  { title: "El precio de estar disponible", thesis: "Decir sí a todo puede parecer generosidad hasta que tu propia vida empieza a no caber.", tension: "limits" },
  { title: "La identidad de estar ocupado", thesis: "Hay cansancios que no vienen de hacer demasiado, sino de no saber por qué sigues haciéndolo.", tension: "routine" },
  { title: "La aprobación como contrato", thesis: "Cuando necesitas gustar para sentirte seguro, cada decisión empieza a tener un dueño extra.", tension: "identity" },
  { title: "La calma sin dirección", thesis: "No todo lo que se siente tranquilo te está acercando a la vida que quieres sostener.", tension: "other" },
  { title: "El dinero que no decide", thesis: "Ganar más resuelve algunos problemas, pero no sustituye elegir cómo quieres vivir.", tension: "money" },
  { title: "La comodidad que cobra", thesis: "Lo cómodo no siempre es malo; el problema empieza cuando también decide por ti.", tension: "freedom" },
  { title: "La vida administrada", thesis: "Puedes tener todo bajo control y aun así no estar construyendo nada que te importe.", tension: "time" },
  { title: "El hábito de postergar", thesis: "Aplazar una decisión pequeña muchas veces puede terminar pareciéndose a una identidad.", tension: "routine" },
];

const themeSubjects: Array<{ article: string; subject: string; tension: Tension }> = [
  { article: "La", subject: "disponibilidad", tension: "limits" }, { article: "El", subject: "cansancio", tension: "routine" },
  { article: "La", subject: "comodidad", tension: "freedom" }, { article: "La", subject: "urgencia", tension: "time" },
  { article: "El", subject: "dinero", tension: "money" }, { article: "La", subject: "rutina", tension: "routine" },
  { article: "La", subject: "aprobación", tension: "identity" }, { article: "La", subject: "paciencia", tension: "limits" },
  { article: "La", subject: "identidad", tension: "identity" }, { article: "El", subject: "control", tension: "other" },
  { article: "La", subject: "libertad", tension: "freedom" }, { article: "El", subject: "tiempo", tension: "time" },
  { article: "La", subject: "ambición", tension: "other" }, { article: "La", subject: "disciplina", tension: "routine" },
  { article: "La", subject: "culpa", tension: "identity" }, { article: "La", subject: "elección", tension: "freedom" },
  { article: "La", subject: "distracción", tension: "time" }, { article: "El", subject: "silencio", tension: "other" },
  { article: "La", subject: "productividad", tension: "routine" }, { article: "La", subject: "certeza", tension: "other" },
  { article: "El", subject: "esfuerzo", tension: "limits" }, { article: "La", subject: "lealtad", tension: "identity" },
  { article: "El", subject: "hábito", tension: "routine" }, { article: "La", subject: "expectativa", tension: "identity" },
];
const themeLenses = [
  "que termina decidiendo por ti", "que nadie cuestiona", "que cobra tarde", "que se vuelve identidad",
  "que se disfraza de fortaleza", "que te aleja sin hacer ruido", "que no te deja elegir",
  "que parece normal desde dentro", "que pide más de lo que devuelve", "que no cabe en una excusa",
  "que te hace perder el centro", "que conviene mirar de frente",
];
const themeThesis = (article: string, subject: string, lens: string) => {
  if (lens === "que nadie cuestiona") {
    return `${article} ${subject} puede pasar demasiado tiempo sin una pregunta incómoda. Esta semana abre esa conversación.`;
  }
  if (lens === "que conviene mirar de frente") {
    return `${article} ${subject} suele parecer menor de lo que es. Esta semana la mira de frente.`;
  }
  return `${article} ${subject} suele parecer menor de lo que es. Esta semana observa cómo ${lens.replace(/^que\s+/, "")}.`;
};
const editorialThemePool: Array<Omit<Theme, "id">> = [
  ...curatedEditorialThemes,
  ...themeSubjects.flatMap(({ article, subject, tension }) =>
    themeLenses.map((lens) => ({
      title: `${article} ${subject} ${lens}`,
      thesis: themeThesis(article, subject, lens),
      tension,
    })),
  ),
];

const themeFallback = (seed: string, excluded: string[] = []): Theme[] => {
  const blocked = new Set(excluded.map((title) => title.toLocaleLowerCase()));
  const available = editorialThemePool.filter(
    (theme) => !blocked.has(theme.title.toLocaleLowerCase()),
  );
  const selected = [...(available.length >= 4 ? available : editorialThemePool)]
    .sort(() => Math.random() - 0.5)
    .slice(0, 4);
  return selected.map((theme, index) => ({
    ...theme,
    id: `editorial-${Date.now().toString(36)}-${index}`,
    thesis: seed && index === 0 ? `${theme.thesis} Punto de partida: ${seed}.` : theme.thesis,
  }));
};

const fallbackFrames: Record<Tension, { reframe: string; pressure: string; human: string; close: string }> = {
  limits: {
    reframe: "Un límite no siempre te aleja de alguien. A veces te devuelve a ti.",
    pressure: "NO TODO LO QUE AGUANTAS MERECE SEGUIR SIENDO NORMAL.",
    human: "La parte difícil no fue decir que no. Fue aceptar que llevaba mucho tiempo diciendo sí por miedo.",
    close: "Proteger tu tiempo también es una forma de elegir tu vida.",
  },
  identity: {
    reframe: "Cambiar no siempre es traicionarte. A veces es dejar de interpretar una versión vencida.",
    pressure: "NO LE DEBES CONTINUIDAD A UNA VERSIÓN QUE YA NO TE REPRESENTA.",
    human: "No fue fácil soltar esa identidad. Era conocida, y lo conocido se parece mucho a la seguridad.",
    close: "No tienes que seguir explicando quién eras para empezar a vivir distinto.",
  },
  time: {
    reframe: "Lo urgente no siempre merece dirigir tu semana.",
    pressure: "ESTAR OCUPADO NO ES LO MISMO QUE ESTAR CONSTRUYENDO ALGO.",
    human: "No me faltaba tiempo. Me faltaba admitir qué cosas ya no merecían seguir ocupándolo.",
    close: "Tu agenda también revela lo que has decidido proteger.",
  },
  freedom: {
    reframe: "Toda libertad importante tiene una renuncia que al principio incomoda.",
    pressure: "LA COMODIDAD TAMBIÉN PUEDE DECIDIR POR TI.",
    human: "Elegir distinto no se sintió libre al inicio. Se sintió como dejar de tener una excusa.",
    close: "La libertad no elimina el costo. Te deja elegir cuál estás dispuesto a pagar.",
  },
  money: {
    reframe: "Ganar más resuelve algunos problemas. No resuelve decidir qué quieres hacer con tu vida.",
    pressure: "MÁS DINERO NO SIEMPRE COMPRA MÁS CONTROL SOBRE TU TIEMPO.",
    human: "La pregunta dejó de ser cuánto podía ganar. Empezó a ser cuánto de mi vida quería vender para lograrlo.",
    close: "El dinero ayuda. Pero no puede elegir por ti qué significa suficiente.",
  },
  routine: {
    reframe: "Lo repetido puede parecer correcto solo porque ya no tienes que pensarlo.",
    pressure: "UN HÁBITO NORMAL TAMBIÉN PUEDE ESTAR DECIDIENDO TU VIDA.",
    human: "No había una gran crisis. Había una rutina que llevaba demasiado tiempo evitando revisar.",
    close: "Cambiar una rutina empieza cuando dejas de llamarla inevitable.",
  },
  other: {
    reframe: "No todo lo que parece estable está realmente en su lugar.",
    pressure: "LO QUE EVITAS MIRAR TAMBIÉN TERMINA ORGANIZANDO TU VIDA.",
    human: "No necesitaba una respuesta nueva. Necesitaba dejar de negociar con lo que ya entendía.",
    close: "Una decisión honesta suele empezar antes de que tengas todas las respuestas.",
  },
};

const fallbackWeek = (
  topic: string,
  tension: Tension,
  weeklyPlans = plans,
  weekTitle = "Semana JAY",
): Week => {
  const premise = graphicCopy(topic || "Lo que toleras en silencio también construye la vida de la que luego quieres escapar.", 145);
  const frame = fallbackFrames[tension];
  const posts: WeekPost[] = [
    {
      ...weeklyPlans[0], pillar: "Autorresponsabilidad", title: "La entrada", label: "Texto art · entrada", copy: premise,
      caption: `Hay cosas que no se rompen de golpe. Se aceptan poco a poco hasta que un día ya parecen parte de tu carácter.\n\nLa pregunta no es solo qué quieres cambiar. También es qué has estado enseñándole a tu vida que puede seguir tolerando.`,
    },
    {
      ...weeklyPlans[1], pillar: "La idea detrás", title: "La idea detrás", label: "Carrusel · contraste", copy: frame.reframe, counterpoint: premise,
      caption: `Hay ideas que solo se vuelven claras cuando las miras en partes. Esta es una de ellas.\n\nNo se trata de juzgar tu punto de partida. Se trata de distinguir qué parte de tu vida sigue siendo una elección y cuál ya funciona por inercia.`,
      slides: [graphicCopy(premise, 85), frame.reframe, frame.pressure, frame.close],
    },
    {
      ...weeklyPlans[2], pillar: "La presión", title: "El golpe", label: "SIMPLE · contraste", copy: frame.pressure, uppercase: true,
      caption: `Hay una versión de la fortaleza que solo sabe aguantar. Y por fuera incluso puede verse admirable.\n\nPero sostener algo sin revisarlo no siempre es resistencia. A veces es postergar la conversación que te devolvería margen para decidir.`,
    },
    {
      ...weeklyPlans[3], pillar: "Proceso real", title: "La escena humana", label: "Contexto · proceso real", copy: frame.human,
      caption: `Esto no lo escribo desde una versión resuelta. Lo escribo desde el momento incómodo en que una idea deja de ser teoría y empieza a tocar una decisión propia.\n\nNo todo cambio llega como una ruptura. Algunos empiezan cuando dejas de justificar lo que ya te pesa.`,
    },
    {
      ...weeklyPlans[4], pillar: "La idea central", title: "El cierre", label: "Texto art · cierre", copy: frame.close,
      caption: `No necesitas convertir esta semana en una reinvención. Basta con mirar una decisión que estabas dejando en automático.\n\nCuando esa parte se vuelve visible, ya no es tan fácil seguir llamándola normal.`,
    },
  ];
  return { title: weekTitle, thesis: premise, arc: "Abrir → mostrar el costo → presionar → volverlo humano → cerrar", posts };
};

const parseThemes = (text: string, excluded: string[] = []): Theme[] | null => {
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
    const blocked = new Set(excluded.map((title) => title.toLocaleLowerCase()));
    const distinct = new Set(themes.map((item) => item.title.toLocaleLowerCase()));
    return themes.every((item) => item.title && item.thesis && !blocked.has(item.title.toLocaleLowerCase())) && distinct.size === 4 ? themes : null;
  } catch { return null; }
};

const parseWeek = (text: string, weeklyPlans = plans): Week | null => {
  const match = text.match(/\{[\s\S]*\}/);
  if (!match) return null;
  try {
    const value = JSON.parse(match[0]);
    if (!Array.isArray(value?.posts) || value.posts.length !== 5) return null;
    const posts: Array<WeekPost | null> = value.posts.map((item: Record<string, unknown>, index: number): WeekPost | null => {
      const plan = weeklyPlans[index];
      const templateId = plan.templateId;
      const copy = normalCaption(item.copy);
      const caption = normalCaption(item.caption);
      if (!copy || !caption || copy.length > graphicLimit(plan.format)) return null;
      const slides = Array.isArray(item.slides)
        ? item.slides.map((slide: unknown) => normalize(slide, 85)).filter(Boolean).slice(0, 5)
        : undefined;
      if (plan.format === "carousel" && (!slides || slides.length < 4)) return null;
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
  let body: { mode?: unknown; seed?: unknown; topic?: unknown; title?: unknown; tension?: unknown; exclude?: unknown };
  try { body = await request.json(); } catch { return Response.json({ error: "Invalid request." }, { status: 400 }); }
  const mode = body.mode === "themes" ? "themes" : "week";
  const seed = normalize(body.seed, 220);
  const topic = normalize(body.topic, 240);
  const title = normalize(body.title, 65);
  const tension = tensions.has(String(body.tension) as Tension) ? body.tension as Tension : "other";
  const excluded = Array.isArray(body.exclude)
    ? body.exclude.map((item) => normalize(item, 55)).filter(Boolean).slice(-500)
    : [];
  const weeklyPlans = weeklyPlansFor(`${title} ${topic}`);

  if (mode === "week" && !topic) return Response.json({ error: "A weekly theme is required." }, { status: 400 });
  if (!process.env.ANTHROPIC_API_KEY) {
    return Response.json(mode === "themes" ? { themes: themeFallback(seed, excluded), source: "editorial" } : { week: fallbackWeek(topic, tension, weeklyPlans, title), source: "editorial" });
  }
  if (!canGenerate(request)) return Response.json({ error: "Try again in a few minutes." }, { status: 429 });

  try {
    if (mode === "themes") {
      const { text } = await generateText({
        model: anthropic("claude-sonnet-5"),
        maxOutputTokens: 700,
        system: "You are the editorial partner for JAY POST STUDIO. Write only in Spanish. Generate ideas for a thoughtful personal brand, not motivational quotes. Voice: precise, restrained, human and slightly uncomfortable. Return only valid JSON: exactly 4 objects with title, thesis, tension. tension must be one of time, freedom, limits, money, identity, routine, other. Each idea must sustain five distinct but coherent posts across one week. Every request must explore fresh angles and never recycle a title the user already saw.",
        prompt: `Optional starting thought: ${seed || "No seed. Find a fresh tension for JAY."}\nDo not repeat these previous titles: ${excluded.length ? excluded.join(" | ") : "none"}.`,
      });
      const themes = parseThemes(text, excluded);
      return Response.json({ themes: themes || themeFallback(seed, excluded), source: themes ? "ai" : "editorial" });
    }
    const { text } = await generateText({
      model: anthropic("claude-sonnet-5"),
      maxOutputTokens: 1800,
      system: "You are the editorial partner for JAY POST STUDIO. Write only in Spanish. Build one complete five-post week for a personal brand. Each post must stand alone, but together must create a deliberate arc: opening promise, deeper reframe, direct pressure, human grounding, and memorable close. Never motivational, generic, salesy, use emojis, hashtags, or direct calls to action. Return only valid JSON object with title, thesis, arc, and posts. posts must be exactly 5 objects in this fixed order. Each object needs title, label, copy, caption, pillar, optional counterpoint, uppercase, slides. Every caption has two concise paragraphs: context first, then a precise conclusion. Graphic copy limits are strict: text art max 145 characters, carousel cover max 100, SIMPLE max 85, context max 155. Carousel slides must be 4 or 5 coherent steps, each max 85 characters: hook, reframe, tension, closure. Do not merely restate the visual copy in a caption. Make every post useful, specific, and ready to publish.",
      prompt: `Tema semanal: ${topic}\nNombre del tema: ${title || "Semana JAY"}\nTensión: ${tension}\nEstructura visual obligatoria: ${weeklyPlans.map((plan) => `${plan.day}: ${plan.format} (${plan.templateId})`).join(" | ")}\nObjetivo: crecer una marca personal reconocible por ideas precisas que cuestionan lo que la gente tolera.`,
    });
    const parsedWeek = parseWeek(text, weeklyPlans);
    const week = parsedWeek ? { ...parsedWeek, title: title || parsedWeek.title } : null;
    return Response.json({ week: week || fallbackWeek(topic, tension, weeklyPlans, title), source: week ? "ai" : "editorial" });
  } catch {
    return Response.json(mode === "themes" ? { themes: themeFallback(seed, excluded), source: "editorial" } : { week: fallbackWeek(topic, tension, weeklyPlans, title), source: "editorial" });
  }
}
