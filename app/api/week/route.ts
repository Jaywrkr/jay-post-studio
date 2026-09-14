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

const coreSolutionsPattern = /\b(cliente|clientes|empresa|empresas|equipo|equipos|liderazgo|líder|líderes|salario|ascenso|networking|mentor|mentoría|industria|ventas|marketing|empleabilidad|certificaci[oó]n|freelanc\w*|coaching|roi|impuestos|delegaci[oó]n|carrera profesional|marca personal)\b/i;
const staysInJayWorld = (...values: unknown[]) => !coreSolutionsPattern.test(
  values.filter((value): value is string => typeof value === "string").join(" "),
);
const jayEditorialWorld = "JAY is a personal editorial voice about ordinary life: time and attention; identity and change; comfort and enough; money as margin and freedom; decisions, loss and sunk cost; relationships, parents, children and presence; technology and distraction; ambition, mortality and the quality of an ordinary Tuesday. JAY is not CoreSolutions. Unless the user explicitly provides a professional subject, never discuss clients, companies, teams, leadership, salaries, careers, sales, marketing, networking, mentoring, consulting, workplace performance or business productivity.";
const jayClarityRule = "Clarity matters more than brevity. A short line must still contain a complete, immediately understandable idea. Never remove necessary context just to sound minimal. Avoid vague pseudo-profundity, compressed abstractions and stacking several metaphors such as debts, contracts, receipts and interest in the same argument. Use one observation, one tension and one clear consequence.";
const jayReferenceVoice = "Voice references: 'No necesitas recordar cada día de tu vida para haberlo desperdiciado. De hecho, ese puede ser precisamente el problema.' 'Hay conversaciones que aplazamos durante meses porque no queremos pasar veinte minutos incómodos.' 'Puedes construir una vida llena de momentos impresionantes y seguir odiando los martes.' 'No todo el mundo necesita perseguir una vida extraordinaria.' 'La inteligencia artificial puede ahorrarte tiempo. La pregunta incómoda es qué harás con el tiempo que te devuelva.' 'Una compra no cuesta únicamente dinero. También cuesta las horas de vida necesarias para producir ese dinero.'";

