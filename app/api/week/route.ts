import { generateText } from "ai";
import { createAnthropic } from "@ai-sdk/anthropic";

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
const model = process.env.ANTHROPIC_MODEL || "claude-sonnet-5";
const anthropic = createAnthropic({
  headers: process.env.ANTHROPIC_WORKSPACE_ID
    ? { "anthropic-workspace-id": process.env.ANTHROPIC_WORKSPACE_ID }
    : undefined,
});
const reportGenerationFailure = (area: string, error: unknown) => {
  const detail = error instanceof Error ? `${error.name}: ${error.message}` : "Unknown provider error";
  console.error(`[JAY AI] ${area} failed with ${model}. ${detail}`);
};

const normalize = (value: unknown, max = 420) =>
  typeof value === "string" ? value.replace(/\s+/g, " ").trim().slice(0, max) : "";
const normalCaption = (value: unknown) =>
  typeof value === "string"
    ? value.replace(/\r/g, "").replace(/\n{3,}/g, "\n\n").trim().slice(0, 900)
    : "";
const decodeJson = (text: string): unknown => {
  const clean = text.trim().replace(/^```(?:json)?\s*/i, "").replace(/\s*```$/, "");
  const candidates = [clean, clean.match(/\[[\s\S]*\]/)?.[0], clean.match(/\{[\s\S]*\}/)?.[0]];
  for (const candidate of candidates) {
    if (!candidate) continue;
    try { return JSON.parse(candidate); } catch { /* Try the next JSON shape. */ }
  }
  return null;
};

const plans: Array<Pick<WeekPost, "day" | "role" | "objective" | "format" | "successMetric" | "templateId">> = [
  { day: "LUN", role: "Observación", objective: "discovery", format: "text art", successMetric: "Alcance + compartidos", templateId: "jay-quiet-ink" },
  { day: "MAR", role: "Contraste", objective: "depth", format: "carousel", successMetric: "Guardados", templateId: "jay-four-sides" },
  { day: "JUE", role: "Consecuencia", objective: "discovery", format: "SIMPLE", successMetric: "Compartidos", templateId: "jay-centered-caps" },
  { day: "VIE", role: "Vida real", objective: "human", format: "context", successMetric: "Comentarios con sentido", templateId: "jay-quiet-paper" },
  { day: "DOM", role: "Criterio", objective: "direction", format: "text art", successMetric: "Seguidores ganados", templateId: "jay-quiet-paper" },
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

const jayCorpusThemes: Array<[string, Tension]> = [
  ["No todo consejo merece obediencia", "other"],
  ["Ser fuerte también es retirarse", "limits"],
  ["Hay problemas que alimentas resolviéndolos", "routine"],
  ["El tiempo revela prioridades falsas", "time"],
  ["La abundancia también distrae", "other"],
  ["Puedes ganar y equivocarte", "other"],
  ["Puedes perder y tener razón", "other"],
  ["No todo riesgo es irresponsable", "freedom"],
  ["Tu entorno normaliza tus límites", "limits"],
  ["Lo pendiente también ocupa espacio", "time"],
  ["El orgullo también procrastina", "identity"],
  ["Algunas excusas dicen la verdad a medias", "other"],
  ["La reputación es una cárcel elegante", "identity"],
  ["No necesitas terminar todo lo que empiezas", "identity"],
  ["Lo conocido también puede ser peligroso", "routine"],
  ["No toda deuda aparece en el banco", "money"],
  ["Hay silencios que cuestan años", "other"],
  ["La certeza también puede ser ignorancia", "other"],
  ["La comodidad vuelve razonable lo absurdo", "freedom"],
  ["No confundas adaptación con felicidad", "identity"],
  ["El éxito también necesita límites", "limits"],
  ["La nostalgia elimina escenas incómodas", "time"],
  ["El ego convierte preferencias en principios", "identity"],
  ["Tu vida no empieza después del pendiente", "time"],
  ["No toda espera es paciencia", "routine"],
  ["La experiencia puede endurecer errores", "identity"],
  ["El futuro llega sin pedir permiso", "time"],
  ["No todo merece optimización", "routine"],
  ["La facilidad también puede costarte caro", "freedom"],
  ["La rutina reduce preguntas", "routine"],
  ["Hay ambiciones heredadas", "identity"],
  ["No necesitas ganar un juego absurdo", "identity"],
  ["Lo urgente envejece rápido", "time"],
  ["Hay victorias que deberías rechazar", "identity"],
  ["No toda crítica es un ataque", "other"],
  ["El contexto también tiene mérito", "other"],
  ["La suerte no invalida el esfuerzo", "other"],
  ["Tus decisiones pequeñas saben sumar", "time"],
  ["La gente también se arrepiente de aguantar", "limits"],
  ["No todo fracaso necesita revancha", "identity"],
  ["No necesitas recuperar cada pérdida", "identity"],
  ["Hay caminos que empeoran al insistir", "limits"],
  ["La ambición sin criterio es hambre", "identity"],
  ["Tu ego también tiene memoria selectiva", "identity"],
  ["La vida también sucede sin objetivos", "other"],
  ["No necesitas monetizar cada talento", "money"],
  ["Ser eficiente no justifica la tarea", "routine"],
  ["Hay verdades que llegan después del daño", "other"],
  ["A veces cerrar es dejar abierto", "limits"],
  ["No eres neutral mientras esperas", "time"],
];

const editorialThemePool: Array<Omit<Theme, "id">> = [
  ...curatedEditorialThemes,
  { title: "No toda paz merece silencio", thesis: "Hay silencios que parecen calma porque todavía no has contado lo que cuestan.", tension: "other" },
  { title: "La costumbre anestesia", thesis: "Lo repetido deja de sorprenderte antes de que deje de hacerte daño.", tension: "routine" },
  { title: "La atención precede al recuerdo", thesis: "Lo que no miras mientras ocurre puede volverse importante cuando ya no está.", tension: "time" },
  { title: "No necesitas permiso para cambiar", thesis: "Esperar aprobación para cambiar puede ser una forma elegante de posponerlo.", tension: "identity" },
  { title: "El ego odia las preguntas correctas", thesis: "Una buena pregunta no siempre confirma lo que querías creer.", tension: "identity" },
  { title: "Tus prioridades dejan recibos", thesis: "Lo que dices valorar y lo que pagas con tiempo no siempre coinciden.", tension: "time" },
  { title: "La comodidad también cobra intereses", thesis: "Lo cómodo no siempre cuesta hoy. Por eso es tan fácil no calcularlo.", tension: "freedom" },
  { title: "La libertad necesita espacio vacío", thesis: "No puedes elegir con margen si cada parte de tu vida ya está comprometida.", tension: "freedom" },
  { title: "No toda oportunidad es progreso", thesis: "Algunas oportunidades solo hacen más difícil decir que no a lo que no quieres.", tension: "limits" },
  { title: "La disciplina también necesita auditorías", thesis: "Una rutina útil puede convertirse en una cárcel si nunca la revisas.", tension: "routine" },
  { title: "La rutina puede esconder una renuncia", thesis: "Hay decisiones que siguen ocurriendo incluso después de que dejaste de elegirlas.", tension: "routine" },
  { title: "La velocidad no corrige el rumbo", thesis: "Hacer algo más rápido no responde si valía la pena hacerlo.", tension: "time" },
  { title: "No todo límite es una limitación", thesis: "Algunos límites no te quitan opciones. Evitan que entregues demasiadas.", tension: "limits" },
  { title: "Lo suficiente necesita una definición", thesis: "Si nunca defines suficiente, cada logro encuentra una forma de quedarse corto.", tension: "money" },
  { title: "No todo lo que produce dinero importa", thesis: "El ingreso puede medir demanda. No necesariamente significado.", tension: "money" },
  { title: "La información también puede paralizar", thesis: "Saber más no siempre ayuda si usas cada dato para evitar decidir.", tension: "other" },
  { title: "No toda meta es tuya", thesis: "Hay ambiciones heredadas que se sienten propias hasta que calculas su costo.", tension: "identity" },
  { title: "Ser productivo no te hace imprescindible", thesis: "Hacer mucho no responde si algo de eso tendría que existir sin ti.", tension: "routine" },
  { title: "La curiosidad también es disciplina", thesis: "Pensar mejor exige permanecer más tiempo dentro de una buena pregunta.", tension: "other" },
  { title: "Tu identidad puede quedarse obsoleta", thesis: "No todo lo que te trajo hasta aquí debe decidir quién sigues siendo.", tension: "identity" },
  { title: "No toda incomodidad es crecimiento", thesis: "Sufrir más no es una estrategia. Elegir mejor qué incomodidades pagar sí puede serlo.", tension: "limits" },
  { title: "La vida no guarda borradores", thesis: "La versión provisional de tu vida también consume años reales.", tension: "time" },
  { title: "Tu atención no tiene respaldo", thesis: "El dinero perdido a veces vuelve. Las horas entregadas sin mirar no.", tension: "time" },
  { title: "No confundas reconocimiento con valor", thesis: "La reacción de otros puede ser breve. El precio de perseguirla no siempre.", tension: "identity" },
  { title: "La responsabilidad no necesita culpa", thesis: "Hacerte cargo de algo no exige castigarte por no haberlo visto antes.", tension: "other" },
  { title: "El costo hundido también hunde vidas", thesis: "Los años invertidos no deberían decidir automáticamente cuántos más vas a entregar.", tension: "limits" },
  { title: "La paz puede requerir decepcionar", thesis: "Decir que no puede generar culpa sin ser una mala decisión.", tension: "freedom" },
  { title: "El ruido evita preguntas", thesis: "No todo lo que ocupa tu atención merece dirigirla.", tension: "other" },
  ...jayCorpusThemes.map(([title, tension]) => ({ title, thesis: title, tension })),
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
    thesis: theme.thesis,
  }));
};