const comparisonTokens = (value: string) => new Set(
  value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLocaleLowerCase()
    .replace(/[^a-z0-9ñ\s]/g, " ")
    .split(/\s+/)
    .filter((word) => word.length > 3 && !["para", "como", "pero", "tambien", "porque", "cuando", "donde", "desde", "hasta", "puede", "puedes", "todo", "toda", "todos", "todas", "algo", "cada", "mismo", "misma"].includes(word)),
);
const tooSimilar = (left: string, right: string, threshold = 0.62) => {
  const a = comparisonTokens(left);
  const b = comparisonTokens(right);
  if (!a.size || !b.size) return left.trim().toLocaleLowerCase() === right.trim().toLocaleLowerCase();
  const shared = [...a].filter((token) => b.has(token)).length;
  return shared / Math.min(a.size, b.size) >= threshold;
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

type Plan = Pick<WeekPost, "day" | "role" | "objective" | "format" | "successMetric" | "templateId">;
type PlanSeed = Omit<Plan, "templateId">;

const planArcs: PlanSeed[][] = [
  [
    { day: "LUN", role: "Observación", objective: "discovery", format: "text art", successMetric: "Alcance + compartidos" },
    { day: "MAR", role: "Contraste", objective: "depth", format: "carousel", successMetric: "Guardados" },
    { day: "JUE", role: "Consecuencia", objective: "discovery", format: "SIMPLE", successMetric: "Compartidos" },
    { day: "VIE", role: "Vida real", objective: "human", format: "context", successMetric: "Comentarios con sentido" },
    { day: "DOM", role: "Criterio", objective: "direction", format: "text art", successMetric: "Seguidores ganados" },
  ],
  [
    { day: "LUN", role: "La señal", objective: "discovery", format: "SIMPLE", successMetric: "Alcance" },
    { day: "MAR", role: "El costo", objective: "depth", format: "text art", successMetric: "Compartidos" },
    { day: "JUE", role: "La excusa", objective: "depth", format: "carousel", successMetric: "Guardados" },
    { day: "VIE", role: "Dónde aparece", objective: "human", format: "context", successMetric: "Comentarios con sentido" },
    { day: "DOM", role: "La decisión", objective: "direction", format: "text art", successMetric: "Seguidores ganados" },
  ],
  [
    { day: "LUN", role: "La suposición", objective: "discovery", format: "text art", successMetric: "Alcance + compartidos" },
    { day: "MAR", role: "La fricción", objective: "human", format: "context", successMetric: "Comentarios con sentido" },
    { day: "JUE", role: "La presión", objective: "discovery", format: "SIMPLE", successMetric: "Compartidos" },
    { day: "VIE", role: "La prueba", objective: "depth", format: "carousel", successMetric: "Guardados" },
    { day: "DOM", role: "El estándar", objective: "direction", format: "text art", successMetric: "Seguidores ganados" },
  ],
  [
    { day: "LUN", role: "Lo normalizado", objective: "discovery", format: "text art", successMetric: "Alcance" },
    { day: "MAR", role: "Lo que cobra", objective: "depth", format: "carousel", successMetric: "Guardados" },
    { day: "JUE", role: "La implicación", objective: "human", format: "context", successMetric: "Comentarios con sentido" },
    { day: "VIE", role: "La pregunta", objective: "discovery", format: "SIMPLE", successMetric: "Compartidos" },
    { day: "DOM", role: "El límite", objective: "direction", format: "text art", successMetric: "Seguidores ganados" },
  ],
  [
    { day: "LUN", role: "La escena", objective: "human", format: "context", successMetric: "Comentarios con sentido" },
    { day: "MAR", role: "La contradicción", objective: "discovery", format: "text art", successMetric: "Compartidos" },
    { day: "JUE", role: "Lo que evitas", objective: "depth", format: "carousel", successMetric: "Guardados" },
    { day: "VIE", role: "La verdad breve", objective: "discovery", format: "SIMPLE", successMetric: "Alcance" },
    { day: "DOM", role: "La elección", objective: "direction", format: "text art", successMetric: "Seguidores ganados" },
  ],
  [
    { day: "LUN", role: "El síntoma", objective: "discovery", format: "text art", successMetric: "Alcance" },
    { day: "MAR", role: "La verdad breve", objective: "discovery", format: "SIMPLE", successMetric: "Compartidos" },
    { day: "JUE", role: "La consecuencia", objective: "depth", format: "carousel", successMetric: "Guardados" },
    { day: "VIE", role: "La vida diaria", objective: "human", format: "context", successMetric: "Comentarios con sentido" },
    { day: "DOM", role: "Lo que sigue", objective: "direction", format: "text art", successMetric: "Seguidores ganados" },
  ],
];

const templatePools: Record<Format, string[]> = {
  "text art": ["jay-quiet-ink", "jay-quiet-paper", "jay-grain-left", "jay-grain-right", "jay-circle-quote", "jay-mirror"],
  carousel: ["jay-four-sides", "jay-quiet-paper", "jay-quiet-ink", "jay-mirror", "jay-message", "jay-grain-left", "jay-grain-right"],
  SIMPLE: ["jay-centered-caps", "jay-simple-paper", "jay-simple-ink", "jay-reminder"],
  context: ["jay-message", "jay-quiet-paper", "jay-quiet-ink", "jay-grain-left", "jay-grain-right", "jay-mirror"],
};

const seedNumber = (value: string) => [...value].reduce((hash, char) => ((hash * 33) ^ char.charCodeAt(0)) >>> 0, 5381);
const weeklyPlansFor = (seed: string): Plan[] => {
  const hash = seedNumber(seed);
  const arc = planArcs[hash % planArcs.length];
  return arc.map((plan, index) => {
    const pool = templatePools[plan.format];
    return { ...plan, templateId: pool[(hash + index * 17 + (hash >>> (index + 1))) % pool.length] };
  });
};
const plans = weeklyPlansFor("JAY base");

const graphicLimit = (format: Format) =>
  format === "carousel" ? 100 : format === "SIMPLE" ? 85 : format === "context" ? 155 : 145;
const graphicCopy = (value: string, max: number) => {
  const clean = normalize(value, max + 1);
  if (clean.length <= max) return clean;
  return `${clean.slice(0, max).replace(/\s+\S*$/, "").replace(/[,:;]$/, "").trim()}…`;
};
const completeGraphicCopy = (value: unknown, max: number) => {
  const clean = normalCaption(value).replace(/\s+/g, " ").trim();
  if (clean.length <= max) return clean;
  const sentences = clean.match(/[^.!?]+[.!?]+/g) || [];
  let result = "";
  for (const sentence of sentences) {
    const candidate = `${result} ${sentence.trim()}`.trim();
    if (candidate.length > max) break;
    result = candidate;
  }
  if (result) return result;
  const shortened = clean.slice(0, Math.max(1, max - 1)).replace(/\s+\S*$/, "").replace(/[,:;\-–—]+$/, "").trim();
  return `${shortened}.`;
};
const strictGraphicCopy = (value: unknown, max: number) => {
  const clean = normalCaption(value).replace(/\s+/g, " ").trim();
  if (!clean || clean.length > max) return "";
  if (/\b(que|de|del|la|el|los|las|un|una|con|sin|por|para|sobre|porque|aunque|cuando|como|si|y|o)$/i.test(clean.replace(/[¿?¡!.,;:]+$/, "").trim())) return "";
  return clean;
};
const completeLabel = (value: unknown, max: number) => {
  const clean = normalCaption(value).replace(/\s+/g, " ").trim();
  if (clean.length <= max) return clean;
  return clean.slice(0, max).replace(/\s+\S*$/, "").replace(/[,:;\-–—]+$/, "").trim();
};
const twoParagraphCaption = (value: unknown) => {
  const clean = normalCaption(value);
  if (!clean) return "";
  const paragraphs = clean.split(/\n\s*\n/).map((part) => part.trim()).filter(Boolean);
  if (paragraphs.length >= 2) return `${paragraphs[0]}\n\n${paragraphs.slice(1).join(" ")}`;
  const sentences = clean.match(/[^.!?]+[.!?]+|[^.!?]+$/g)?.map((sentence) => sentence.trim()).filter(Boolean) || [];
  if (sentences.length < 2) return clean;
  const splitAt = Math.ceil(sentences.length / 2);
  return `${sentences.slice(0, splitAt).join(" ")}\n\n${sentences.slice(splitAt).join(" ")}`;
};

const isCompleteJayCaption = (caption: string) => {
  const paragraphs = caption.split(/\n\s*\n/).map((part) => part.trim()).filter(Boolean);
  const words = caption.trim().split(/\s+/).filter(Boolean).length;
  return paragraphs.length === 2 && words >= 65 && words <= 135;
};
const genericPostTitle = /^(lo normalizado|lo que cobra|la implicaci[oó]n|la pregunta|el l[ií]mite|la entrada|el cierre|el golpe|el problema|la idea|la conclusi[oó]n)$/i;

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
void themeFallback;

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
// Retained as an internal recovery reference, but never exposed as a generated week.
void fallbackWeek;

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
      title: completeLabel(item?.title, 80),
      thesis: completeGraphicCopy(item?.thesis, 300),
      tension: tensions.has(item?.tension) ? item.tension as Tension : "other",
    }));
    const fresh = themes.every((item) =>
      item.title
      && item.thesis
      && staysInJayWorld(item.title, item.thesis)
      && !excluded.some((oldTitle) => tooSimilar(item.title, oldTitle)),
    );
    const mutuallyDistinct = themes.every((item, index) =>
      themes.slice(index + 1).every((other) => !tooSimilar(item.title, other.title, 0.7)),
    );
    return fresh && mutuallyDistinct ? themes : null;
  } catch { return null; }
};

const parseWeek = (text: string, weeklyPlans = plans): Week | null => {
  const decoded = decodeJson(text);
  if (!decoded || typeof decoded !== "object") return null;
  try {
    const wrapper = decoded as { week?: unknown };
    const value = wrapper.week && typeof wrapper.week === "object" ? wrapper.week : decoded;
    const payload = value as { title?: unknown; thesis?: unknown; arc?: unknown; posts?: unknown };
    if (!Array.isArray(payload.posts) || payload.posts.length !== 5) return null;
    const posts: Array<WeekPost | null> = payload.posts.map((item: Record<string, unknown>, index: number): WeekPost | null => {
      const plan = weeklyPlans[index];
      const templateId = plan.templateId;
      const slides = plan.format === "carousel" && Array.isArray(item.slides)
        ? item.slides.map((slide: unknown) => strictGraphicCopy(slide, 85)).filter(Boolean).slice(0, 5)
        : undefined;
      // Claude naturally treats the first carousel slide as its visual copy.
      // Accept that valid shape instead of discarding a complete weekly plan.
      const copySource = normalCaption(item.copy) || (plan.format === "carousel" ? normalCaption(slides?.[0]) : normalize(item.title));
      const copy = strictGraphicCopy(copySource, graphicLimit(plan.format));
      const caption = twoParagraphCaption(item.caption);
      const rawPillar = completeLabel(item.pillar, 65);
      const postTitle = completeLabel(item.title, 120);
      const pillar = !rawPillar || rawPillar.startsWith("jay-") || rawPillar === templateId
        ? plan.role
        : rawPillar;
      if (!copy || !caption || !postTitle || postTitle.split(/\s+/).length < 4 || genericPostTitle.test(postTitle) || !isCompleteJayCaption(caption) || !staysInJayWorld(postTitle, copy, caption, rawPillar, ...(slides || []))) return null;
      if (plan.format === "carousel" && (!slides || slides.length < 4)) return null;
      return {
        ...plan,
        title: postTitle,
        label: completeLabel(item.label, 100) || `${plan.format} · ${plan.role}`,
        templateId,
        copy,
        caption,
        pillar,
        ...(templateId === "jay-four-sides" && strictGraphicCopy(item.counterpoint, 85) ? { counterpoint: strictGraphicCopy(item.counterpoint, 85) } : {}),
        ...(plan.format === "SIMPLE" ? { uppercase: true } : {}),
        ...(slides?.length ? { slides } : {}),
      };
    });
    if (posts.some((post) => !post)) return null;
    const completePosts = posts as WeekPost[];
    const ideasAreDistinct = completePosts.every((post, index) =>
      completePosts.slice(index + 1).every((other) =>
        !tooSimilar(`${post.title} ${post.copy}`, `${other.title} ${other.copy}`, 0.72),
      ),
    );
    if (!ideasAreDistinct) return null;
    return {
      title: completeLabel(payload.title, 120) || "Semana JAY",
      thesis: completeGraphicCopy(payload.thesis, 320),
      arc: completeGraphicCopy(payload.arc, 360) || "Observar → confrontar → integrar",
      posts: completePosts,
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
  const topic = normalize(body.topic, 600);
  const title = normalize(body.title, 120);
  const tension = tensions.has(String(body.tension) as Tension) ? body.tension as Tension : "other";
  const excluded = Array.isArray(body.exclude)
    ? body.exclude.map((item) => normalize(item, 55)).filter(Boolean).slice(-500)
    : [];
  const weeklyPlans = weeklyPlansFor(`${title} ${topic}`);

  if (mode === "week" && !topic) return Response.json({ error: "Elige un tema semanal." }, { status: 400 });
  if (!process.env.ANTHROPIC_API_KEY) {
    console.warn(`[JAY AI] ANTHROPIC_API_KEY is unavailable; refusing to create filler ${mode}.`);
    return Response.json({ error: "Claude no está disponible. No se creó contenido de relleno." }, { status: 503 });
  }
  if (!process.env.ANTHROPIC_WORKSPACE_ID) {
    console.warn("[JAY AI] ANTHROPIC_WORKSPACE_ID is unavailable; an unscoped key may be rejected by Anthropic.");
  }
  if (!canGenerate(request)) return Response.json({ error: "Inténtalo de nuevo en unos minutos." }, { status: 429 });

  try {
    if (mode === "themes") {
      let text = "";
      let themes: Theme[] | null = null;
      for (let attempt = 0; attempt < 2 && !themes; attempt += 1) {
        const result = await generateText({
          model: anthropic(model),
          providerOptions: { anthropic: { thinking: { type: "disabled" } } },
          maxOutputTokens: 1900,
          system: `You are the editorial partner for JAY POST STUDIO. Write only in Spanish. ${jayEditorialWorld} ${jayClarityRule} ${jayReferenceVoice} Suggest themes, not professional lessons and not generic self-help categories. A theme should expose a recognizable human contradiction and sustain five different posts without repeating the same sentence. Every title must be a literal, grammatical claim that a 15-year-old understands on the first reading. Do not personify days, time, money or abstract ideas. Do not invert sentence logic to sound clever. Silently reread each title and replace it if the subject, action or consequence is ambiguous. Avoid clickbait such as 'la verdad incómoda', formulas such as 'cómo saber', and titles about growth mindset, talent, leadership or careers. Return only valid JSON: exactly 4 objects with title, thesis, tension. tension must be one of time, freedom, limits, money, identity, routine, other. Every request must explore fresh angles and never recycle a title already seen.`,
          prompt: `Optional starting thought: ${seed || "No seed. Find a fresh tension inside JAY's personal editorial world."}\nDo not repeat these previous titles: ${excluded.length ? excluded.join(" | ") : "none"}.${attempt ? " The previous attempt failed the JAY scope or JSON requirements. Correct it completely." : ""}`,
        });
        text = result.text;
        themes = parseThemes(text, excluded);
      }
      if (!themes) {
        console.warn(`[JAY AI] Theme response failed JAY scope or parsing. Raw response: ${text.slice(0, 2400)}`);
        return Response.json({ error: "Claude no produjo temas con la calidad JAY requerida. Inténtalo otra vez." }, { status: 502 });
      }
      return Response.json({ themes, source: "ai" });
    }
    let text = "";
    let parsedWeek: Week | null = null;
    for (let attempt = 0; attempt < 3 && !parsedWeek; attempt += 1) {
      const result = await generateText({
        model: anthropic(model),
        providerOptions: { anthropic: { thinking: { type: "disabled" } } },
        maxOutputTokens: 5200,
        system: `You are the editorial partner for JAY POST STUDIO. Write only in Spanish. ${jayEditorialWorld} ${jayClarityRule} ${jayReferenceVoice} Build one complete five-post week. Every post must be an independent, complete idea; together they explore one theme from five genuinely different angles following the supplied roles. Do not write sequels, teasers, numbered parts or five paraphrases. Do not turn the theme into advice for professionals. Use ordinary human scenes: a Tuesday, a meal, a screen, a purchase, a conversation, a parent, a child, a quiet room, an avoided decision. Do not use clients, teams, companies or workplace examples. Every post title must state its exact claim in at least four words; never use role labels such as 'La implicación', 'La pregunta', 'El límite' or 'Lo normalizado' as titles. Graphic writing rules: SIMPLE uses one clear claim of 6–14 words and at most 85 characters. Text art uses a complete thought of 12–24 words and at most 145 characters. Context uses a concrete observation of 16–25 words and at most 155 characters. The carousel contains 4 or 5 complete steps of 7–13 words and at most 85 characters each. No graphic text may end in a connector such as 'que', 'de', 'con', 'porque' or 'y'. Never sacrifice grammar or meaning to meet a limit and never expect the app to truncate your writing. Captions must contain exactly two paragraphs and 70–120 words total: paragraph one develops a recognizable observation or scene; paragraph two explains the tension or consequence. Captions clarify the graphic instead of repeating it. Before returning JSON, silently verify every character limit and rewrite any field that exceeds it. Return only a valid JSON object with title, thesis, arc and exactly 5 posts in the supplied order. Every post needs title, label, copy, caption and pillar. Only the carousel post gets slides. Omit slides from every other post. counterpoint is optional and only useful for a split composition.`,
        prompt: `Tema semanal: ${topic}\nNombre del tema: ${title || "Semana JAY"}\nTensión: ${tension}\nLos cinco objetos de posts deben respetar exactamente este orden: ${weeklyPlans.map((plan, index) => `${index + 1}) day=${plan.day}, role=${plan.role}, format=${plan.format}, templateId=${plan.templateId}, ${plan.format === "carousel" ? "slides obligatorio con 4 o 5 textos completos" : "sin slides"}`).join(" | ")}\nObjetivo: crear ideas personales claras, memorables y comprensibles en la voz de JAY.${attempt ? " La respuesta anterior fue rechazada. Revisa uno por uno: títulos específicos de 4 palabras o más; copy dentro del máximo; ningún texto terminado en conector; exactamente dos párrafos y 70–120 palabras en cada caption; slides solo en el carrusel; cinco ideas distintas; cero lenguaje profesional. Reescribe toda la respuesta desde cero." : ""}`,
      });
      text = result.text;
      parsedWeek = parseWeek(text, weeklyPlans);
    }
    const week = parsedWeek ? { ...parsedWeek, title: title || parsedWeek.title } : null;
    if (!week) {
      console.warn(`[JAY AI] Weekly response could not be parsed. Raw response: ${text.slice(0, 4000)}`);
      return Response.json({ error: "Claude no completó una semana válida. Inténtalo otra vez." }, { status: 502 });
    }
    return Response.json({ week, source: "ai" });
  } catch (error) {
    reportGenerationFailure(mode === "themes" ? "theme generation" : "weekly generation", error);
    if (mode === "themes") return Response.json({ error: "No se pudieron crear temas JAY con Claude. Inténtalo otra vez." }, { status: 502 });
    return Response.json({ error: "No se pudo crear la semana con Claude. Inténtalo otra vez." }, { status: 502 });
  }
}