const fallbackFrames: Record<Tension, { reframe: string; pressure: string; human: string; close: string; notes: [string, string, string, string, string] }> = {
  limits: {
    reframe: "No todo límite es una limitación.",
    pressure: "SER FUERTE TAMBIÉN ES RETIRARSE.",
    human: "A veces dices que necesitas pensarlo más porque no te hace sentir culpable y sí te hace sentir miserable.",
    close: "Tus límites revelan tus prioridades.",
    notes: [
      "Hay decisiones que se ven pequeñas hasta que sumas el tiempo, la energía y la atención que te quitan.",
      "Un límite no sirve para castigar a alguien. Sirve para que tu vida no se convierta en el lugar donde todo cabe menos tú.",
      "Aguantar puede parecer noble. Pero seguir evitando una conversación por miedo al malestar también tiene un costo.",
      "La culpa es una emoción real. No necesariamente una instrucción para seguir diciendo sí.",
      "Una prioridad no se demuestra con una declaración. Se demuestra con lo que estás dispuesto a dejar fuera.",
    ],
  },
  identity: {
    reframe: "Cambiar de opinión después de recibir nueva información no es inconsistencia.",
    pressure: "NO NECESITAS PERMISO PARA CAMBIAR.",
    human: "Una de las trampas más silenciosas del éxito es que puede hacer extremadamente caro cambiar de dirección.",
    close: "No todo cambio necesita explicación.",
    notes: [
      "Las preguntas que más incomodan suelen ser las que ponen en duda una identidad que ya te daba seguridad.",
      "Cambiar de opinión no borra lo que aprendiste. Evita que una versión antigua decida por una realidad nueva.",
      "Mucha gente espera sentirse lista para cambiar. A veces estar listo solo significa admitir que seguir igual ya no tiene sentido.",
      "Cuando ya construiste reputación, experiencia o estatus, cambiar parece caro. Eso no convierte en buena la dirección actual.",
      "No tienes que conservar una versión de ti solo porque otras personas ya aprendieron a reconocerla.",
    ],
  },
  time: {
    reframe: "La velocidad no corrige el rumbo.",
    pressure: "TU CALENDARIO NUNCA DICE ALGÚN DÍA.",
    human: "El tiempo tiene una ventaja peligrosa: desaparece sin enviarte notificaciones.",
    close: "Tus prioridades dejan recibos.",
    notes: [
      "No todo lo que se mueve rápido está avanzando. A veces solo está evitando detenerse para mirar el rumbo.",
      "Tu calendario no necesita mentir para mostrarte qué está recibiendo tus mejores horas.",
      "La urgencia es persuasiva porque parece importante. La pregunta útil es qué seguirá importando cuando deje de hacer ruido.",
      "Perder una hora no se siente como perder algo. Repetirla todos los días termina ocupando una parte reconocible de una vida.",
      "Las prioridades reales no siempre coinciden con las declaradas. Por eso conviene mirar la agenda antes que el discurso.",
    ],
  },
  freedom: {
    reframe: "No toda seguridad es libertad.",
    pressure: "LA COMODIDAD TAMBIÉN COBRA INTERESES.",
    human: "Hay decisiones que no tomas porque ninguna opción preserva todas las cosas que quieres.",
    close: "La libertad necesita espacio vacío.",
    notes: [
      "La seguridad puede sentirse cómoda y aun así dejarte sin margen para elegir una vida distinta.",
      "La comodidad no siempre te detiene de golpe. A veces vuelve razonable seguir posponiendo lo que ya sabes.",
      "Querer libertad sin incertidumbre es una negociación imposible. Toda elección importante deja algo afuera.",
      "No tomar una decisión también preserva cosas: la excusa, lo conocido y la posibilidad de no decepcionar a nadie.",
      "El espacio vacío no es desperdicio cuando te permite elegir sin pánico.",
    ],
  },
  money: {
    reframe: "No todo lo importante produce dinero.",
    pressure: "LO SUFICIENTE NECESITA UNA DEFINICIÓN.",
    human: "Una compra no cuesta únicamente dinero. También cuesta las horas de vida necesarias para producir ese dinero.",
    close: "El dinero puede comprar margen para decir que no.",
    notes: [
      "El dinero importa. El problema empieza cuando se convierte en la única medida de lo que merece tu tiempo.",
      "Suficiente no es una cifra universal. Es una pregunta que nadie puede responder por ti sin diseñar tu vida desde afuera.",
      "Cada aumento puede resolver un problema y crear una expectativa nueva. Por eso ganar más no responde por sí solo qué buscas.",
      "Traducir una compra a horas de vida no prohíbe comprarla. Solo hace visible el intercambio.",
      "El margen es interesante porque te permite rechazar algo sin que toda tu vida se desarme.",
    ],
  },
  routine: {
    reframe: "La rutina puede esconder una renuncia.",
    pressure: "LA COSTUMBRE ANESTESIA.",
    human: "Hay gente que dedica más tiempo a diseñar su sistema de productividad que a producir algo que importe.",
    close: "La disciplina también necesita auditorías.",
    notes: [
      "La rutina ahorra energía porque evita decidir. También puede seguir tomando decisiones mucho después de que dejaron de servirte.",
      "Lo normal se vuelve difícil de cuestionar precisamente cuando ya no exige atención.",
      "Diseñar un sistema puede sentirse productivo. No reemplaza hacer una cosa que realmente importe.",
      "No hace falta una crisis para revisar una rutina. Basta con preguntar si todavía protege algo que valoras.",
      "La disciplina es útil cuando sirve a una dirección. Sin dirección, solo vuelve más eficiente una inercia.",
    ],
  },
  other: {
    reframe: "No toda paz merece silencio.",
    pressure: "EL EGO ODIA LAS PREGUNTAS CORRECTAS.",
    human: "Tener acceso instantáneo a todas las respuestas puede estar destruyendo nuestra tolerancia a permanecer dentro de una buena pregunta.",
    close: "La curiosidad también es disciplina.",
    notes: [
      "El silencio no siempre es paz. A veces es el precio de evitar una conversación que ya ocupa demasiado espacio por dentro.",
      "Una pregunta correcta no siempre trae una respuesta agradable. Eso no la vuelve menos necesaria.",
      "Tener más información no garantiza pensar mejor. El criterio aparece cuando decides qué merece atención y qué no.",
      "La comodidad de una respuesta rápida puede impedirte pasar el tiempo suficiente dentro de una duda importante.",
      "La curiosidad no es solo interés. También es la disciplina de no conformarte con una explicación que te resulta conveniente.",
    ],
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
      ...weeklyPlans[0], pillar: "Autorresponsabilidad", title: graphicCopy(premise, 55), label: "Texto art · entrada", copy: premise,
      caption: `${frame.notes[0]}\n\nLa pregunta no es si puedes vivir con eso. Es cuánto de tu vida está empezando a decidir por ti.`,
    },
    {
      ...weeklyPlans[1], pillar: "La idea detrás", title: graphicCopy(frame.reframe, 55), label: "Carrusel · contraste", copy: frame.reframe, counterpoint: premise,
      caption: `${frame.notes[1]}\n\nUna elección consciente y una inercia pueden verse igual desde afuera. No son lo mismo.`,
      slides: [graphicCopy(premise, 85), frame.reframe, frame.pressure, frame.close],
    },
    {
      ...weeklyPlans[2], pillar: "La presión", title: graphicCopy(frame.pressure, 55), label: "SIMPLE · contraste", copy: frame.pressure, uppercase: true,
      caption: `${frame.notes[2]}\n\nNo toda resistencia merece el nombre de fortaleza.`,
    },
    {
      ...weeklyPlans[3], pillar: "Proceso real", title: graphicCopy(frame.human, 55), label: "Contexto · proceso real", copy: frame.human,
      caption: `${frame.notes[3]}\n\nAhí es donde una idea deja de ser una frase y empieza a tocar una decisión real.`,
    },
    {
      ...weeklyPlans[4], pillar: "La idea central", title: graphicCopy(frame.close, 55), label: "Texto art · cierre", copy: frame.close,
      caption: `${frame.notes[4]}\n\nUn estándar claro no resuelve todo. Evita seguir confundiendo lo que cuesta con lo que importa.`,
    },
  ];
  return { title: weekTitle, thesis: premise, arc: "Cinco ángulos independientes: observar, contrastar, confrontar, aterrizar y decidir.", posts };
};

const parseThemes = (text: string, excluded: string[] = []): Theme[] | null => {
  const decoded = decodeJson(text);
  const value = Array.isArray(decoded)
    ? decoded
    : decoded && typeof decoded === "object" && Array.isArray((decoded as { themes?: unknown }).themes)
      ? (decoded as { themes: unknown[] }).themes
      : null;
  if (!value) return null;
  try {
    if (value.length !== 4) return null;
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
  const value = decodeJson(text);
  if (!value || typeof value !== "object") return null;
  try {
    const payload = value as { title?: unknown; thesis?: unknown; arc?: unknown; posts?: unknown };
    if (!Array.isArray(payload.posts) || payload.posts.length !== 5) return null;
    const posts: Array<WeekPost | null> = payload.posts.map((item: Record<string, unknown>, index: number): WeekPost | null => {
      const plan = weeklyPlans[index];
      const templateId = plan.templateId;
      const slides = Array.isArray(item.slides)
        ? item.slides.map((slide: unknown) => normalize(slide, 85)).filter(Boolean).slice(0, 5)
        : undefined;
      // Claude naturally treats the first carousel slide as its visual copy.
      // Accept that valid shape instead of discarding a complete weekly plan.
      const copy = normalCaption(item.copy) || (plan.format === "carousel" ? normalCaption(slides?.[0]) : "");
      const caption = normalCaption(item.caption);
      if (!copy || !caption || copy.length > graphicLimit(plan.format)) return null;
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
      title: normalize(payload.title, 65) || "Semana JAY",
      thesis: normalize(payload.thesis, 240),
      arc: normalize(payload.arc, 180) || "Observar → confrontar → integrar",
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
  try { body = await request.json(); } catch { return Response.json({ error: "Solicitud inválida." }, { status: 400 }); }
  const mode = body.mode === "themes" ? "themes" : "week";
  const seed = normalize(body.seed, 220);
  const topic = normalize(body.topic, 240);
  const title = normalize(body.title, 65);
  const tension = tensions.has(String(body.tension) as Tension) ? body.tension as Tension : "other";
  const excluded = Array.isArray(body.exclude)
    ? body.exclude.map((item) => normalize(item, 55)).filter(Boolean).slice(-500)
    : [];
  const weeklyPlans = weeklyPlansFor(`${title} ${topic}`);

  if (mode === "week" && !topic) return Response.json({ error: "Elige un tema semanal." }, { status: 400 });
  if (!process.env.ANTHROPIC_API_KEY) {
    console.warn("[JAY AI] ANTHROPIC_API_KEY is unavailable; using the editorial library.");
    return Response.json(mode === "themes" ? { themes: themeFallback(seed, excluded), source: "editorial" } : { week: fallbackWeek(topic, tension, weeklyPlans, title), source: "editorial" });
  }
  if (!process.env.ANTHROPIC_WORKSPACE_ID) {
    console.warn("[JAY AI] ANTHROPIC_WORKSPACE_ID is unavailable; an unscoped key may be rejected by Anthropic.");
  }
  if (!canGenerate(request)) return Response.json({ error: "Inténtalo de nuevo en unos minutos." }, { status: 429 });

  try {
    if (mode === "themes") {
      const { text } = await generateText({
        model: anthropic(model),
        // The app needs finished editorial copy, not hidden reasoning. With
        // adaptive thinking enabled, Claude could use the response budget
        // before it ever returned the JSON the UI needs.
        providerOptions: { anthropic: { thinking: { type: "disabled" } } },
        maxOutputTokens: 1600,
        system: "You are the editorial partner for JAY POST STUDIO. Write only in Spanish. JAY's voice is precise, sober, observant and slightly uncomfortable; never motivational, therapeutic, poetic for its own sake, salesy, or abstract. It names a hidden cost, a contradiction, an assumption, or the consequence people avoid seeing. Prefer clean structures such as 'No todo X es Y', 'La X también Y', 'No necesitas X para Y', and 'Puedes X y aun así Y'. Avoid titles shaped like 'La X que...' and avoid filler such as 'Esta semana observa'. Reference lines: 'La comodidad también cobra intereses.' 'Tus prioridades dejan recibos.' 'La velocidad no corrige el rumbo.' 'No todo límite es una limitación.' 'La rutina puede esconder una renuncia.' 'No necesitas ganar un juego absurdo.' Return only valid JSON: exactly 4 objects with title, thesis, tension. tension must be one of time, freedom, limits, money, identity, routine, other. Each idea must sustain five distinct but coherent posts across one week. Every request must explore fresh angles and never recycle a title the user already saw.",
        prompt: `Optional starting thought: ${seed || "No seed. Find a fresh tension for JAY."}\nDo not repeat these previous titles: ${excluded.length ? excluded.join(" | ") : "none"}.`,
      });
      const themes = parseThemes(text, excluded);
      if (!themes) console.warn(`[JAY AI] Theme response could not be parsed; using the editorial library. Raw response: ${text.slice(0, 2400)}`);
      return Response.json({ themes: themes || themeFallback(seed, excluded), source: themes ? "ai" : "editorial" });
    }
    const { text } = await generateText({
      model: anthropic(model),
      providerOptions: { anthropic: { thinking: { type: "disabled" } } },
      maxOutputTokens: 4000,
      system: "You are the editorial partner for JAY POST STUDIO. Write only in Spanish. Build one complete five-post week in the JAY voice: precise, sober, specific and slightly uncomfortable. Never motivational, therapeutic, salesy, decorative, generic, or sentimental. JAY observes a hidden cost, names a contradiction and stops before over-explaining. Its language is plain, not academic. Reference lines: 'La costumbre anestesia.' 'Tus prioridades dejan recibos.' 'La comodidad también cobra intereses.' 'No toda seguridad es libertad.' 'Lo suficiente necesita una definición.' 'La vida no guarda borradores.' 'La paz puede requerir decepcionar.' Every post must be an independent, complete JAY idea; do not write a sequel, tease, or part number. Together they must orbit the same weekly tension from five different angles: (1) observation, (2) reframe, (3) direct consequence, (4) real-life implication, (5) closing standard. Never make the five posts say the same thing with different words. Return only valid JSON object with title, thesis, arc, and posts. posts must be exactly 5 objects in this fixed order. Each object needs title, label, copy, caption, pillar, optional counterpoint, uppercase, slides. Titles must name that post's exact claim, never generic labels such as 'La entrada', 'El golpe', or 'El cierre'. Every caption has two concise paragraphs: a concrete observation first, then a precise implication. Graphic copy limits are strict: text art max 145 characters, carousel cover max 100, SIMPLE max 85, context max 155. Carousel slides must be 4 or 5 coherent steps, each max 85 characters: claim, reframe, consequence, closure. Do not merely restate the visual copy in a caption. Make every post useful, specific, and ready to publish.",
      prompt: `Tema semanal: ${topic}\nNombre del tema: ${title || "Semana JAY"}\nTensión: ${tension}\nEstructura visual obligatoria: ${weeklyPlans.map((plan) => `${plan.day}: ${plan.format} (${plan.templateId})`).join(" | ")}\nObjetivo: crecer una marca personal reconocible por ideas precisas que cuestionan lo que la gente tolera.`,
    });
    const parsedWeek = parseWeek(text, weeklyPlans);
    const week = parsedWeek ? { ...parsedWeek, title: title || parsedWeek.title } : null;
    if (!week) console.warn(`[JAY AI] Weekly response could not be parsed; using the editorial library. Raw response: ${text.slice(0, 4000)}`);
    return Response.json({ week: week || fallbackWeek(topic, tension, weeklyPlans, title), source: week ? "ai" : "editorial" });
  } catch (error) {
    reportGenerationFailure(mode === "themes" ? "theme generation" : "weekly generation", error);
    return Response.json(mode === "themes" ? { themes: themeFallback(seed, excluded), source: "editorial" } : { week: fallbackWeek(topic, tension, weeklyPlans, title), source: "editorial" });
  }
}
