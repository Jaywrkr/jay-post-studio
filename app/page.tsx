"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  AlignCenter,
  AlignLeft,
  AlignRight,
  Circle,
  Check,
  Copy,
  Download,
  Eye,
  EyeOff,
  FilePlus2,
  Grid2X2,
  ImagePlus,
  Layers3,
  Lock,
  LockOpen,
  Minus,
  MousePointer2,
  Palette,
  Plus,
  Redo2,
  Save,
  Shapes,
  Sparkles,
  Square,
  Trash2,
  Type,
  Undo2,
} from "lucide-react";
import {
  Circle as KCircle,
  Ellipse,
  Group,
  Image as KImage,
  Layer,
  Line,
  Rect,
  Stage,
  Text as KText,
  Transformer,
} from "react-konva";
import type Konva from "konva";

const SIZE = 1080;
const COLORS = [
  "#000000",
  "#FFFFFF",
  "#F5F5F5",
  "#EDEDED",
  "#D9D9D9",
  "#8C8C8C",
];
const FONTS = ["Geist Mono"];
type ElementType =
  | "text"
  | "rect"
  | "circle"
  | "ellipse"
  | "line"
  | "plus"
  | "image";
type Tool =
  | "templates"
  | "ideas"
  | "queue"
  | "text"
  | "shapes"
  | "images"
  | "background"
  | "effects"
  | "layers";
type StudioElement = {
  id: string;
  type: ElementType;
  name: string;
  x: number;
  y: number;
  width: number;
  height: number;
  rotation: number;
  opacity: number;
  fill: string;
  stroke?: string;
  strokeWidth?: number;
  radius?: number;
  text?: string;
  fontSize?: number;
  fontFamily?: string;
  fontStyle?: string;
  align?: "left" | "center" | "right";
  lineHeight?: number;
  letterSpacing?: number;
  uppercase?: boolean;
  src?: string;
  visible: boolean;
  locked: boolean;
};
type Background = {
  type: "solid" | "linear" | "radial";
  color: string;
  colorB: string;
  angle: number;
};
type Effects = {
  noise: boolean;
  noiseAmount: number;
  noiseOpacity: number;
  noiseScale: number;
  seed: number;
  scanlines: boolean;
  scanlineOpacity: number;
  scanlineSpacing: number;
  dotField: boolean;
  dotOpacity: number;
  dotSpacing: number;
  dotSize: number;
  vignette: boolean;
  vignetteOpacity: number;
  frame: boolean;
  frameInset: number;
  frameOpacity: number;
};
type Design = {
  id: string;
  name: string;
  background: Background;
  effects: Effects;
  elements: StudioElement[];
  createdAt: string;
  updatedAt: string;
};
type Template = {
  id: string;
  name: string;
  subtitle: string;
  design: Omit<Design, "id" | "name" | "createdAt" | "updatedAt">;
};
type IdeaTension =
  | "time"
  | "freedom"
  | "limits"
  | "money"
  | "identity"
  | "routine"
  | "other";
type IdeaRoute = {
  id: string;
  title: string;
  templateId: string;
  label: string;
  copy: string;
  counterpoint?: string;
  segments?: string[];
  uppercase?: boolean;
  effectVariant?: number;
};
type TextRegion = {
  x: number;
  y: number;
  width: number;
  height: number;
  align: "left" | "center" | "right";
  verticalAlign?: "top" | "middle" | "bottom";
};
type IdeaAngle = "reflective" | "direct" | "contrarian";
type QueueStatus = "review" | "approved" | "discarded";
type BrandObjective = "discovery" | "depth" | "human" | "direction";
type BrandFormat = "text art" | "SIMPLE" | "carousel" | "context";
type BrandPlan = {
  day: string;
  role?: string;
  objective: BrandObjective;
  format: BrandFormat;
  pillar: string;
  successMetric: string;
  publishAt?: string;
};
type WeeklyTheme = {
  id: string;
  title: string;
  thesis: string;
  tension: IdeaTension;
};
type QueuePost = {
  id: string;
  route: IdeaRoute;
  status: QueueStatus;
  plan?: BrandPlan;
  caption?: string;
  slides?: string[];
};
type CarouselPreview = {
  post: QueuePost;
  index: number;
};
type ActiveQueueEdit = {
  batchId: string;
  postId: string;
  slideIndex?: number;
  elementId: string;
};
type TemplateAiResult = {
  templateId: string;
  title: string;
  copy: string;
  caption: string;
};
type ContentBatch = {
  id: string;
  topic: string;
  createdAt: string;
  source: "ai" | "editorial";
  schemaVersion?: 7;
  posts: QueuePost[];
  arc?: string;
  thesis?: string;
};
const firstEvidenceWeek: ContentBatch = {
  id: "jay-evidence-week-01",
  topic: "El estándar que mantienes en privado",
  thesis: "Tu relación contigo cambia cuando decides que una promesa no necesita testigos para ser seria.",
  arc: "Observar el doble estándar → medir su costo → reconocerlo en la vida diaria → elegir un criterio propio.",
  createdAt: "2026-09-15T12:00:00-05:00",
  source: "editorial",
  schemaVersion: 7,
  posts: [
    {
      id: "evidence-week-01-mon",
      status: "review",
      route: {
        id: "evidence-route-01-mon",
        title: "Bajas el estándar cuando nadie te está mirando",
        label: "Lo normalizado",
        templateId: "jay-circle-quote",
        copy: "Cumples una promesa cuando alguien mira, y la aplazas cuando estás completamente solo.",
      },
      plan: {
        day: "LUN",
        role: "Lo normalizado",
        objective: "discovery",
        format: "text art",
        pillar: "Integridad personal",
        successMetric: "Alcance",
        publishAt: "Lun 21 sep · 10:00",
      },
      caption: "Te levantas temprano cuando alguien depende de ese horario. Cuando la meta es solo tuya, la fecha se mueve sin culpa. Cancelas la caminata o dejas para mañana lo que te prometiste hoy porque nadie notará la diferencia.\n\nEsa flexibilidad silenciosa parece inofensiva, pero enseña algo preciso: tu palabra vale menos cuando no hay testigos. Con el tiempo dejas de confiar en lo que te dices, porque sabes cuántas veces no cumpliste.",
    },
    {
      id: "evidence-week-01-tue",
      status: "review",
      route: {
        id: "evidence-route-01-tue",
        title: "Incumplirte a solas también tiene un costo real",
        label: "Lo que cobra",
        templateId: "jay-quiet-ink",
        copy: "Cada promesa rota en privado deja una duda que no desaparece sola.",
      },
      plan: {
        day: "MAR",
        role: "Lo que cobra",
        objective: "depth",
        format: "carousel",
        pillar: "Confianza propia",
        successMetric: "Guardados",
        publishAt: "Mar 22 sep · 10:00",
      },
      caption: "Nadie te vio faltar a ese compromiso contigo, así que parece que no ocurrió nada grave. Pero la próxima vez que intentas algo distinto, una parte de ti ya duda porque recuerda las veces anteriores.\n\nEsa duda no aparece de golpe. Se acumula hasta que necesitas que alguien más confirme tus decisiones, porque dejaste de ser una fuente confiable de tu propia palabra.",
      slides: [
        "Prometes algo solo para ti y lo rompes sin dar explicaciones.",
        "La ruptura no deja una marca visible, pero queda registrada.",
        "La próxima vez que decides algo, dudas de tu propia palabra.",
        "Empiezas a necesitar testigos externos para tomarte en serio.",
        "La confianza privada se recupera cumpliendo algo pequeño.",
      ],
    },
    {
      id: "evidence-week-01-thu",
      status: "review",
      route: {
        id: "evidence-route-01-thu",
        title: "Solo cumples lo que otros pueden comprobar después",
        label: "La escena",
        templateId: "jay-quiet-paper",
        copy: "Revisas el celular a medianoche después de prometerte que hoy dormirías temprano.",
      },
      plan: {
        day: "JUE",
        role: "La escena",
        objective: "human",
        format: "context",
        pillar: "Vida cotidiana",
        successMetric: "Comentarios con sentido",
        publishAt: "Jue 24 sep · 10:00",
      },
      caption: "Dijiste que ibas a dormir temprano y a las once y media sigues revisando el celular sin ningún motivo real. No hay reproche esperando mañana porque nadie registró esa promesa salvo tú.\n\nSi solo cumples lo que otros pueden verificar, tu palabra depende de la vigilancia ajena y no de tu criterio. Cuando nadie observa, descubres cuánto respeto tienen realmente tus propias decisiones.",
    },
    {
      id: "evidence-week-01-fri",
      status: "review",
      route: {
        id: "evidence-route-01-fri",
        title: "¿A quién le cumples cuando nadie pregunta?",
        label: "La pregunta",
        templateId: "jay-simple-paper",
        copy: "¿Mantendrías esa promesa si nadie más se enterara jamás?",
        uppercase: true,
      },
      plan: {
        day: "VIE",
        role: "La pregunta",
        objective: "discovery",
        format: "SIMPLE",
        pillar: "Criterio personal",
        successMetric: "Compartidos",
        publishAt: "Vie 25 sep · 10:00",
      },
      caption: "Piensa en la última meta que te propusiste sin decírsela a nadie. Tal vez fue leer, dejar una costumbre o comenzar algo un lunes cualquiera sin anunciarlo ni pedir apoyo.\n\nLa pregunta honesta es si la habrías sostenido sabiendo que nadie lo notaría. Esa respuesta dice más de tu criterio que cualquier logro visible, porque elimina el reconocimiento como incentivo.",
    },
    {
      id: "evidence-week-01-sun",
      status: "review",
      route: {
        id: "evidence-route-01-sun",
        title: "Tu palabra necesita el mismo estándar en privado",
        label: "El criterio",
        templateId: "jay-grain-right",
        copy: "Una promesa privada merece el mismo respeto que una pronunciada frente a todos.",
      },
      plan: {
        day: "DOM",
        role: "El criterio",
        objective: "direction",
        format: "text art",
        pillar: "Integridad personal",
        successMetric: "Seguidores ganados",
        publishAt: "Dom 27 sep · 10:00",
      },
      caption: "Deja de dividir tus compromisos entre los que cuentan porque alguien los vio y los que puedes olvidar porque fueron silenciosos. Esa separación solo decide cuándo te permites fallarte según quién esté mirando.\n\nMantén el mismo estándar exista testigo o no. Si tu palabra únicamente vale frente a otros, todavía no se ha convertido en una parte estable de ti.",
    },
  ],
};
const uid = () => Math.random().toString(36).slice(2, 9);
const brandWeekPlan: BrandPlan[] = [
  {
    day: "LUN",
    role: "Observación",
    objective: "discovery",
    format: "text art",
    pillar: "Autorresponsabilidad",
    successMetric: "Alcance + compartidos",
  },
  {
    day: "MAR",
    role: "Contraste",
    objective: "depth",
    format: "carousel",
    pillar: "La idea detrás de la frase",
    successMetric: "Guardados",
  },
  {
    day: "JUE",
    role: "Consecuencia",
    objective: "discovery",
    format: "SIMPLE",
    pillar: "Límites y libertad",
    successMetric: "Compartidos",
  },
  {
    day: "VIE",
    role: "Vida real",
    objective: "human",
    format: "context",
    pillar: "Proceso real",
    successMetric: "Comentarios cualitativos",
  },
  {
    day: "DOM",
    role: "Criterio",
    objective: "direction",
    format: "text art",
    pillar: "Tu idea central",
    successMetric: "Seguidores ganados",
  },
];
const brandObjectiveCopy: Record<BrandObjective, { label: string; description: string }> = {
  discovery: { label: "Descubrimiento", description: "Haz que alguien nuevo se detenga." },
  depth: { label: "Profundidad", description: "Demuestra que hay una idea detrás." },
  human: { label: "Humano", description: "Da contexto a la persona detrás de JAY." },
  direction: { label: "Dirección", description: "Haz reconocible por qué volver." },
};
const brandFormatCopy: Record<BrandFormat, string> = {
  "text art": "Texto art",
  SIMPLE: "SIMPLE",
  carousel: "Carrusel",
  context: "Contexto",
};
const templateNameCopy: Record<string, string> = {
  "jay-quiet-paper": "JAY / Papel sobrio",
  "jay-quiet-ink": "JAY / Tinta sobria",
  "jay-centered-caps": "JAY / Mayúsculas centradas",
  "jay-simple-paper": "JAY / SIMPLE claro",
  "jay-simple-ink": "JAY / SIMPLE oscuro",
  "jay-mirror": "JAY / Espejo",
  "jay-four-sides": "JAY / Cuatro lados",
  "jay-circle-quote": "JAY / Cita circular",
  "jay-grain-left": "JAY / Grano izquierdo",
  "jay-grain-right": "JAY / Grano derecho",
  "jay-message": "JAY / Mensaje",
  "jay-venn": "JAY / Diagrama",
  "jay-repeater": "JAY / Repetición",
  "jay-reminder": "JAY / Recordatorio",
  "jay-centered-statement": "JAY / Frase centrada",
  "jay-wide-statement": "JAY / Frase amplia",
  "jay-photo-reference": "JAY / Referencia con foto",
};
const originalTemplateNameCopy: Record<string, string> = {
  "JAY / Quiet Paper": "JAY / Papel sobrio",
  "JAY / Quiet Ink": "JAY / Tinta sobria",
  "JAY / Centered Caps": "JAY / Mayúsculas centradas",
  "JAY / SIMPLE Paper": "JAY / SIMPLE claro",
  "JAY / SIMPLE Ink": "JAY / SIMPLE oscuro",
  "JAY / Mirror": "JAY / Espejo",
  "JAY / Four Sides": "JAY / Cuatro lados",
  "JAY / Circle Quote": "JAY / Cita circular",
  "JAY / Grain Left": "JAY / Grano izquierdo",
  "JAY / Grain Right": "JAY / Grano derecho",
  "JAY / Message": "JAY / Mensaje",
  "JAY / Venn": "JAY / Diagrama",
  "JAY / Repeater": "JAY / Repetición",
  "JAY / Reminder": "JAY / Recordatorio",
  "JAY / Centered Statement": "JAY / Frase centrada",
  "JAY / Wide Statement": "JAY / Frase amplia",
  "JAY / Photo Reference": "JAY / Referencia con foto",
  "Untitled post": "Post sin título",
};
const templateName = (template: Pick<Template, "id" | "name">) => templateNameCopy[template.id] || originalTemplateNameCopy[template.name] || template.name;
const localizedDesignName = (name: string) => originalTemplateNameCopy[name] || name;
const templateNameFromId = (id: string) => templateNameCopy[id]?.replace("JAY / ", "") || id.replace("jay-", "").replaceAll("-", " ");
const localizedRouteLabel = (label: string) => label
  .replace(/Quiet Paper/gi, "Papel sobrio")
  .replace(/Quiet Ink/gi, "Tinta sobria")
  .replace(/Four Sides/gi, "Cuatro lados")
  .replace(/Mirror/gi, "Espejo")
  .replace(/Centered Caps/gi, "Mayúsculas centradas")
  .replace(/Simple Paper/gi, "SIMPLE claro")
  .replace(/Simple Ink/gi, "SIMPLE oscuro");
const elementTypeName: Record<ElementType, string> = {
  text: "TEXTO",
  rect: "RECTÁNGULO",
  circle: "CÍRCULO",
  ellipse: "ELIPSE",
  line: "LÍNEA",
  plus: "CRUZ / MÁS",
  image: "IMAGEN",
};
const base = (
  type: ElementType,
  extra: Partial<StudioElement> = {},
): StudioElement => ({
  id: uid(),
  type,
  name:
    type === "text"
      ? "Texto"
      : type === "plus"
        ? "Cruz / Más"
        : type[0].toUpperCase() + type.slice(1),
  x: 160,
  y: 160,
  width: 360,
  height: 100,
  rotation: 0,
  opacity: 1,
  fill: "#000000",
  visible: true,
  locked: false,
  ...extra,
});
const text = (
  value: string,
  x: number,
  y: number,
  size = 38,
  color = "#000000",
  width = 660,
): StudioElement =>
  base("text", {
    name: value.slice(0, 24) || "Texto",
    text: value,
    x,
    y,
    width,
    height: size * 1.35 * Math.max(1, value.split("\n").length),
    fontSize: size,
    fontFamily: "Geist Mono",
    lineHeight: 1.2,
    letterSpacing: 0,
    fill: color,
    align: "left",
  });
const wrapCanvasCopy = (
  value: string,
  width: number,
  fontSize: number,
  letterSpacing = 0,
) => {
  // Geist Mono is deliberately wide. Leave a little breathing room so the
  // rendered line never clips at the right edge of the selected box.
  const characterWidth = fontSize * 0.62 + Math.max(0, letterSpacing);
  const limit = Math.max(10, Math.floor((width - 10) / Math.max(1, characterWidth)));
  return value
    .trim()
    .split("\n")
    .flatMap((paragraph) => {
      const words = paragraph.trim().split(/\s+/).filter(Boolean);
      if (!words.length) return [""];
      const lines: string[] = [];
      let line = "";
      words.forEach((word) => {
        const candidate = line ? `${line} ${word}` : word;
        if (candidate.length <= limit || !line) line = candidate;
        else {
          lines.push(line);
          line = word;
        }
      });
      if (line) lines.push(line);
      return lines;
    })
    .join("\n");
};
const fitCanvasText = (item: StudioElement): StudioElement => {
  if (item.type !== "text") return item;
  const content = wrapCanvasCopy(
    item.text || "",
    Math.max(12, item.width),
    item.fontSize || 36,
    item.letterSpacing || 0,
  );
  const lines = Math.max(1, content.split("\n").length);
  return {
    ...item,
    text: content,
    // Extra space keeps descenders and the last line visible in Konva.
    height: Math.ceil((item.fontSize || 36) * (item.lineHeight || 1.2) * lines + 18),
  };
};
const cross = (
  x: number,
  y: number,
  color = "#000000",
  size = 23,
): StudioElement =>
  base("plus", {
    x,
    y,
    width: size,
    height: size,
    fill: color,
    strokeWidth: 2,
  });
const segment = (
  name: string,
  x: number,
  y: number,
  width: number,
  rotation = 0,
  color = "#000000",
  strokeWidth = 3,
): StudioElement =>
  base("line", {
    name,
    x,
    y,
    width,
    height: 2,
    rotation,
    fill: color,
    stroke: color,
    strokeWidth,
  });
const rotated = (
  value: string,
  x: number,
  y: number,
  size: number,
  color: string,
  width: number,
  rotation: number,
  opacity = 1,
) => ({ ...text(value, x, y, size, color, width), rotation, opacity });
const label = (
  value: string,
  x: number,
  y: number,
  color = "#8C8C8C",
  align: "left" | "center" | "right" = "left",
  width = 130,
): StudioElement => ({
  ...text(value, x, y, 15, color, width),
  align,
  lineHeight: 1,
  fontStyle: "normal",
});
const brand = (color = "#8C8C8C") => [
  label("@jaywrkr", 38, 31, color),
  cross(529, 29, color, 23),
  label("#simple", 912, 31, color, "right"),
  label("#simple", 38, 1027, color),
  cross(529, 1026, color, 23),
  label("@jaywrkr", 912, 1027, color, "right"),
];
const sideBrand = (color = "#8C8C8C") => [
  rotated("#simple", 28, 48, 15, color, 110, 90),
  rotated("@jaywrkr", 1032, 48, 15, color, 130, 90),
  cross(28, 529, color, 23),
  cross(1029, 529, color, 23),
  rotated("@jaywrkr", 28, 930, 15, color, 130, 90),
  rotated("#simple", 1032, 930, 15, color, 110, 90),
];
const postImage = (
  src: string,
  name = "Foto",
  x = 0,
  y = 0,
  width = SIZE,
  height = SIZE,
): StudioElement => base("image", { name, src, x, y, width, height });
const make = (
  name: string,
  background: Background,
  elements: StudioElement[],
  effects: Partial<Effects> = {},
): Template => ({
  id: name.toLowerCase().replace(/[^a-z0-9]+/g, "-"),
  name,
  subtitle: "Sistema visual JAY",
  design: {
    background,
    elements,
    effects: {
      noise: false,
      noiseAmount: 55,
      noiseOpacity: 0.14,
      noiseScale: 2,
      seed: 44,
      scanlines: false,
      scanlineOpacity: 0.08,
      scanlineSpacing: 12,
      dotField: false,
      dotOpacity: 0.12,
      dotSpacing: 48,
      dotSize: 1.5,
      vignette: false,
      vignetteOpacity: 0.16,
      frame: false,
      frameInset: 48,
      frameOpacity: 0.28,
      ...effects,
    },
  },
});
const white: Background = {
  type: "solid",
  color: "#FFFFFF",
  colorB: "#FFFFFF",
  angle: 0,
};
const black: Background = {
  type: "solid",
  color: "#000000",
  colorB: "#000000",
  angle: 0,
};
const templates: Template[] = [
  make("JAY / Quiet Paper", white, [
    ...brand(),
    text(
      "No todas las metas necesitan más esfuerzo. Algunas\nnecesitan una pregunta incómoda: ¿por qué quiero\nesto?",
      128,
      484,
      33,
      "#000000",
      825,
    ),
  ]),
  make("JAY / Centered Statement", white, [
    ...brand(),
    text(
      "Puedes leer cien libros sobre valentía\nsin hacer una sola cosa valiente.",
      165,
      512,
      31,
      "#000000",
      750,
    ),
  ]),
  make("JAY / Wide Statement", white, [
    ...brand(),
    text(
      "Quizá el verdadero lujo no sea tener más\ncosas. Sea poder decir que no sin calcular\ncuánto te costará.",
      130,
      485,
      31,
      "#000000",
      820,
    ),
  ]),
  make("JAY / Quiet Ink", black, [
    ...brand("#8C8C8C"),
    text(
      "La libertad también exige\nrenuncias.",
      516,
      232,
      35,
      "#FFFFFF",
      450,
    ),
  ]),
  make("JAY / Centered Caps", white, [
    ...brand(),
    {
      ...text(
        "REPETIR UNA ELECCIÓN\nTAMBIÉN ES ELEGIR",
        130,
        493,
        35,
        "#000000",
        820,
      ),
      align: "center",
      fontStyle: "bold",
      letterSpacing: 1,
      uppercase: true,
    },
  ]),
  make("JAY / SIMPLE Paper", white, [
    ...brand(),
    { ...text("SIMPLE", 516, 159, 35, "#000000", 420), fontStyle: "bold" },
    text(
      "La gente dice que el tiempo\nvuela. No vuela. Se acumula\nsilenciosamente hasta que un\ndía miras atrás y ya fueron\ndiez años.",
      516,
      231,
      31,
      "#000000",
      480,
    ),
  ]),
  make("JAY / SIMPLE Ink", black, [
    ...brand("#8C8C8C"),
    { ...text("SIMPLE", 516, 159, 35, "#FFFFFF", 420), fontStyle: "bold" },
    text(
      "Que algo haya sido\ndifícil no significa que\nhaya sido bueno.",
      516,
      231,
      35,
      "#FFFFFF",
      470,
    ),
  ]),
  make("JAY / Mirror", black, [
    ...brand("#8C8C8C"),
    text(
      "La rutina es peligrosa precisamente porque\npuede convertir decisiones extraordinarias\nen cosas que dejas de cuestionar.",
      43,
      171,
      33,
      "#FFFFFF",
      930,
    ),
    rotated(
      "La rutina es peligrosa precisamente porque\npuede convertir decisiones extraordinarias\nen cosas que dejas de cuestionar.",
      1038,
      909,
      33,
      "#FFFFFF",
      930,
      180,
    ),
  ]),
  make("JAY / Four Sides", black, [
    ...sideBrand("#FFFFFF"),
    text(
      "Hay personas que no cambian\nporque su sufrimiento actual al\nmenos les resulta conocido.",
      230,
      195,
      34,
      "#FFFFFF",
      600,
    ),
    text(
      "La incertidumbre les asusta más\nque seguir mal. Simple.",
      230,
      817,
      34,
      "#FFFFFF",
      600,
    ),
  ]),
  make("JAY / Circle Quote", black, [
    ...brand("#8C8C8C"),
    base("circle", {
      name: "Orbit",
      x: 119,
      y: 120,
      width: 842,
      height: 842,
      fill: "transparent",
      stroke: "#FFFFFF",
      strokeWidth: 3,
    }),
    text(
      "Puedes agradecer\nprofundamente una\netapa y no querer\nregresar jamás.",
      384,
      471,
      33,
      "#FFFFFF",
      370,
    ),
  ]),
  make("JAY / Venn", white, [
    ...brand("#000000"),
    base("ellipse", { name: "Outer orbit", x: 121, y: 120, width: 838, height: 840, fill: "transparent", stroke: "#000000", strokeWidth: 3 }),
    base("ellipse", { name: "Middle orbit", x: 121, y: 370, width: 838, height: 330, fill: "transparent", stroke: "#000000", strokeWidth: 3 }),
    base("circle", { name: "Choice", x: 380, y: 643, width: 320, height: 320, fill: "transparent", stroke: "#000000", strokeWidth: 3 }),
    text("Hay gente", 457, 232, 31, "#000000", 250),
    { ...text("exitosa\nviviendo vidas", 310, 494, 31, "#000000", 460), align: "center" },
    { ...text("que no\nquieres", 414, 790, 31, "#000000", 250), align: "center" },
  ]),
  make("JAY / Repeater", white, [
    ...brand(),
    ...Array.from({ length: 13 }, (_, index) => ({
      ...text("LA ANSIEDAD AMA LA INCERTIDUMBRE.", 200, 172 + index * 60, 29, "#000000", 700),
      name: "Repeated copy",
      uppercase: true,
    })),
  ]),
  make("JAY / Grain Left", {
    type: "linear", color: "#FFFFFF", colorB: "#1A1A1A", angle: 0,
  }, [
    ...brand("#8C8C8C"),
    text(
      "Puedes estar ganando más dinero que\nnunca y tener menos control sobre tu\ntiempo que cuando ganabas la mitad.",
      45,
      484,
      33,
      "#000000",
      790,
    ),
  ], { noise: true, noiseAmount: 78, noiseOpacity: 0.13, noiseScale: 2 }),
  make("JAY / Grain Right", {
    type: "linear", color: "#080808", colorB: "#F1F1F1", angle: 0,
  }, [
    ...brand("#8C8C8C"),
    text(
      "A veces no tienes miedo de tomar la\ndecisión equivocada. Tienes miedo de\nser responsable de haber decidido.",
      45,
      494,
      33,
      "#EDEDED",
      770,
    ),
  ], { noise: true, noiseAmount: 78, noiseOpacity: 0.13, noiseScale: 2 }),
  make("JAY / Message", white, [
    ...brand(),
    label("Hoy a las 11:11", 408, 753, "#8C8C8C", "left", 250),
    base("rect", { name: "Message bubble", x: 386, y: 790, width: 675, height: 210, fill: "#EFEFEF", radius: 58 }),
    text(
      "Algunas personas necesitan que\nsigas siendo quien eras porque\ntu cambio obliga a cuestionar\nquiénes siguen siendo ellas.",
      427,
      820,
      31,
      "#222222",
      580,
    ),
    label("Visto", 976, 1024, "#8C8C8C", "right", 70),
  ]),
  make("JAY / Reminder", white, [
    ...brand(),
    { ...text("EL FUTURO", 220, 151, 31, "#000000", 640), align: "center", letterSpacing: 1, uppercase: true },
    { ...text("NO\nRESPETA", 350, 494, 31, "#000000", 380), align: "center", letterSpacing: 1, uppercase: true },
    { ...text("TUS\nEXCUSAS", 350, 888, 31, "#000000", 380), align: "center", letterSpacing: 1, uppercase: true },
  ]),
  make("JAY / Photo Reference", black, [
    postImage("/reference/jay-shadow.png", "JAY shadow reference"),
    base("rect", { name: "Photo text shade", x: 72, y: 700, width: 936, height: 280, fill: "#000000", opacity: 0.72, radius: 8 }),
    text("Lo que haces cuando nadie mira también termina definiéndote.", 118, 760, 34, "#FFFFFF", 840),
  ]),
  make("Open Tab", black, [
    ...brand("#FFFFFF"),
    base("rect", {
      name: "Open tab",
      x: 86,
      y: 164,
      width: 908,
      height: 704,
      fill: "transparent",
      stroke: "#FFFFFF",
      strokeWidth: 2,
      radius: 10,
    }),
    base("rect", {
      name: "Browser bar",
      x: 86,
      y: 164,
      width: 908,
      height: 62,
      fill: "#FFFFFF",
      radius: 10,
    }),
    cross(123, 187, "#000000", 16),
    text("JAY / OPEN TAB", 159, 186, 16, "#000000", 300),
    text(
      "LO QUE SIGUES\nPOSPONIENDO\nTAMBIÉN TE ESTÁ\nDISEÑANDO.",
      142,
      294,
      52,
      "#FFFFFF",
      690,
    ),
    base("rect", {
      name: "Active cursor",
      x: 145,
      y: 695,
      width: 18,
      height: 57,
      fill: "#FFFFFF",
    }),
    text("write the uncomfortable thing", 188, 712, 16, "#FFFFFF", 460),
  ], { scanlines: true, scanlineOpacity: 0.045, scanlineSpacing: 12, frame: true, frameInset: 86, frameOpacity: 0.13 }),
  make("Quiet Proof", white, [
    ...brand(),
    text(
      "NO NECESITAS\nPARECER OCUPADO.\nNECESITAS\nESTAR HACIENDO\nALGO REAL.",
      113,
      177,
      48,
      "#000000",
      710,
    ),
    segment("Proof rule", 114, 632, 492, 0, "#000000", 3),
    text("EL SILENCIO TAMBIÉN PUEDE SER PRUEBA.", 114, 671, 16, "#000000", 570),
    base("rect", {
      name: "Proof mark",
      x: 847,
      y: 681,
      width: 115,
      height: 115,
      fill: "#000000",
      radius: 58,
    }),
    text("01", 875, 725, 21, "#FFFFFF", 70),
  ]),
  make("Read Receipt", white, [
    ...brand(),
    text("mensaje no enviado", 135, 223, 17, "#000000", 280),
    base("rect", {
      name: "Incoming message",
      x: 128,
      y: 275,
      width: 580,
      height: 173,
      fill: "#E9E9E6",
      radius: 34,
    }),
    text(
      "NO TODO LO QUE\nSIENTES NECESITA\nSER PUBLICADO.",
      169,
      321,
      29,
      "#000000",
      460,
    ),
    text("11:11", 172, 474, 15, "#777777", 90),
    base("rect", {
      name: "Typing field",
      x: 128,
      y: 617,
      width: 824,
      height: 85,
      fill: "transparent",
      stroke: "#000000",
      strokeWidth: 2,
      radius: 42,
    }),
    text("escribe algo que sí importe", 171, 647, 18, "#777777", 490),
    cross(887, 648, "#000000", 24),
    text("leído", 128, 746, 15, "#777777", 90),
  ]),
  make("The Gap", white, [
    ...brand(),
    text(
      "ENTRE\nQUIEN ERES\nY QUIEN\nQUIERES SER",
      105,
      178,
      59,
      "#000000",
      540,
    ),
    segment("Gap divider", 657, 178, 570, 90, "#000000", 3),
    text(
      "hay una práctica\nque no estás haciendo",
      714,
      463,
      25,
      "#000000",
      255,
    ),
    text("NO ES FALTA DE TALENTO.", 105, 883, 17, "#000000", 420),
    text("ES FRICCIÓN SIN NOMBRE.", 105, 917, 17, "#000000", 450),
  ]),
  make("Orbit of One", black, [
    ...brand("#FFFFFF"),
    base("circle", {
      name: "Outer orbit",
      x: 134,
      y: 178,
      width: 812,
      height: 812,
      fill: "transparent",
      stroke: "#FFFFFF",
      strokeWidth: 2,
    }),
    base("circle", {
      name: "Inner orbit",
      x: 337,
      y: 382,
      width: 406,
      height: 406,
      fill: "transparent",
      stroke: "#FFFFFF",
      strokeWidth: 2,
    }),
    base("circle", {
      name: "Now",
      x: 502,
      y: 546,
      width: 78,
      height: 78,
      fill: "#FFFFFF",
    }),
    text("UNA COSA.\nPOR EL TIEMPO\nSUFICIENTE.", 244, 302, 37, "#FFFFFF", 590),
    text("NO MÁS / NO MENOS", 420, 842, 16, "#FFFFFF", 290),
    segment("Orbit pointer", 540, 178, 82, 90, "#FFFFFF", 4),
  ]),
  make(
    "Friction Field",
    white,
    [
      ...brand(),
      rotated(
        "NO TODO DEBE SENTIRSE FÁCIL.",
        -112,
        426,
        38,
        "#000000",
        900,
        -28,
        0.12,
      ),
      segment("Friction axis", 126, 819, 824, 0, "#000000", 3),
      base("circle", {
        name: "Friction point",
        x: 489,
        y: 774,
        width: 92,
        height: 92,
        fill: "#000000",
      }),
      text(
        "LA RESISTENCIA\nNO SIEMPRE ES\nUNA SEÑAL PARA\nDETENERTE.",
        125,
        208,
        50,
        "#000000",
        670,
      ),
      text("A VECES ES LA PUERTA.", 125, 861, 18, "#000000", 450),
    ],
    {
      noise: true,
      noiseAmount: 35,
      noiseOpacity: 0.08,
      noiseScale: 1,
      seed: 13,
    },
  ),
  make("Unsent Note", black, [
    ...brand("#FFFFFF"),
    base("rect", {
      name: "Note frame",
      x: 118,
      y: 182,
      width: 844,
      height: 707,
      fill: "transparent",
      stroke: "#FFFFFF",
      strokeWidth: 2,
    }),
    text("NOTES / 003", 152, 220, 16, "#FFFFFF", 240),
    text(
      "NO QUIERO\nUNA VIDA QUE\nSE VEA BIEN.\nQUIERO UNA QUE\nSE SIENTA MÍA.",
      153,
      324,
      50,
      "#FFFFFF",
      650,
    ),
    base("rect", {
      name: "Selection",
      x: 148,
      y: 694,
      width: 507,
      height: 62,
      fill: "#FFFFFF",
    }),
    text("este es el punto", 171, 714, 19, "#000000", 300),
    text("draft / never sent", 153, 832, 16, "#FFFFFF", 260),
  ]),
  make("One Thing", white, [
    ...brand(),
    text("UNA", 85, 257, 160, "#000000", 820),
    text("COSA", 85, 413, 160, "#000000", 820),
    text("A LA VEZ.", 85, 569, 160, "#000000", 820),
    base("rect", {
      name: "One thing counter",
      x: 818,
      y: 711,
      width: 136,
      height: 136,
      fill: "#000000",
      radius: 68,
    }),
    text("01", 850, 758, 27, "#FFFFFF", 80),
    text("la atención no es infinita", 85, 889, 18, "#000000", 420),
  ]),
  make("Signal / Noise", black, [
    ...brand("#FFFFFF"),
    text("SEÑAL", 105, 228, 86, "#FFFFFF", 620),
    text("RUIDO", 390, 442, 86, "#FFFFFF", 620),
    segment("Noise strike 1", 93, 418, 868, -15, "#FFFFFF", 3),
    segment("Noise strike 2", 115, 476, 740, -15, "#FFFFFF", 3),
    text("NO TODO MERECE\nTU ATENCIÓN.", 105, 746, 37, "#FFFFFF", 540),
    text("elige lo que entra", 105, 866, 17, "#FFFFFF", 300),
  ], { scanlines: true, scanlineOpacity: 0.035, scanlineSpacing: 10 }),
  make("Stack Overflow", black, [
    ...brand("#FFFFFF"),
    rotated("VOLVER A EMPEZAR", -122, 208, 42, "#FFFFFF", 900, -18, 0.15),
    rotated("VOLVER A EMPEZAR", -90, 326, 42, "#FFFFFF", 900, -18, 0.24),
    rotated("VOLVER A EMPEZAR", -56, 444, 42, "#FFFFFF", 900, -18, 0.35),
    text("VOLVER\nA EMPEZAR.", 133, 625, 68, "#FFFFFF", 720),
    text("NO ES RETROCEDER.", 137, 838, 18, "#FFFFFF", 430),
    text("ES ELEGIR DE NUEVO.", 137, 875, 18, "#FFFFFF", 450),
  ]),
  make("Corner Thesis", white, [
    rotated("@jaywrkr", 38, 215, 18, "#000000", 170, -90),
    rotated("#simple", 1022, 877, 18, "#000000", 120, 90),
    cross(67, 535, "#000000", 19),
    cross(993, 535, "#000000", 19),
    text(
      "LAS COSAS\nQUE CAMBIAN\nTU VIDA\nRARAS VECES\nSE VEN URGENTES.",
      198,
      208,
      53,
      "#000000",
      665,
    ),
    text("PERO PIDEN QUE VUELVAS.", 198, 810, 17, "#000000", 510),
  ]),
  make("Buffering", black, [
    ...brand("#FFFFFF"),
    text("BUFFERING", 110, 198, 18, "#FFFFFF", 280),
    base("rect", {
      name: "Buffer outline",
      x: 110,
      y: 278,
      width: 860,
      height: 62,
      fill: "transparent",
      stroke: "#FFFFFF",
      strokeWidth: 2,
    }),
    base("rect", {
      name: "Buffer progress",
      x: 110,
      y: 278,
      width: 314,
      height: 62,
      fill: "#FFFFFF",
    }),
    text("36%", 445, 296, 18, "#FFFFFF", 80),
    text(
      "TU VIDA NO ESTÁ\nEN PAUSA.\nESTÁ CARGANDO\nLO QUE REPITES.",
      110,
      446,
      57,
      "#FFFFFF",
      735,
    ),
    text("no cierres la ventana todavía", 110, 849, 17, "#FFFFFF", 480),
  ], { dotField: true, dotOpacity: 0.09, dotSpacing: 54, dotSize: 1, vignette: true, vignetteOpacity: 0.09 }),
  make("Center Quote", white, [
    ...brand(),
    text("LA CLARIDAD NO LLEGA\nDE REPENTE.", 210, 455, 48, "#000000", 650),
  ]),
  make("Centered Caps", white, [
    ...brand(),
    text(
      "REPETIR UNA ELECCIÓN\nTAMBIÉN ES ELEGIR",
      145,
      475,
      44,
      "#000000",
      790,
    ),
  ]),
  make("Black Simple", black, [
    ...brand("#FFFFFF"),
    text("SIMPLE", 570, 255, 18, "#FFFFFF", 350),
    text("HACER MENOS\nPERO MEJOR.", 570, 310, 48, "#FFFFFF", 420),
  ]),
  make("Circle Quote", black, [
    ...brand("#FFFFFF"),
    base("circle", {
      name: "Circle",
      x: 125,
      y: 155,
      width: 830,
      height: 830,
      fill: "transparent",
      stroke: "#FFFFFF",
      strokeWidth: 3,
    }),
    text(
      "TODO CAMBIA\nCUANDO CAMBIAS\nLO QUE REPITES.",
      275,
      450,
      38,
      "#FFFFFF",
      550,
    ),
  ]),
  make("Mirror Text", black, [
    ...brand("#FFFFFF"),
    text("NADIE VA A\nHACERLO POR TI.", 110, 260, 48, "#FFFFFF", 540),
    rotated("NADIE VA A\nHACERLO POR TI.", 430, 650, 48, "#FFFFFF", 540, 180),
  ]),
  make("Two Statements", black, [
    ...brand("#FFFFFF"),
    text("SI ES IMPORTANTE,\nENCUENTRA ESPACIO.", 110, 245, 38, "#FFFFFF", 570),
    text("SI NO,\nENCUENTRA UNA EXCUSA.", 420, 720, 38, "#FFFFFF", 520),
  ]),
  make("Large Empty Space", white, [
    ...brand(),
    text(
      "LA PAUSA\nTAMBIÉN ES PARTE\nDEL TRABAJO.",
      100,
      170,
      27,
      "#000000",
      430,
    ),
  ]),
  make("Message Bubble", white, [
    ...brand(),
    text("Hoy a las 11:11", 160, 335, 20, "#000000", 350),
    base("rect", {
      name: "Message",
      x: 145,
      y: 385,
      width: 690,
      height: 200,
      fill: "#EDEDED",
      radius: 38,
    }),
    text(
      "NO TODO LO QUE PIENSAS\nNECESITA UNA RESPUESTA.",
      195,
      445,
      30,
      "#000000",
      560,
    ),
    text("Visto", 160, 620, 18, "#8C8C8C", 100),
  ]),
  make("Reminder", white, [
    ...brand(),
    base("rect", {
      name: "Reminder Card",
      x: 125,
      y: 710,
      width: 830,
      height: 215,
      fill: "#EDEDED",
      radius: 34,
    }),
    base("circle", {
      name: "Reminder Icon",
      x: 165,
      y: 765,
      width: 68,
      height: 68,
      fill: "#000000",
    }),
    text("Recordatorio", 270, 755, 26, "#000000", 500),
    text("no olvidar lo que ya sabes", 270, 805, 20, "#000000", 500),
  ]),
  make("Word Stack", white, [
    ...brand(),
    text("EL FUTURO", 100, 240, 60, "#000000", 720),
    text("NO\nRESPETA", 380, 455, 60, "#000000", 550),
    text("TUS\nEXCUSAS", 100, 720, 60, "#000000", 620),
  ]),
  make("Venn / Geometry", white, [
    ...brand(),
    base("ellipse", {
      name: "Ellipse A",
      x: 140,
      y: 270,
      width: 520,
      height: 390,
      fill: "transparent",
      stroke: "#000000",
      strokeWidth: 3,
    }),
    base("ellipse", {
      name: "Ellipse B",
      x: 420,
      y: 410,
      width: 520,
      height: 390,
      fill: "transparent",
      stroke: "#000000",
      strokeWidth: 3,
    }),
    text("LO QUE\nQUIERES", 225, 405, 27, "#000000", 200),
    text("LO QUE\nHACES", 630, 590, 27, "#000000", 200),
    text("AHORA", 472, 540, 25, "#000000", 160),
  ]),
  make("Repeated Text", black, [
    ...brand("#FFFFFF"),
    text("EL TIEMPO\nES AHORA", 190, 450, 65, "#FFFFFF", 700),
    rotated("EL TIEMPO ES AHORA", -120, 150, 28, "#FFFFFF", 650, -18, 0.18),
    rotated("EL TIEMPO ES AHORA", 350, 860, 28, "#FFFFFF", 700, -18, 0.18),
  ]),
  make(
    "Grain Gradient",
    { type: "linear", color: "#FFFFFF", colorB: "#000000", angle: 38 },
    [
      ...brand("#FFFFFF"),
      text("EL CONTRASTE\nTAMBIÉN HABLA.", 120, 470, 54, "#FFFFFF", 720),
    ],
    {
      noise: true,
      noiseAmount: 74,
      noiseOpacity: 0.24,
      noiseScale: 2,
      seed: 77,
    },
  ),
  make("Rotated Corners", white, [
    rotated("@jaywrkr", 38, 180, 18, "#000000", 170, -90),
    rotated("#simple", 1020, 900, 18, "#000000", 120, 90),
    cross(70, 530),
    cross(990, 530),
    text("NO NECESITAS\nMÁS RUIDO.", 190, 450, 54, "#000000", 700),
  ]),
  make("Large Quote", white, [
    ...brand(),
    text(
      "SER CONSISTENTE\nNO ES HACER MÁS.\nES VOLVER.",
      90,
      365,
      64,
      "#000000",
      820,
    ),
  ]),
  make("Slow Signal", black, [
    ...brand("#FFFFFF"),
    text("LA SEÑAL\nLLEGA LENTO.", 105, 190, 66, "#FFFFFF", 650),
    segment("Signal step 1", 110, 795, 140, 0, "#FFFFFF", 5),
    segment("Signal rise 1", 250, 775, 20, 90, "#FFFFFF", 5),
    segment("Signal step 2", 250, 775, 140, 0, "#FFFFFF", 5),
    segment("Signal rise 2", 390, 735, 40, 90, "#FFFFFF", 5),
    segment("Signal step 3", 390, 735, 140, 0, "#FFFFFF", 5),
    segment("Signal rise 3", 530, 650, 85, 90, "#FFFFFF", 5),
    segment("Signal step 4", 530, 650, 140, 0, "#FFFFFF", 5),
    segment("Signal rise 4", 670, 505, 145, 90, "#FFFFFF", 5),
    segment("Signal step 5", 670, 505, 150, 0, "#FFFFFF", 5),
    segment("Signal rise 5", 820, 270, 235, 90, "#FFFFFF", 5),
    segment("Signal step 6", 820, 270, 135, 0, "#FFFFFF", 5),
    text("constancia > intensidad", 110, 860, 17, "#FFFFFF", 430),
  ]),
  make("Attention Window", white, [
    ...brand(),
    base("rect", {
      name: "Attention window",
      x: 105,
      y: 228,
      width: 870,
      height: 585,
      fill: "#000000",
      radius: 8,
    }),
    base("rect", {
      name: "Window header",
      x: 105,
      y: 228,
      width: 870,
      height: 56,
      fill: "#EDEDED",
      radius: 8,
    }),
    cross(151, 247, "#000000", 16),
    text("ATTENTION.EXE", 188, 246, 16, "#000000", 300),
    text("TU ATENCIÓN\nES TU OBRA.", 165, 395, 62, "#FFFFFF", 650),
    text("running / no distractions found", 165, 700, 16, "#FFFFFF", 520),
  ]),
  make("Pressure Map", black, [
    ...brand("#FFFFFF"),
    base("circle", {
      name: "Pressure radius",
      x: 180,
      y: 182,
      width: 720,
      height: 720,
      fill: "transparent",
      stroke: "#FFFFFF",
      strokeWidth: 2,
    }),
    base("circle", {
      name: "Pressure core",
      x: 485,
      y: 487,
      width: 110,
      height: 110,
      fill: "#FFFFFF",
    }),
    segment("Pressure trajectory 1", 120, 720, 150, -21, "#FFFFFF", 3),
    segment("Pressure trajectory 2", 260, 665, 128, -33, "#FFFFFF", 3),
    segment("Pressure trajectory 3", 365, 595, 131, -24, "#FFFFFF", 3),
    segment("Pressure trajectory 4", 485, 542, 144, -28, "#FFFFFF", 3),
    segment("Pressure trajectory 5", 610, 475, 171, -28, "#FFFFFF", 3),
    segment("Pressure trajectory 6", 760, 390, 218, -32, "#FFFFFF", 3),
    text("PRESIÓN", 105, 135, 18, "#FFFFFF", 220),
    text("LO QUE EVITAS\nTAMBIÉN TE ENTRENA.", 205, 758, 30, "#FFFFFF", 560),
  ]),
  make("Private Error", white, [
    ...brand(),
    text("SYSTEM MESSAGE", 118, 222, 17, "#000000", 300),
    base("rect", {
      name: "Error frame",
      x: 105,
      y: 275,
      width: 870,
      height: 415,
      fill: "transparent",
      stroke: "#000000",
      strokeWidth: 3,
    }),
    base("rect", {
      name: "Error status",
      x: 105,
      y: 275,
      width: 870,
      height: 69,
      fill: "#000000",
    }),
    text("ERROR 001 / SELF-ABANDONMENT", 135, 297, 17, "#FFFFFF", 600),
    text("NO ESTÁS\nBLOQUEADO.", 145, 395, 61, "#000000", 580),
    text(
      "ESTÁS LEJOS DE LA COSA\nQUE DIJISTE QUE IMPORTABA.",
      145,
      567,
      24,
      "#000000",
      630,
    ),
  ]),
  make("Ritual Loop", white, [
    ...brand(),
    text("RITUAL", 108, 164, 17, "#000000", 220),
    base("circle", {
      name: "Ritual orbit",
      x: 155,
      y: 257,
      width: 770,
      height: 770,
      fill: "transparent",
      stroke: "#000000",
      strokeWidth: 3,
    }),
    base("circle", {
      name: "Ritual now",
      x: 504,
      y: 606,
      width: 72,
      height: 72,
      fill: "#000000",
    }),
    text("VOLVER\nA LA COSA.", 330, 425, 49, "#000000", 420),
    text("empezar · sostener · volver", 330, 725, 17, "#000000", 410),
    segment("Ritual marker", 539, 257, 63, 90, "#000000", 5),
  ]),
  make(
    "Noise Audit",
    black,
    [
      ...brand("#FFFFFF"),
      text("TODO LO QUE\nMIRAS TE\nDISEÑA.", 100, 235, 69, "#FFFFFF", 730),
      text("01 / ELIGE TUS INPUTS", 105, 830, 18, "#FFFFFF", 370),
      text("02 / PROTEGE TU ATENCIÓN", 105, 875, 18, "#FFFFFF", 470),
      text("03 / HAZ ESPACIO", 105, 920, 18, "#FFFFFF", 330),
      segment("Audit rule", 105, 790, 870, 0, "#FFFFFF", 2),
    ],
    {
      noise: true,
      noiseAmount: 42,
      noiseOpacity: 0.1,
      noiseScale: 1,
      seed: 91,
      dotField: true,
      dotOpacity: 0.06,
      dotSpacing: 58,
      dotSize: 1,
    },
  ),
];
const cloneTemplate = (template: Template): Design => ({
  ...template.design,
  id: uid(),
  name: template.name,
  elements: template.design.elements.map((e) => ({
    ...(e.type === "text" && (e.fontSize || 0) >= 28 ? fitCanvasText(e) : e),
    id: uid(),
  })),
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
});
const referenceTemplateIds = [
  "jay-reminder",
  "jay-repeater",
  "jay-centered-statement",
  "jay-venn",
  "jay-wide-statement",
] as const;
const lockedReferenceTemplates = new Set<string>(referenceTemplateIds);
const compatibleTemplates: Record<BrandFormat, string[]> = {
  "text art": ["jay-quiet-paper", "jay-quiet-ink", "jay-grain-left", "jay-grain-right", "jay-circle-quote", "jay-mirror", "jay-repeater"],
  SIMPLE: ["jay-centered-caps", "jay-simple-paper", "jay-simple-ink", "jay-reminder"],
  carousel: ["jay-four-sides", "jay-quiet-paper", "jay-quiet-ink", "jay-message", "jay-grain-left", "jay-grain-right"],
  context: ["jay-message", "jay-quiet-paper", "jay-quiet-ink", "jay-grain-left", "jay-grain-right", "jay-mirror"],
};
const effectVariations: Array<Partial<Effects>> = [
  { noise: false, scanlines: false, dotField: false, vignette: false, frame: false },
  { noise: true, noiseAmount: 48, noiseOpacity: 0.09, noiseScale: 2, scanlines: false, dotField: false, vignette: false, frame: false },
  { noise: false, scanlines: true, scanlineOpacity: 0.035, scanlineSpacing: 13, dotField: false, vignette: true, vignetteOpacity: 0.09, frame: false },
  { noise: false, scanlines: false, dotField: true, dotOpacity: 0.055, dotSpacing: 54, dotSize: 1.2, vignette: false, frame: true, frameInset: 48, frameOpacity: 0.16 },
  { noise: true, noiseAmount: 66, noiseOpacity: 0.11, noiseScale: 2, scanlines: false, dotField: false, vignette: true, vignetteOpacity: 0.12, frame: false },
  { noise: false, scanlines: false, dotField: false, vignette: false, frame: true, frameInset: 66, frameOpacity: 0.22 },
  { noise: true, noiseAmount: 38, noiseOpacity: 0.075, noiseScale: 1, scanlines: false, dotField: true, dotOpacity: 0.04, dotSpacing: 62, dotSize: 1, vignette: false, frame: false },
  { noise: true, noiseAmount: 28, noiseOpacity: 0.055, noiseScale: 3, scanlines: true, scanlineOpacity: 0.025, scanlineSpacing: 18, dotField: false, vignette: false, frame: false },
  { noise: false, scanlines: false, dotField: true, dotOpacity: 0.075, dotSpacing: 36, dotSize: 0.9, vignette: true, vignetteOpacity: 0.08, frame: false },
  { noise: true, noiseAmount: 74, noiseOpacity: 0.08, noiseScale: 1, scanlines: false, dotField: false, vignette: false, frame: true, frameInset: 84, frameOpacity: 0.14 },
  { noise: false, scanlines: true, scanlineOpacity: 0.022, scanlineSpacing: 8, dotField: false, vignette: false, frame: true, frameInset: 52, frameOpacity: 0.12 },
  { noise: true, noiseAmount: 44, noiseOpacity: 0.065, noiseScale: 2, scanlines: false, dotField: true, dotOpacity: 0.03, dotSpacing: 42, dotSize: 1.4, vignette: true, vignetteOpacity: 0.1, frame: false },
  { noise: false, scanlines: false, dotField: false, vignette: true, vignetteOpacity: 0.18, frame: true, frameInset: 72, frameOpacity: 0.11 },
];
const stableNumber = (value: string) => [...value].reduce((hash, char) => ((hash * 31) + char.charCodeAt(0)) >>> 0, 17);
const splitCopy = (value: string, parts: number) => {
  const words = value.replace(/\s+/g, " ").trim().split(" ").filter(Boolean);
  if (parts <= 1 || words.length <= parts) return Array.from({ length: parts }, (_, index) => words[index] || "");
  const result: string[] = [];
  let cursor = 0;
  for (let index = 0; index < parts; index += 1) {
    const remainingParts = parts - index;
    const take = Math.ceil((words.length - cursor) / remainingParts);
    result.push(words.slice(cursor, cursor + take).join(" "));
    cursor += take;
  }
  return result;
};
const layoutRegions: TextRegion[] = [
  { x: 96, y: 198, width: 790, height: 660, align: "left", verticalAlign: "top" },
  { x: 96, y: 280, width: 790, height: 520, align: "left", verticalAlign: "middle" },
  { x: 96, y: 640, width: 790, height: 300, align: "left", verticalAlign: "bottom" },
  { x: 120, y: 198, width: 840, height: 660, align: "center", verticalAlign: "top" },
  { x: 120, y: 280, width: 840, height: 520, align: "center", verticalAlign: "middle" },
  { x: 120, y: 640, width: 840, height: 300, align: "center", verticalAlign: "bottom" },
  { x: 194, y: 198, width: 790, height: 660, align: "right", verticalAlign: "top" },
  { x: 194, y: 280, width: 790, height: 520, align: "right", verticalAlign: "middle" },
  { x: 194, y: 640, width: 790, height: 300, align: "right", verticalAlign: "bottom" },
];
const movableLayoutTemplates = new Set([
  "jay-quiet-paper",
  "jay-quiet-ink",
  "jay-centered-caps",
  "jay-simple-paper",
  "jay-simple-ink",
  "jay-repeater",
]);
const fitTextInRegion = (
  item: StudioElement,
  value: string,
  region?: Partial<TextRegion>,
  uppercase = false,
) => {
  const x = Math.max(36, Math.min(region?.x ?? item.x, SIZE - 180));
  const y = Math.max(92, Math.min(region?.y ?? item.y, SIZE - 120));
  const width = Math.max(180, Math.min(region?.width ?? item.width, SIZE - x - 44));
  const availableHeight = Math.max(90, Math.min(region?.height ?? (SIZE - y - 44), SIZE - y - 44));
  const maximum = Math.min(item.fontSize || 36, value.length < 55 ? 46 : 38);
  const minimum = 14;
  let fontSize = maximum;
  let copy = value;
  let requiredHeight = availableHeight;
  while (fontSize >= minimum) {
    copy = wrapCanvasCopy(value, width, fontSize, item.letterSpacing || 0);
    requiredHeight = Math.ceil(fontSize * (item.lineHeight || 1.2) * Math.max(1, copy.split("\n").length) + 22);
    if (requiredHeight <= availableHeight) break;
    fontSize -= 1;
  }
  const align = region?.align ?? item.align ?? "left";
  const fittedY = region?.verticalAlign === "bottom"
    ? Math.max(92, y + availableHeight - requiredHeight)
    : region?.verticalAlign === "middle"
      ? Math.max(92, y + (availableHeight - requiredHeight) / 2)
      : y;
  const safeY = Math.max(40, Math.min(fittedY, SIZE - requiredHeight - 40));
  return {
    ...item,
    x,
    y: safeY,
    width,
    height: Math.min(requiredHeight, SIZE - safeY - 40),
    fontSize,
    align,
    text: copy,
    name: value.slice(0, 24) || item.name,
    uppercase: uppercase || item.uppercase,
  };
};
// The five reference templates are compositions, not flexible layouts. Their
// typography and coordinates must remain exactly as drawn in the references.
// AI copy is constrained at the API boundary; here we only wrap it at the
// fixed font size and retain every original coordinate and measurement.
const fitLockedReferenceText = (
  item: StudioElement,
  value: string,
  uppercase = false,
) => {
  const copy = wrapCanvasCopy(value, item.width, item.fontSize || 31, item.letterSpacing || 0);
  const lines = Math.max(1, copy.split("\n").length);
  return {
    ...item,
    text: copy,
    height: Math.ceil((item.fontSize || 31) * (item.lineHeight || 1.2) * lines + 18),
    name: value.slice(0, 24) || item.name,
    uppercase: uppercase || item.uppercase,
  };
};
const variedBackground = (background: Background, variant: number): Background => {
  const dark = background.color.toLowerCase() !== "#ffffff" && background.color.toLowerCase() !== "#f5f5f5";
  const mode = variant % 6;
  if (mode === 0) return background;
  if (mode === 1) return { type: "linear", color: dark ? "#000000" : "#FFFFFF", colorB: dark ? "#242424" : "#DEDEDE", angle: 0 };
  if (mode === 2) return { type: "linear", color: dark ? "#050505" : "#FFFFFF", colorB: dark ? "#303030" : "#E8E8E8", angle: 90 };
  if (mode === 3) return { type: "radial", color: dark ? "#242424" : "#FFFFFF", colorB: dark ? "#000000" : "#D8D8D8", angle: 0 };
  if (mode === 4) return { type: "linear", color: dark ? "#2B2B2B" : "#DADADA", colorB: dark ? "#000000" : "#FFFFFF", angle: 32 };
  return { type: "linear", color: dark ? "#000000" : "#FFFFFF", colorB: dark ? "#181818" : "#E7E7E7", angle: 145 };
};
const isDarkHex = (value: string) => {
  const hex = value.replace("#", "");
  if (!/^[0-9a-f]{6}$/i.test(hex)) return false;
  const red = Number.parseInt(hex.slice(0, 2), 16);
  const green = Number.parseInt(hex.slice(2, 4), 16);
  const blue = Number.parseInt(hex.slice(4, 6), 16);
  return (red * 299 + green * 587 + blue * 114) / 1000 < 128;
};
const buildIdeaDesign = (
  route: IdeaRoute,
  requestedTemplateId?: string,
) => {
  const requestedTemplate = requestedTemplateId || route.templateId;
  const templateId =
    requestedTemplate === "jay-mirror" && route.copy.length > 92
      ? "jay-quiet-ink"
      : requestedTemplate === "jay-message" && route.copy.length > 90
        ? "jay-quiet-paper"
        : requestedTemplate;
  const source = templates.find((template) => template.id === templateId);
  if (!source) return null;
  const next = cloneTemplate(source);
  const variant = route.effectVariant ?? stableNumber(`${route.id}-${route.copy}`);
  if (!lockedReferenceTemplates.has(templateId)) {
    next.effects = {
      ...next.effects,
      ...effectVariations[(variant * 5 + 3) % effectVariations.length],
      seed: 31 + (variant % 67),
    };
    next.background = variedBackground(next.background, Math.floor(variant / 2));
  }
  const copyTargets = next.elements
    .filter((item) => item.type === "text" && (item.fontSize || 0) >= 28 && item.text?.toUpperCase() !== "SIMPLE")
    .sort((a, b) => a.y - b.y);
  const primaryId = copyTargets[0]?.id;
  const selectedLayout = !lockedReferenceTemplates.has(templateId) && movableLayoutTemplates.has(templateId)
    ? layoutRegions[(variant * 7 + stableNumber(templateId)) % layoutRegions.length]
    : undefined;
  const layout = selectedLayout && templateId.startsWith("jay-simple-") && selectedLayout.y < 250
    ? { ...selectedLayout, y: 260, height: selectedLayout.height - 62 }
    : selectedLayout;
  const segmentedParts = route.segments?.length === copyTargets.length
    ? route.segments
    : splitCopy(route.copy, copyTargets.length);
  next.elements = next.elements.map((item) => {
    const index = copyTargets.findIndex((target) => target.id === item.id);
    if (index < 0) return item;
    if (templateId === "jay-four-sides") {
      if (index === 0) return fitTextInRegion(item, route.copy, { height: 470 }, Boolean(route.uppercase));
      return route.counterpoint
        ? fitTextInRegion(item, route.counterpoint, { height: 210 }, Boolean(route.uppercase))
        : { ...item, visible: false };
    }
    if (templateId === "jay-repeater") {
      return fitLockedReferenceText(item, route.copy, true);
    }
    if (templateId === "jay-reminder") {
      const segment = segmentedParts[index] || route.copy;
      return fitLockedReferenceText(item, segment, true);
    }
    if (templateId === "jay-venn") {
      return fitLockedReferenceText(item, segmentedParts[index] || route.copy, false);
    }
    if (lockedReferenceTemplates.has(templateId)) {
      return fitLockedReferenceText(item, route.copy, Boolean(route.uppercase));
    }
    if (templateId === "jay-mirror") {
      return fitTextInRegion(item, route.copy, { height: 330 }, Boolean(route.uppercase));
    }
    return fitTextInRegion(item, route.copy, index === 0 ? layout : undefined, Boolean(route.uppercase));
  });
  next.name = route.title;
  return { design: next, primaryId };
};
const ideaFrames: Record<
  IdeaTension,
  { label: string; contrast: string; mirror: string }
> = {
  time: {
    label: "tiempo",
    contrast: "No todo lo urgente merece tu vida.",
    mirror: "El tiempo también se pierde en lo que toleras.",
  },
  freedom: {
    label: "libertad",
    contrast: "La libertad no siempre se siente cómoda.",
    mirror: "Toda libertad importante trae una renuncia.",
  },
  limits: {
    label: "límites",
    contrast: "Decir que sí también es elegir un costo.",
    mirror: "Un límite no necesita una defensa larga.",
  },
  money: {
    label: "dinero",
    contrast: "Ganar más no siempre compra más vida.",
    mirror: "El dinero resuelve algunos problemas y revela otros.",
  },
  identity: {
    label: "identidad",
    contrast: "Cambiar incomoda a quien necesitaba que siguieras igual.",
    mirror: "No tienes que seguir siendo una versión antigua de ti.",
  },
  routine: {
    label: "rutina",
    contrast: "Lo conocido no siempre es lo correcto.",
    mirror: "La rutina puede ocultar una decisión que ya no eliges.",
  },
  other: {
    label: "esto",
    contrast: "No todo necesita más esfuerzo.",
    mirror: "La parte difícil casi siempre es admitirlo.",
  },
};
const cleanIdea = (input: string) =>
  input
    .replace(/\s+/g, " ")
    .trim()
    .replace(/^[-–—]+\s*/, "")
    .slice(0, 220);
const buildIdeaRoutes = (
  input: string,
  tension: IdeaTension,
): IdeaRoute[] => {
  const idea = cleanIdea(input);
  const frame = ideaFrames[tension];
  if (!idea) return [];
  return [
    {
      id: "quiet",
      title: "Decirlo sin ruido",
      label: "Papel sobrio · reflexión directa",
      templateId: "jay-quiet-paper",
      copy: idea,
    },
    {
      id: "contrast",
      title: "La pregunta incómoda",
      label: "Cuatro lados · tensión y remate",
      templateId: "jay-four-sides",
      copy: `${frame.contrast}\n\nQuizá la pregunta no es cómo conseguir más.`,
      counterpoint: idea,
    },
    {
      id: "mirror",
      title: "La parte que se repite",
      label: "Espejo · idea que no puedes ignorar",
      templateId: "jay-mirror",
      copy: `${idea}\n\n${frame.mirror}`,
    },
    {
      id: "caps",
      title: "El recordatorio",
      label: "Mayúsculas centradas · una verdad frontal",
      templateId: "jay-centered-caps",
      copy: `${frame.contrast}\n\n${idea}`,
      uppercase: true,
    },
  ];
};
void buildIdeaRoutes;
const emptyDesign = (): Design => ({
  id: uid(),
  name: "Post sin título",
  background: { ...white },
  effects: {
    noise: false,
    noiseAmount: 55,
    noiseOpacity: 0.14,
    noiseScale: 2,
    seed: 44,
    scanlines: false,
    scanlineOpacity: 0.08,
    scanlineSpacing: 12,
    dotField: false,
    dotOpacity: 0.12,
    dotSpacing: 48,
    dotSize: 1.5,
    vignette: false,
    vignetteOpacity: 0.16,
    frame: false,
    frameInset: 48,
    frameOpacity: 0.28,
  },
  elements: brand(),
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
});

type PreviewDesign = Pick<Design, "background" | "elements">;

function DesignPreview({ design }: { design: PreviewDesign }) {
  const { background, elements } = design;
  const backgroundFill =
    background.type === "solid"
      ? background.color
      : background.type === "linear"
        ? "url(#preview-linear)"
        : "url(#preview-radial)";

  return (
    <div className="mini" aria-hidden="true">
      <svg className="mini-svg" viewBox={`0 0 ${SIZE} ${SIZE}`}>
        <defs>
          <linearGradient
            id="preview-linear"
            x1="0"
            y1="0"
            x2="1"
            y2="1"
            gradientTransform={`rotate(${background.angle} .5 .5)`}
          >
            <stop offset="0%" stopColor={background.color} />
            <stop offset="100%" stopColor={background.colorB} />
          </linearGradient>
          <radialGradient id="preview-radial">
            <stop offset="0%" stopColor={background.color} />
            <stop offset="100%" stopColor={background.colorB} />
          </radialGradient>
        </defs>
        <rect width={SIZE} height={SIZE} fill={backgroundFill} />
        {elements.filter((item) => item.visible).map((item) => {
          const stroke = item.stroke || item.fill;
          const fontSize = item.fontSize || 24;
          const textX =
            item.align === "center"
              ? item.width / 2
              : item.align === "right"
                ? item.width
                : 0;
          const textAnchor =
            item.align === "center"
              ? "middle"
              : item.align === "right"
                ? "end"
                : "start";
          const weight =
            item.fontStyle === "normal"
              ? 400
              : item.fontStyle === "bold"
                ? 700
                : item.fontStyle || 400;

          return (
            <g
              key={item.id}
              transform={`translate(${item.x} ${item.y}) rotate(${item.rotation})`}
              opacity={item.opacity}
            >
              {item.type === "text" && (
                <text
                  x={textX}
                  y={fontSize}
                  fill={item.fill}
                  fontFamily="Geist Mono"
                  fontSize={fontSize}
                  fontWeight={weight}
                  fontStyle={item.fontStyle === "italic" ? "italic" : "normal"}
                  letterSpacing={item.letterSpacing || 0}
                  textAnchor={textAnchor}
                >
                  {(item.uppercase ? (item.text || "").toUpperCase() : item.text || "")
                    .split("\n")
                    .map((line, index) => (
                      <tspan
                        key={`${item.id}-${index}`}
                        x={textX}
                        dy={index === 0 ? 0 : fontSize * (item.lineHeight || 1.2)}
                      >
                        {line}
                      </tspan>
                    ))}
                </text>
              )}
              {item.type === "image" && item.src && (
                <image
                  href={item.src}
                  width={item.width}
                  height={item.height}
                  preserveAspectRatio="xMidYMid slice"
                />
              )}
              {item.type === "rect" && (
                <rect
                  width={item.width}
                  height={item.height}
                  fill={item.fill}
                  stroke={item.stroke}
                  strokeWidth={item.strokeWidth}
                  rx={item.radius || 0}
                />
              )}
              {item.type === "circle" && (
                <circle
                  cx={item.width / 2}
                  cy={item.height / 2}
                  r={Math.min(item.width, item.height) / 2}
                  fill={item.fill}
                  stroke={item.stroke}
                  strokeWidth={item.strokeWidth}
                />
              )}
              {item.type === "ellipse" && (
                <ellipse
                  cx={item.width / 2}
                  cy={item.height / 2}
                  rx={item.width / 2}
                  ry={item.height / 2}
                  fill={item.fill}
                  stroke={item.stroke}
                  strokeWidth={item.strokeWidth}
                />
              )}
              {item.type === "line" && (
                <line
                  x1="0"
                  y1={item.height / 2}
                  x2={item.width}
                  y2={item.height / 2}
                  stroke={stroke}
                  strokeWidth={item.strokeWidth || 2}
                />
              )}
              {item.type === "plus" && (
                <>
                  <line
                    x1={item.width / 2}
                    y1="0"
                    x2={item.width / 2}
                    y2={item.height}
                    stroke={item.fill}
                    strokeWidth={item.strokeWidth || 2}
                  />
                  <line
                    x1="0"
                    y1={item.height / 2}
                    x2={item.width}
                    y2={item.height / 2}
                    stroke={item.fill}
                    strokeWidth={item.strokeWidth || 2}
                  />
                </>
              )}
            </g>
          );
        })}
      </svg>
    </div>
  );
}

function MiniPreview({ template }: { template: Template }) {
  return (
    <DesignPreview
      design={{
        ...template.design,
        elements: template.design.elements.map((item) =>
          item.type === "text" && (item.fontSize || 0) >= 20
            ? fitCanvasText(item)
            : item,
        ),
      }}
    />
  );
}

function Noise({ effects }: { effects: Effects }) {
  const image = useMemo(() => {
    if (!effects.noise || typeof document === "undefined") return null;
    const canvas = document.createElement("canvas");
    canvas.width = SIZE;
    canvas.height = SIZE;
    const ctx = canvas.getContext("2d");
    if (!ctx) return null;
    const data = ctx.createImageData(SIZE, SIZE);
    let seed = effects.seed || 1;
    const random = () => {
      seed = (seed * 9301 + 49297) % 233280;
      return seed / 233280;
    };
    const step = Math.max(1, Math.round(effects.noiseScale));
    for (let y = 0; y < SIZE; y += step)
      for (let x = 0; x < SIZE; x += step) {
        const v = Math.round(random() * 255);
        for (let sy = 0; sy < step; sy++)
          for (let sx = 0; sx < step; sx++) {
            const p = ((y + sy) * SIZE + x + sx) * 4;
            if (p < data.data.length) {
              data.data[p] = v;
              data.data[p + 1] = v;
              data.data[p + 2] = v;
              data.data[p + 3] = effects.noiseAmount;
            }
          }
      }
    ctx.putImageData(data, 0, 0);
    return canvas;
  }, [effects.noise, effects.noiseAmount, effects.noiseScale, effects.seed]);
  return effects.noise && image ? (
    <KImage
      image={image}
      width={SIZE}
      height={SIZE}
      opacity={effects.noiseOpacity}
      listening={false}
    />
  ) : null;
}

function PostDetails({
  effects,
  background,
}: {
  effects: Effects;
  background: Background;
}) {
  const isDark = isDarkHex(background.color);
  const detailColor = isDark ? "#FFFFFF" : "#000000";
  const vignetteTone = isDark ? "255,255,255" : "0,0,0";
  const spacing = Math.max(4, effects.scanlineSpacing || 12);
  const dotSpacing = Math.max(30, effects.dotSpacing || 48);
  const dots = Array.from(
    { length: Math.ceil(SIZE / dotSpacing) },
    (_, row) =>
      Array.from(
        { length: Math.ceil(SIZE / dotSpacing) },
        (_, column) => ({
          x: column * dotSpacing + dotSpacing / 2,
          y: row * dotSpacing + dotSpacing / 2,
        }),
      ),
  ).flat();

  return (
    <>
      {effects.dotField &&
        dots.map((dot, index) => (
          <KCircle
            key={`dot-${index}`}
            x={dot.x}
            y={dot.y}
            radius={effects.dotSize || 1.5}
            fill={detailColor}
            opacity={effects.dotOpacity || 0.12}
            listening={false}
          />
        ))}
      {effects.scanlines &&
        Array.from({ length: Math.ceil(SIZE / spacing) }).map((_, index) => (
          <Line
            key={`scanline-${index}`}
            points={[0, index * spacing, SIZE, index * spacing]}
            stroke={detailColor}
            strokeWidth={1}
            opacity={effects.scanlineOpacity || 0.08}
            listening={false}
          />
        ))}
      {effects.vignette && (
        <Rect
          width={SIZE}
          height={SIZE}
          fillRadialGradientStartPoint={{ x: SIZE / 2, y: SIZE / 2 }}
          fillRadialGradientEndPoint={{ x: SIZE / 2, y: SIZE / 2 }}
          fillRadialGradientStartRadius={0}
          fillRadialGradientEndRadius={780}
          fillRadialGradientColorStops={[
            0,
            `rgba(${vignetteTone},0)`,
            0.68,
            `rgba(${vignetteTone},0)`,
            1,
            `rgba(${vignetteTone},${effects.vignetteOpacity || 0.16})`,
          ]}
          listening={false}
        />
      )}
      {effects.frame && (
        <Rect
          x={effects.frameInset || 48}
          y={effects.frameInset || 48}
          width={SIZE - 2 * (effects.frameInset || 48)}
          height={SIZE - 2 * (effects.frameInset || 48)}
          stroke={detailColor}
          strokeWidth={2}
          opacity={effects.frameOpacity || 0.28}
          listening={false}
        />
      )}
    </>
  );
}

function CanvasImage({ item }: { item: StudioElement }) {
  const [bitmap, setBitmap] = useState<HTMLImageElement | null>(null);
  useEffect(() => {
    if (!item.src) return;
    const next = new window.Image();
    let cancelled = false;
    next.onload = () => {
      if (!cancelled) setBitmap(next);
    };
    next.src = item.src;
    return () => {
      cancelled = true;
      next.onload = null;
    };
  }, [item.src]);
  if (!item.src || !bitmap) return null;
  const sourceRatio = bitmap.width / bitmap.height;
  const frameRatio = item.width / item.height;
  const crop =
    sourceRatio > frameRatio
      ? {
          x: (bitmap.width - bitmap.height * frameRatio) / 2,
          y: 0,
          width: bitmap.height * frameRatio,
          height: bitmap.height,
        }
      : {
          x: 0,
          y: (bitmap.height - bitmap.width / frameRatio) / 2,
          width: bitmap.width,
          height: bitmap.width / frameRatio,
        };
  return <KImage image={bitmap} width={item.width} height={item.height} crop={crop} />;
}

function StudioCanvas({
  design,
  selected,
  setSelected,
  updateElements,
  snap,
  zoom,
  stageRef,
}: {
  design: Design;
  selected: string[];
  setSelected: (ids: string[]) => void;
  updateElements: (fn: (items: StudioElement[]) => StudioElement[]) => void;
  snap: boolean;
  zoom: number;
  stageRef: React.RefObject<Konva.Stage | null>;
}) {
  const wrap = useRef<HTMLDivElement>(null);
  const transformer = useRef<Konva.Transformer>(null);
  const [fit, setFit] = useState(0.55);
  const [guides, setGuides] = useState<{ x?: number; y?: number }>({});
  const [canvasReady, setCanvasReady] = useState(false);
  useEffect(() => {
    const frame = window.requestAnimationFrame(() => setCanvasReady(true));
    return () => window.cancelAnimationFrame(frame);
  }, []);
  useEffect(() => {
    const resize = () => {
      if (wrap.current)
        setFit(
          Math.min(
            (wrap.current.clientWidth - 64) / SIZE,
            (wrap.current.clientHeight - 64) / SIZE,
          ),
        );
    };
    resize();
    const observer = new ResizeObserver(resize);
    if (wrap.current) observer.observe(wrap.current);
    return () => observer.disconnect();
  }, []);
  useEffect(() => {
    if (!canvasReady) return;
    const frame = window.requestAnimationFrame(() => {
      const stage = stageRef.current;
      const control = transformer.current;
      if (!stage || !control || !control.getLayer()) return;
      const nodes = selected
        .map((id) => stage.findOne(`#${id}`))
        .filter((node): node is Konva.Node => Boolean(node && node.getStage() === stage));
      control.nodes(nodes);
      control.getLayer()?.batchDraw();
    });
    return () => window.cancelAnimationFrame(frame);
  }, [canvasReady, selected, design.elements, stageRef]);
  const scale = zoom === 0 ? fit : zoom;
  const select = (
    event: Konva.KonvaEventObject<MouseEvent>,
    item: StudioElement,
  ) => {
    event.cancelBubble = true;
    setSelected(
      event.evt.shiftKey
        ? selected.includes(item.id)
          ? selected.filter((id) => id !== item.id)
          : [...selected, item.id]
        : [item.id],
    );
  };
  const transformEnd = (
    e: Konva.KonvaEventObject<Event>,
    item: StudioElement,
  ) => {
    const node = e.target;
    const sx = node.scaleX(),
      sy = node.scaleY();
    node.scaleX(1);
    node.scaleY(1);
    const width = Math.max(12, item.width * sx);
    const height = Math.max(12, item.height * sy);
    const widthChanged = Math.abs(width - item.width) > 1;
    const heightChanged = Math.abs(height - item.height) > 1;
    updateElements((items) =>
      items.map((i) => {
        if (i.id !== item.id) return i;
        const resized = {
          ...i,
          x: node.x(),
          y: node.y(),
          rotation: node.rotation(),
          width,
          height,
        };
        // Pulling a side handle changes only the width, so reflow the text.
        // Pulling a vertical/corner handle keeps the height the user chose.
        return resized.type === "text" && widthChanged && !heightChanged
          ? fitCanvasText(resized)
          : resized;
      }),
    );
  };
  const dragEnd = (
    e: Konva.KonvaEventObject<DragEvent>,
    item: StudioElement,
  ) => {
    let x = e.target.x(),
      y = e.target.y();
    const g: { x?: number; y?: number } = {};
    if (Math.abs(x + item.width / 2 - 540) < 10) {
      x = 540 - item.width / 2;
      g.x = 540;
    }
    if (Math.abs(y + item.height / 2 - 540) < 10) {
      y = 540 - item.height / 2;
      g.y = 540;
    }
    setGuides({});
    updateElements((items) =>
      items.map((i) =>
        i.id === item.id
          ? { ...i, x: snap ? Math.round(x) : x, y: snap ? Math.round(y) : y }
          : i,
      ),
    );
  };
  if (!canvasReady)
    return <div className="canvas-wrap"><div className="canvas-loading">Preparando lienzo…</div></div>;
  return (
    <div className="canvas-wrap" ref={wrap}>
      <div
        className="canvas-shell"
        style={{ width: SIZE * scale, height: SIZE * scale }}
      >
        <Stage
          ref={stageRef}
          width={SIZE}
          height={SIZE}
          scaleX={scale}
          scaleY={scale}
          onMouseDown={(e) => {
            if (e.target === e.target.getStage()) setSelected([]);
          }}
        >
          <Layer>
            <Rect
              width={SIZE}
              height={SIZE}
              fill={
                design.background.type === "solid"
                  ? design.background.color
                  : undefined
              }
              fillLinearGradientStartPoint={
                design.background.type === "linear" ? { x: 0, y: 0 } : undefined
              }
              fillLinearGradientEndPoint={
                design.background.type === "linear"
                  ? {
                      x:
                        SIZE *
                        Math.cos((design.background.angle * Math.PI) / 180),
                      y:
                        SIZE *
                        Math.sin((design.background.angle * Math.PI) / 180),
                    }
                  : undefined
              }
              fillLinearGradientColorStops={
                design.background.type === "linear"
                  ? [0, design.background.color, 1, design.background.colorB]
                  : undefined
              }
              fillRadialGradientStartPoint={
                design.background.type === "radial"
                  ? { x: SIZE / 2, y: SIZE / 2 }
                  : undefined
              }
              fillRadialGradientEndPoint={
                design.background.type === "radial"
                  ? { x: SIZE / 2, y: SIZE / 2 }
                  : undefined
              }
              fillRadialGradientStartRadius={
                design.background.type === "radial" ? 0 : undefined
              }
              fillRadialGradientEndRadius={
                design.background.type === "radial" ? 760 : undefined
              }
              fillRadialGradientColorStops={
                design.background.type === "radial"
                  ? [0, design.background.color, 1, design.background.colorB]
                  : undefined
              }
            />
            {design.elements.map(
              (item) =>
                item.visible && (
                  <Group
                    key={item.id}
                    id={item.id}
                    x={item.x}
                    y={item.y}
                    rotation={item.rotation}
                    opacity={item.opacity}
                    draggable={!item.locked}
                    onClick={(e) => select(e, item)}
                    onTap={(e) =>
                      select(
                        e as unknown as Konva.KonvaEventObject<MouseEvent>,
                        item,
                      )
                    }
                    onDragMove={(e) => {
                      const x = e.target.x() + item.width / 2,
                        y = e.target.y() + item.height / 2;
                      setGuides({
                        x: Math.abs(x - 540) < 10 ? 540 : undefined,
                        y: Math.abs(y - 540) < 10 ? 540 : undefined,
                      });
                    }}
                    onDragEnd={(e) => dragEnd(e, item)}
                    onTransformEnd={(e) => transformEnd(e, item)}
                  >
                    {item.type === "text" && (
                      <KText
                        text={
                          item.uppercase
                            ? (item.text || "").toUpperCase()
                            : item.text
                        }
                        width={item.width}
                        height={item.height}
                        fontSize={item.fontSize}
                        fontFamily={item.fontFamily || "Geist Mono"}
                        fontStyle={item.fontStyle}
                        fill={item.fill}
                        align={item.align}
                        lineHeight={item.lineHeight}
                        letterSpacing={item.letterSpacing}
                      />
                    )}
                    {item.type === "image" && <CanvasImage item={item} />}
                    {item.type === "rect" && (
                      <Rect
                        width={item.width}
                        height={item.height}
                        fill={
                          item.fill === "transparent" ? undefined : item.fill
                        }
                        stroke={item.stroke}
                        strokeWidth={item.strokeWidth}
                        cornerRadius={item.radius || 0}
                      />
                    )}
                    {item.type === "circle" && (
                      <KCircle
                        x={item.width / 2}
                        y={item.height / 2}
                        radius={Math.min(item.width, item.height) / 2}
                        fill={
                          item.fill === "transparent" ? undefined : item.fill
                        }
                        stroke={item.stroke}
                        strokeWidth={item.strokeWidth}
                      />
                    )}
                    {item.type === "ellipse" && (
                      <Ellipse
                        x={item.width / 2}
                        y={item.height / 2}
                        radiusX={item.width / 2}
                        radiusY={item.height / 2}
                        fill={
                          item.fill === "transparent" ? undefined : item.fill
                        }
                        stroke={item.stroke}
                        strokeWidth={item.strokeWidth}
                      />
                    )}
                    {item.type === "line" && (
                      <Line
                        points={[
                          0,
                          item.height / 2,
                          item.width,
                          item.height / 2,
                        ]}
                        stroke={item.stroke || item.fill}
                        strokeWidth={item.strokeWidth || 2}
                      />
                    )}
                    {item.type === "plus" && (
                      <Group>
                        <Line
                          points={[
                            item.width / 2,
                            0,
                            item.width / 2,
                            item.height,
                          ]}
                          stroke={item.fill}
                          strokeWidth={item.strokeWidth || 2}
                        />
                        <Line
                          points={[
                            0,
                            item.height / 2,
                            item.width,
                            item.height / 2,
                          ]}
                          stroke={item.fill}
                          strokeWidth={item.strokeWidth || 2}
                        />
                      </Group>
                    )}
                  </Group>
                ),
            )}
            <Noise effects={design.effects} />
            <PostDetails
              effects={design.effects}
              background={design.background}
            />
            {guides.x && (
              <Line
                points={[guides.x, 0, guides.x, SIZE]}
                stroke="#008BFF"
                strokeWidth={1}
                dash={[8, 6]}
                listening={false}
              />
            )}
            {guides.y && (
              <Line
                points={[0, guides.y, SIZE, guides.y]}
                stroke="#008BFF"
                strokeWidth={1}
                dash={[8, 6]}
                listening={false}
              />
            )}
            <Transformer
              ref={transformer}
              visible={selected.length > 0}
              rotateEnabled
              enabledAnchors={[
                "top-left",
                "top-center",
                "top-right",
                "middle-left",
                "middle-right",
                "bottom-left",
                "bottom-center",
                "bottom-right",
              ]}
              keepRatio={false}
              flipEnabled={false}
              borderStroke="#008BFF"
              anchorFill="#FFFFFF"
              anchorStroke="#008BFF"
              anchorSize={9}
            />
          </Layer>
        </Stage>
      </div>
    </div>
  );
}

function ColorInput({
  value,
  onChange,
  label,
}: {
  value: string;
  onChange: (v: string) => void;
  label: string;
}) {
  return (
    <label className="field color-field">
      <span>{label}</span>
      <input
        type="color"
        value={value === "transparent" ? "#FFFFFF" : value}
        onChange={(e) => onChange(e.target.value)}
      />
      <input value={value} onChange={(e) => onChange(e.target.value)} />
    </label>
  );
}
function NumberField({
  label,
  value,
  onChange,
  step = 1,
}: {
  label: string;
  value: number;
  onChange: (v: number) => void;
  step?: number;
}) {
  return (
    <label className="field">
      <span>{label}</span>
      <input
        type="number"
        step={step}
        value={Number.isFinite(value) ? value : 0}
        onChange={(e) => onChange(Number(e.target.value))}
      />
    </label>
  );
}
function BackgroundPanel({
  design,
  setDesign,
}: {
  design: Design;
  setDesign: (d: Design) => void;
}) {
  const bg = design.background;
  return (
    <>
      <h3>Fondo</h3>
      <div className="segmented">
        {(["solid", "linear", "radial"] as const).map((type) => (
          <button
            key={type}
            className={bg.type === type ? "selected" : ""}
            onClick={() =>
              setDesign({ ...design, background: { ...bg, type } })
            }
          >
            {{ solid: "Sólido", linear: "Lineal", radial: "Radial" }[type]}
          </button>
        ))}
      </div>
      <ColorInput
        label="Color principal"
        value={bg.color}
        onChange={(color) =>
          setDesign({ ...design, background: { ...bg, color } })
        }
      />
      {bg.type !== "solid" && (
        <>
          <ColorInput
            label="Color secundario"
            value={bg.colorB}
            onChange={(colorB) =>
              setDesign({ ...design, background: { ...bg, colorB } })
            }
          />
          <NumberField
            label="Ángulo"
            value={bg.angle}
            onChange={(angle) =>
              setDesign({ ...design, background: { ...bg, angle } })
            }
          />
        </>
      )}
      <div className="quick-colors">
        {COLORS.map((color) => (
          <button
            key={color}
            aria-label={color}
            style={{ backgroundColor: color }}
            onClick={() =>
              setDesign({ ...design, background: { ...bg, color } })
            }
          />
        ))}
      </div>
    </>
  );
}
function EffectsPanel({
  design,
  setDesign,
}: {
  design: Design;
  setDesign: (d: Design) => void;
}) {
  const fx = design.effects;
  const patch = (p: Partial<Effects>) =>
    setDesign({ ...design, effects: { ...fx, ...p } });
  return (
    <>
      <h3>Efectos</h3>
      <label className="toggle">
          <span>Ruido / grano</span>
        <input
          type="checkbox"
          checked={fx.noise}
          onChange={(e) => patch({ noise: e.target.checked })}
        />
      </label>
      <p className="muted">Añade textura al diseño y al PNG final.</p>
      <NumberField
          label="Cantidad de grano"
        value={fx.noiseAmount}
        onChange={(noiseAmount) => patch({ noiseAmount })}
      />
      <NumberField
          label="Opacidad del grano"
        value={fx.noiseOpacity}
        step={0.01}
        onChange={(noiseOpacity) => patch({ noiseOpacity })}
      />
      <NumberField
          label="Escala del grano"
        value={fx.noiseScale}
        step={0.5}
        onChange={(noiseScale) => patch({ noiseScale })}
      />
      <NumberField
        label="Variación"
        value={fx.seed}
        onChange={(seed) => patch({ seed })}
      />
      <div className="side-rule" />
      <h3>Detalles</h3>
      <p className="muted">Acabados visuales sutiles.</p>
      <label className="toggle">
          <span>Líneas</span>
        <input
          type="checkbox"
          checked={fx.scanlines || false}
          onChange={(e) => patch({ scanlines: e.target.checked })}
        />
      </label>
      <NumberField
          label="Opacidad"
        value={fx.scanlineOpacity || 0.08}
        step={0.01}
        onChange={(scanlineOpacity) => patch({ scanlineOpacity })}
      />
      <NumberField
          label="Espaciado"
        value={fx.scanlineSpacing || 12}
        onChange={(scanlineSpacing) => patch({ scanlineSpacing })}
      />
      <label className="toggle">
          <span>Puntos</span>
        <input
          type="checkbox"
          checked={fx.dotField || false}
          onChange={(e) => patch({ dotField: e.target.checked })}
        />
      </label>
      <NumberField
          label="Opacidad de puntos"
        value={fx.dotOpacity || 0.12}
        step={0.01}
        onChange={(dotOpacity) => patch({ dotOpacity })}
      />
      <NumberField
          label="Espaciado de puntos"
        value={fx.dotSpacing || 48}
        onChange={(dotSpacing) => patch({ dotSpacing })}
      />
      <NumberField
          label="Tamaño de puntos"
        value={fx.dotSize || 1.5}
        step={0.5}
        onChange={(dotSize) => patch({ dotSize })}
      />
      <label className="toggle">
          <span>Viñeta</span>
        <input
          type="checkbox"
          checked={fx.vignette || false}
          onChange={(e) => patch({ vignette: e.target.checked })}
        />
      </label>
      <NumberField
          label="Opacidad de viñeta"
        value={fx.vignetteOpacity || 0.16}
        step={0.01}
        onChange={(vignetteOpacity) => patch({ vignetteOpacity })}
      />
      <label className="toggle">
          <span>Marco</span>
        <input
          type="checkbox"
          checked={fx.frame || false}
          onChange={(e) => patch({ frame: e.target.checked })}
        />
      </label>
      <NumberField
          label="Margen del marco"
        value={fx.frameInset || 48}
        onChange={(frameInset) => patch({ frameInset })}
      />
      <NumberField
          label="Opacidad del marco"
        value={fx.frameOpacity || 0.28}
        step={0.01}
        onChange={(frameOpacity) => patch({ frameOpacity })}
      />
    </>
  );
}
function DocumentPanel({
  design,
  setDesign,
  snap,
  setSnap,
}: {
  design: Design;
  setDesign: (d: Design) => void;
  snap: boolean;
  setSnap: (v: boolean) => void;
}) {
  return (
    <>
      <p className="panel-kicker">DOCUMENTO</p>
      <h2>Post cuadrado</h2>
      <div className="document-size">
        1080 <span>×</span> 1080 <small>px</small>
      </div>
      <div className="side-rule" />
      <label className="toggle">
        <span>Ajustar a guías</span>
        <input
          type="checkbox"
          checked={snap}
          onChange={(e) => setSnap(e.target.checked)}
        />
      </label>
      <label className="toggle">
        <span>Grano</span>
        <input
          type="checkbox"
          checked={design.effects.noise}
          onChange={(e) =>
            setDesign({
              ...design,
              effects: { ...design.effects, noise: e.target.checked },
            })
          }
        />
      </label>
      <div className="side-rule" />
      <p className="muted">
        Selecciona un elemento para editarlo.
      </p>
    </>
  );
}
function Properties({
  item,
  update,
  deleteItem,
  duplicate,
  sendToBack,
  bringToFront,
}: {
  item: StudioElement;
  update: (p: Partial<StudioElement>) => void;
  deleteItem: () => void;
  duplicate: () => void;
  sendToBack: () => void;
  bringToFront: () => void;
}) {
  const updateText = (patch: Partial<StudioElement>) => {
    const needsFit =
      item.type === "text" &&
      ["text", "fontSize", "lineHeight", "letterSpacing", "width"].some(
        (key) => key in patch,
      );
    if (!needsFit) {
      update(patch);
      return;
    }
    const next = fitCanvasText({ ...item, ...patch } as StudioElement);
    update({
      ...patch,
      text: next.text,
      height: next.height,
      name:
        patch.text !== undefined
          ? String(patch.text).trim().slice(0, 24) || "Texto"
          : item.name,
    });
  };
  return (
    <>
      <div className="property-head">
        <div>
          <p className="panel-kicker">{elementTypeName[item.type]}</p>
          <h2>{item.name}</h2>
        </div>
        <button onClick={deleteItem}>
          <Trash2 size={17} />
        </button>
      </div>
      {item.type === "text" ? (
        <section className="property-section">
          <h3>Texto</h3>
          <label className="field">
              <span>Texto</span>
            <textarea
              value={item.text || ""}
              onChange={(e) => updateText({ text: e.target.value })}
            />
          </label>
          <label className="field">
              <span>Fuente</span>
            <select
              value={item.fontFamily}
              onChange={(e) => update({ fontFamily: e.target.value })}
            >
              {FONTS.map((font) => (
                <option key={font}>{font}</option>
              ))}
            </select>
          </label>
          <div className="field-row">
            <NumberField
                label="Tamaño"
              value={item.fontSize || 0}
              onChange={(fontSize) => updateText({ fontSize })}
            />
            <label className="field">
                <span>Peso</span>
              <select
                value={item.fontStyle || "normal"}
                onChange={(e) => update({ fontStyle: e.target.value })}
              >
                <option value="100">Fino</option>
                <option value="200">Extra fino</option>
                <option value="300">Ligero</option>
                <option value="normal">Regular</option>
                <option value="500">Medio</option>
                <option value="600">Seminegrita</option>
                <option value="bold">Negrita</option>
                <option value="800">Extra negrita</option>
                <option value="900">Negra</option>
                <option value="italic">Cursiva</option>
              </select>
            </label>
          </div>
          <div className="field-row">
            <NumberField
                label="Interlineado"
              value={item.lineHeight || 1}
              step={0.1}
              onChange={(lineHeight) => updateText({ lineHeight })}
            />
            <NumberField
                label="Espaciado"
              value={item.letterSpacing || 0}
              onChange={(letterSpacing) => updateText({ letterSpacing })}
            />
          </div>
          <div className="align-control">
            <button
              className={item.align === "left" ? "selected" : ""}
              onClick={() => update({ align: "left" })}
            >
              <AlignLeft size={17} />
            </button>
            <button
              className={item.align === "center" ? "selected" : ""}
              onClick={() => update({ align: "center" })}
            >
              <AlignCenter size={17} />
            </button>
            <button
              className={item.align === "right" ? "selected" : ""}
              onClick={() => update({ align: "right" })}
            >
              <AlignRight size={17} />
            </button>
          </div>
          <label className="toggle">
              <span>Mayúsculas</span>
            <input
              type="checkbox"
              checked={item.uppercase || false}
              onChange={(e) => update({ uppercase: e.target.checked })}
            />
          </label>
        </section>
      ) : item.type === "image" ? (
        <section className="property-section">
          <h3>Imagen</h3>
          <p className="muted">Arrastra, cambia el tamaño o reemplaza la foto.</p>
        </section>
      ) : (
        <section className="property-section">
          <h3>Apariencia</h3>
          <ColorInput
            label="Relleno"
            value={item.fill}
            onChange={(fill) => update({ fill })}
          />
          {item.type !== "plus" && (
            <ColorInput
                label="Borde"
              value={item.stroke || "#000000"}
              onChange={(stroke) => update({ stroke })}
            />
          )}
          <NumberField
              label="Grosor de borde"
            value={item.strokeWidth || 0}
            onChange={(strokeWidth) => update({ strokeWidth })}
          />
          {item.type === "rect" && (
            <NumberField
              label="Radio de esquina"
              value={item.radius || 0}
              onChange={(radius) => update({ radius })}
            />
          )}
        </section>
      )}
      <section className="property-section">
        <h3>Posición</h3>
        <div className="position-grid">
          <NumberField
            label="X"
            value={Math.round(item.x)}
            onChange={(x) => update({ x })}
          />
          <NumberField
            label="Y"
            value={Math.round(item.y)}
            onChange={(y) => update({ y })}
          />
          <NumberField
            label="W"
            value={Math.round(item.width)}
            onChange={(width) => updateText({ width})}
          />
          <NumberField
            label="H"
            value={Math.round(item.height)}
            onChange={(height) => update({ height })}
          />
          <NumberField
            label="Rotación"
            value={Math.round(item.rotation)}
            onChange={(rotation) => update({ rotation })}
          />
          <NumberField
            label="Opacidad"
            value={item.opacity}
            step={0.05}
            onChange={(opacity) => update({ opacity })}
          />
        </div>
      </section>
      <div className="property-actions">
        <button onClick={() => update({ x: 0 })}>
          <AlignLeft size={15} />
          A la izquierda
        </button>
        <button onClick={() => update({ x: (SIZE - item.width) / 2 })}>
          <AlignCenter size={15} />
          Centrar
        </button>
        <button onClick={() => update({ x: SIZE - item.width })}>
          <AlignRight size={15} />
          A la derecha
        </button>
        <button onClick={duplicate}>
          <Copy size={15} />
          Duplicar
        </button>
        <button onClick={sendToBack}>Al fondo</button>
        <button onClick={bringToFront}>Al frente</button>
      </div>
    </>
  );
}

export default function Home() {
  const [design, setDesign] = useState<Design>(() =>
    cloneTemplate(templates[0]),
  );
  const [screen, setScreen] = useState<"library" | "editor">("library");
  const [tool, setTool] = useState<Tool>("templates");
  const [selected, setSelected] = useState<string[]>([]);
  const [zoom, setZoom] = useState(0);
  const [snap, setSnap] = useState(true);
  const [saved, setSaved] = useState("Guardado");
  const [history, setHistory] = useState<Design[]>([]);
  const [future, setFuture] = useState<Design[]>([]);
  const [myDesigns, setMyDesigns] = useState<Design[]>([]);
  const [shouldPersist, setShouldPersist] = useState(false);
  const [imageMessage, setImageMessage] = useState("");
  const [ideaInput, setIdeaInput] = useState("");
  const [ideaTension, setIdeaTension] = useState<IdeaTension>("other");
  const [ideaAngle, setIdeaAngle] = useState<IdeaAngle>("reflective");
  const [ideaRoutes, setIdeaRoutes] = useState<IdeaRoute[]>([]);
  const [ideaGenerating, setIdeaGenerating] = useState(false);
  const [ideaSource, setIdeaSource] = useState<"ai" | "editorial" | null>(null);
  const [ideaError, setIdeaError] = useState("");
  const [batchTopic, setBatchTopic] = useState("");
  const [batchGenerating, setBatchGenerating] = useState(false);
  const [batchError, setBatchError] = useState("");
  const [themeIdeas, setThemeIdeas] = useState<WeeklyTheme[]>([]);
  const [themeSearching, setThemeSearching] = useState(false);
  const [usedThemeTitles, setUsedThemeTitles] = useState<string[]>([]);
  const [contentBatches, setContentBatches] = useState<ContentBatch[]>([]);
  const [carouselPreview, setCarouselPreview] = useState<CarouselPreview | null>(null);
  const [activeQueueEdit, setActiveQueueEdit] = useState<ActiveQueueEdit | null>(null);
  const [exportingBatchId, setExportingBatchId] = useState<string | null>(null);
  const [templateGeneratingId, setTemplateGeneratingId] = useState<string | null>(null);
  const [templateAiResult, setTemplateAiResult] = useState<TemplateAiResult | null>(null);
  const [templateAiError, setTemplateAiError] = useState("");
  const stageRef = useRef<Konva.Stage>(null);
  const leftContentRef = useRef<HTMLElement | null>(null);
  useEffect(() => {
    const frame = window.requestAnimationFrame(() => {
      try {
        setMyDesigns(JSON.parse(localStorage.getItem("jay-post-designs") || "[]"));
        const storedBatches = JSON.parse(localStorage.getItem("jay-content-batches") || "[]") as ContentBatch[];
        const batches = storedBatches.some((batch) => batch.id === firstEvidenceWeek.id)
          ? storedBatches
          : [firstEvidenceWeek, ...storedBatches].slice(0, 12);
        localStorage.setItem("jay-content-batches", JSON.stringify(batches));
        const rememberedThemes = JSON.parse(localStorage.getItem("jay-used-weekly-themes") || "[]") as string[];
        setContentBatches(batches);
        setUsedThemeTitles(Array.from(new Set([
          ...rememberedThemes,
          ...batches.map((batch) => batch.topic).filter(Boolean),
        ])).slice(-500));
      } catch {}
    });
    return () => window.cancelAnimationFrame(frame);
  }, []);
  const persist = useCallback((value: Design) => {
    const updated = { ...value, updatedAt: new Date().toISOString() };
    try {
      setMyDesigns((existing) => {
        const next = [
          updated,
          ...existing.filter((d) => d.id !== updated.id),
        ].slice(0, 30);
        localStorage.setItem("jay-post-designs", JSON.stringify(next));
        return next;
      });
      setSaved("Guardado");
    } catch {
      setSaved("Guardado en esta sesión");
    }
  }, []);
  useEffect(() => {
    if (screen !== "editor" || !shouldPersist) return;
    const timer = window.setTimeout(() => persist(design), 1200);
    return () => window.clearTimeout(timer);
  }, [design, persist, screen, shouldPersist]);
  const commit = (next: Design) => {
    setHistory((h) => [...h.slice(-39), design]);
    setFuture([]);
    setShouldPersist(true);
    setSaved("Guardando…");
    setDesign(next);
  };
  const updateElements = (fn: (items: StudioElement[]) => StudioElement[]) =>
    commit({ ...design, elements: fn(design.elements) });
  const add = (item: StudioElement) => {
    updateElements((items) => [...items, item]);
    setSelected([item.id]);
  };
  const addImageFile = (file: File) => {
    if (!file.type.startsWith("image/")) {
      setImageMessage("Elige un archivo de imagen.");
      return;
    }
    if (file.size > 2 * 1024 * 1024) {
      setImageMessage("Usa una foto menor de 2 MB para poder guardar el diseño.");
      return;
    }
    const reader = new FileReader();
    reader.onload = () => {
      add(postImage(String(reader.result), file.name, 120, 120, 720, 720));
      setImageMessage("Foto añadida. Selecciónala para cambiar su tamaño u orden.");
    };
    reader.readAsDataURL(file);
  };
  const selectedItem =
    selected.length === 1
      ? design.elements.find((item) => item.id === selected[0])
      : undefined;
  const syncQueueEditedText = (copy: string) => {
    if (!activeQueueEdit) return;
    setContentBatches((batches) => {
      const next = batches.map((batch) => {
        if (batch.id !== activeQueueEdit.batchId) return batch;
        return {
          ...batch,
          posts: batch.posts.map((post) => {
            if (post.id !== activeQueueEdit.postId) return post;
            if (activeQueueEdit.slideIndex !== undefined && post.slides) {
              const slides = [...post.slides];
              slides[activeQueueEdit.slideIndex] = copy;
              return { ...post, slides };
            }
            return { ...post, route: { ...post.route, copy } };
          }),
        };
      });
      try {
        localStorage.setItem("jay-content-batches", JSON.stringify(next));
      } catch {}
      return next;
    });
  };
  const updateSelected = (patch: Partial<StudioElement>) => {
    if (!selectedItem) return;
    updateElements((items) =>
      items.map((item) => {
        if (item.id !== selectedItem.id) return item;
        const updated = { ...item, ...patch };
        return patch.text !== undefined && updated.type === "text"
          ? fitTextInRegion(
              updated,
              String(patch.text),
              {
                x: updated.x,
                y: updated.y,
                width: updated.width,
                height: SIZE - updated.y - 40,
                align: updated.align || "left",
              },
              Boolean(updated.uppercase),
            )
          : updated;
      }),
    );
    if (patch.text !== undefined && activeQueueEdit?.elementId === selectedItem.id) {
      syncQueueEditedText(String(patch.text));
    }
  };
  const newFrom = (d: Design) => {
    setDesign({ ...d, name: localizedDesignName(d.name) });
    setSelected([]);
    setHistory([]);
    setFuture([]);
    setShouldPersist(false);
    setSaved("Plantilla lista");
    setScreen("editor");
  };
  const openIdeaRoute = (
    route: IdeaRoute,
    nextTool: Tool = "text",
    options: { templateId?: string; selectText?: boolean } = {},
  ) => {
    const built = buildIdeaDesign(route, options.templateId);
    if (!built) return;
    newFrom(built.design);
    if (!options.selectText) setActiveQueueEdit(null);
    if (options.selectText && built.primaryId) setSelected([built.primaryId]);
    if (nextTool !== "queue") setCarouselPreview(null);
    setTool(nextTool);
    return built.primaryId;
  };
  const openCarouselSlide = (post: QueuePost, index: number, selectText = false) => {
    const slides = post.slides || [];
    if (!slides[index]) return;
    setCarouselPreview({ post, index });
    window.requestAnimationFrame(() => leftContentRef.current?.scrollTo({ top: 0, behavior: "smooth" }));
    return openIdeaRoute(
      {
        id: `${post.id}-slide-${index}`,
        title: `${post.route.title} · ${index + 1}/${slides.length}`,
        label: `Carrusel · lámina ${index + 1}`,
        templateId: post.route.templateId || "jay-quiet-ink",
        copy: slides[index],
        effectVariant: post.route.effectVariant,
      },
      "queue",
      { selectText },
    );
  };
  const openQueuePost = (post: QueuePost) => {
    if (post.slides?.length) {
      openCarouselSlide(post, 0);
      return;
    }
    setCarouselPreview(null);
    openIdeaRoute(post.route, "queue");
  };
  const createFromTemplate = async (template: Template) => {
    const builtIn = lockedReferenceTemplates.has(template.id);
    newFrom(cloneTemplate(template));
    setTool("templates");
    setTemplateAiResult(null);
    setTemplateAiError("");
    if (!builtIn || templateGeneratingId) {
      if (!builtIn) setSaved("Plantilla abierta. La IA automática está disponible en las plantillas JAY.");
      return;
    }
    setTemplateGeneratingId(template.id);
    setSaved("La IA está escribiendo para este espacio…");
    try {
      let recent: string[] = [];
      try {
        const stored = JSON.parse(localStorage.getItem("jay-template-ai-copies") || "[]");
        if (Array.isArray(stored)) recent = stored.filter((item): item is string => typeof item === "string");
      } catch { /* Start a clean local history if old data is damaged. */ }
      const response = await fetch("/api/template-copy", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ templateId: template.id, exclude: recent.slice(-80) }),
      });
      const result = (await response.json().catch(() => null)) as {
        error?: string;
        title?: string;
        copy?: string;
        caption?: string;
        counterpoint?: string;
        segments?: string[];
      } | null;
      if (!response.ok || !result?.copy || !result.title || !result.caption) {
        throw new Error(result?.error || "No se pudo generar el texto.");
      }
      const route: IdeaRoute = {
        id: `template-ai-${uid()}`,
        title: result.title,
        label: `${templateName(template)} · IA JAY`,
        templateId: template.id,
        copy: result.copy,
        ...(result.counterpoint ? { counterpoint: result.counterpoint } : {}),
        ...(result.segments?.length ? { segments: result.segments } : {}),
        effectVariant: stableNumber(`${template.id}-${result.title}-${result.copy}`),
      };
      const generated = buildIdeaDesign(route, template.id);
      if (!generated) throw new Error("La plantilla no pudo preparar el texto.");
      newFrom(generated.design);
      setTool("templates");
      setTemplateAiResult({ templateId: template.id, title: result.title, copy: result.copy, caption: result.caption });
      const nextRecent = [...recent, result.copy].slice(-120);
      localStorage.setItem("jay-template-ai-copies", JSON.stringify(nextRecent));
      setSaved("Texto JAY generado y ajustado.");
    } catch (error) {
      const message = error instanceof Error ? error.message : "No se pudo generar el texto.";
      setTemplateAiError(message);
      setSaved("La plantilla quedó abierta sin cambiar su texto.");
    } finally {
      setTemplateGeneratingId(null);
    }
  };
  const createIdeaDirections = async () => {
    const idea = cleanIdea(ideaInput);
    if (!idea || ideaGenerating) return;
    setIdeaError("");
    setIdeaGenerating(true);
    try {
      const response = await fetch("/api/ideas", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ idea, tension: ideaTension, angle: ideaAngle }),
      });
      if (!response.ok) {
        const failure = (await response.json().catch(() => null)) as { error?: string } | null;
        throw new Error(failure?.error || "No se pudieron crear direcciones.");
      }
      const result = (await response.json()) as {
        routes?: IdeaRoute[];
        source?: "ai" | "editorial";
      };
      if (!result.routes?.length) throw new Error("No directions returned");
      setIdeaRoutes(result.routes);
      setIdeaSource(result.source || "editorial");
    } catch (error) {
      setIdeaRoutes([]);
      setIdeaSource(null);
      setIdeaError(error instanceof Error ? error.message : "Claude no pudo crear direcciones JAY.");
    } finally {
      setIdeaGenerating(false);
    }
  };
  const updateContentBatches = (change: (batches: ContentBatch[]) => ContentBatch[]) => {
    setContentBatches((existing) => {
      const next = change(existing);
      localStorage.setItem("jay-content-batches", JSON.stringify(next));
      return next;
    });
  };
  const rememberThemes = (titles: string[]) => {
    setUsedThemeTitles((current) => {
      const next = Array.from(new Set([...current, ...titles.filter(Boolean)])).slice(-500);
      localStorage.setItem("jay-used-weekly-themes", JSON.stringify(next));
      return next;
    });
  };
  const findWeeklyThemes = async () => {
    if (themeSearching) return;
    setBatchError("");
    setThemeSearching(true);
    try {
      const response = await fetch("/api/week", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          mode: "themes",
          seed: cleanIdea(batchTopic),
          exclude: Array.from(new Set([
            ...usedThemeTitles,
            ...themeIdeas.map((theme) => theme.title),
          ])).slice(-500),
        }),
      });
      if (!response.ok) {
        const failure = (await response.json().catch(() => null)) as { error?: string } | null;
        throw new Error(failure?.error || "No se pudieron crear temas JAY.");
      }
      const result = (await response.json()) as { themes?: WeeklyTheme[] };
      const fresh = (result.themes || []).filter(
        (theme) => !usedThemeTitles.includes(theme.title),
      );
      setThemeIdeas(fresh);
    } catch (error) {
      setThemeIdeas([]);
      setBatchError(error instanceof Error ? error.message : "Claude no pudo crear temas JAY.");
    } finally {
      setThemeSearching(false);
    }
  };
  const createWeeklyBatch = async (selectedTheme?: WeeklyTheme) => {
    const topic = selectedTheme?.thesis || cleanIdea(batchTopic);
    const requestedTitle = selectedTheme?.title || cleanIdea(batchTopic);
    const tension = selectedTheme?.tension || "other";
    if (!topic || batchGenerating) return;
    if (requestedTitle && usedThemeTitles.includes(requestedTitle)) {
      setSaved("Ese tema ya está creado. Pide nuevos Temas JAY.");
      return;
    }
    setBatchError("");
    setBatchGenerating(true);
    try {
      const response = await fetch("/api/week", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          mode: "week",
          title: requestedTitle,
          topic,
          tension,
        }),
      });
      if (!response.ok) {
        const failure = (await response.json().catch(() => null)) as { error?: string } | null;
        throw new Error(failure?.error || "No se pudo crear la semana.");
      }
      const result = (await response.json()) as {
        source?: "ai" | "editorial";
        week?: {
          title: string;
          thesis?: string;
          arc?: string;
          posts: Array<{
            day: string;
            role: string;
            objective: BrandObjective;
            format: BrandFormat;
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
          }>;
        };
      };
      if (!result.week?.posts?.length) throw new Error("No weekly posts returned");
      const batch: ContentBatch = {
        id: uid(),
        topic: result.week.title,
        thesis: result.week.thesis || topic,
        arc: result.week.arc,
        createdAt: new Date().toISOString(),
        source: result.source || "editorial",
        schemaVersion: 7,
        posts: result.week.posts.map((post) => ({
          id: uid(),
          route: {
            id: uid(),
            title: post.title,
            label: post.label,
            templateId: post.templateId,
            copy: post.copy,
            ...(post.counterpoint ? { counterpoint: post.counterpoint } : {}),
            ...(post.uppercase ? { uppercase: true } : {}),
          },
          plan: {
            day: post.day,
            role: post.role,
            objective: post.objective,
            format: post.format,
            pillar: post.pillar,
            successMetric: post.successMetric,
          },
          caption: post.caption,
          ...(post.slides?.length ? { slides: post.slides } : {}),
          status: "review" as QueueStatus,
        })),
      };
      updateContentBatches((batches) => [batch, ...batches].slice(0, 12));
      rememberThemes([batch.topic]);
      setBatchTopic("");
      setThemeIdeas([]);
    } catch (error) {
      setBatchError(error instanceof Error ? error.message : "Claude no completó la semana. No se guardó contenido de relleno.");
    } finally {
      setBatchGenerating(false);
    }
  };
  const setQueuePostStatus = (batchId: string, postId: string, status: QueueStatus) => {
    updateContentBatches((batches) =>
      batches.map((batch) =>
        batch.id === batchId
          ? {
              ...batch,
              posts: batch.posts.map((post) =>
                post.id === postId ? { ...post, status } : post,
              ),
            }
          : batch,
      ),
    );
  };
  const updateQueuePost = (
    batchId: string,
    postId: string,
    patch: Partial<QueuePost>,
  ) => {
    updateContentBatches((batches) =>
      batches.map((batch) =>
        batch.id === batchId
          ? {
              ...batch,
              posts: batch.posts.map((post) =>
                post.id === postId
                  ? { ...post, ...patch }
                  : post,
              ),
            }
          : batch,
      ),
    );
  };
  const changeQueuePostDesign = (batchId: string, post: QueuePost) => {
    setActiveQueueEdit(null);
    const format = post.plan?.format || (post.slides?.length ? "carousel" : "text art");
    const pool = compatibleTemplates[format];
    const currentIndex = Math.max(0, pool.indexOf(post.route.templateId));
    const templateId = pool[(currentIndex + 1) % pool.length];
    const updatedPost: QueuePost = {
      ...post,
      route: {
        ...post.route,
        templateId,
        effectVariant: (post.route.effectVariant ?? stableNumber(post.id)) + 1,
      },
    };
    updateQueuePost(batchId, post.id, { route: updatedPost.route });
    if (updatedPost.slides?.length) {
      const currentSlide = carouselPreview?.post.id === post.id ? carouselPreview.index : 0;
      openCarouselSlide(updatedPost, currentSlide);
    } else {
      setCarouselPreview(null);
      openIdeaRoute(updatedPost.route, "queue");
    }
    setSaved("Nueva composición. Texto intacto y ajustado.");
  };
  const editQueuePostText = (post: QueuePost) => {
    const batchId = batchIdForPost(post.id);
    if (!batchId) return;
    if (post.slides?.length) {
      const currentSlide = carouselPreview?.post.id === post.id ? carouselPreview.index : 0;
      const elementId = openCarouselSlide(post, currentSlide, true);
      if (elementId) setActiveQueueEdit({ batchId, postId: post.id, slideIndex: currentSlide, elementId });
    } else {
      setCarouselPreview(null);
      const elementId = openIdeaRoute(post.route, "text", { selectText: true });
      if (elementId) setActiveQueueEdit({ batchId, postId: post.id, elementId });
    }
    setSaved("Texto listo para editar.");
  };
  const batchIdForPost = (postId: string) =>
    contentBatches.find((batch) => batch.posts.some((post) => post.id === postId))?.id;
  const approveBatch = (batchId: string) => {
    updateContentBatches((batches) =>
      batches.map((batch) =>
        batch.id === batchId
          ? {
              ...batch,
              posts: batch.posts.map((post) =>
                post.status === "discarded"
                  ? post
                  : { ...post, status: "approved" },
              ),
            }
          : batch,
      ),
    );
  };
  const undo = () => {
    const previous = history.at(-1);
    if (!previous) return;
    setFuture((f) => [design, ...f]);
    setHistory((h) => h.slice(0, -1));
    setDesign(previous);
  };
  const redo = () => {
    const next = future[0];
    if (!next) return;
    setHistory((h) => [...h, design]);
    setFuture((f) => f.slice(1));
    setDesign(next);
  };
  const safeFileName = (value: string) => value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 64) || "jay-post";
  const waitForCanvas = () => new Promise<void>((resolve) => {
    window.requestAnimationFrame(() => window.requestAnimationFrame(() => window.requestAnimationFrame(() => resolve())));
  });
  const stagePng = () => {
    const stage = stageRef.current;
    if (!stage) return "";
    const previousScale = { x: stage.scaleX(), y: stage.scaleY() };
    stage.scale({ x: 1, y: 1 });
    stage.batchDraw();
    const data = stage.toDataURL({ pixelRatio: 1, mimeType: "image/png" });
    stage.scale(previousScale);
    stage.batchDraw();
    return data;
  };
  const downloadBlob = (blob: Blob, name: string) => {
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement("a");
    anchor.download = name;
    anchor.href = url;
    anchor.click();
    window.setTimeout(() => URL.revokeObjectURL(url), 1000);
  };
  const exportPng = async () => {
    if (!stageRef.current) return;
    setSelected([]);
    await waitForCanvas();
    const data = stagePng();
    if (!data) return;
    const anchor = document.createElement("a");
    anchor.download = `${safeFileName(design.name)}.png`;
    anchor.href = data;
    anchor.click();
  };
  const exportWeek = async (batch: ContentBatch) => {
    if (!stageRef.current || exportingBatchId) return;
    setExportingBatchId(batch.id);
    const previousDesign = design;
    const previousSelected = selected;
    const exportItems = batch.posts.flatMap((post, postIndex) => {
      const day = post.plan?.day || `post-${postIndex + 1}`;
      if (post.slides?.length) {
        return post.slides.map((copy, slideIndex) => ({
          name: `${String(postIndex + 1).padStart(2, "0")}-${safeFileName(day)}-${safeFileName(post.route.title)}-lamina-${String(slideIndex + 1).padStart(2, "0")}`,
          route: {
            ...post.route,
            id: `${post.id}-export-slide-${slideIndex}`,
            title: `${post.route.title} · ${slideIndex + 1}/${post.slides!.length}`,
            copy,
          },
        }));
      }
      return [{
        name: `${String(postIndex + 1).padStart(2, "0")}-${safeFileName(day)}-${safeFileName(post.route.title)}`,
        route: post.route,
      }];
    });
    try {
      const JSZip = (await import("jszip")).default;
      const zip = new JSZip();
      const imageFolder = zip.folder("imagenes");
      setSelected([]);
      for (let index = 0; index < exportItems.length; index += 1) {
        const item = exportItems[index];
        const built = buildIdeaDesign(item.route);
        if (!built) continue;
        setSaved(`Exportando ${index + 1} de ${exportItems.length}…`);
        setDesign(built.design);
        await waitForCanvas();
        const data = stagePng();
        if (data) imageFolder?.file(`${item.name}.png`, data.split(",")[1], { base64: true });
      }
      const captions = batch.posts.map((post, index) => [
        `${index + 1}. ${post.plan?.day || "POST"} — ${post.route.title}`,
        post.plan?.publishAt ? `Publicar: ${post.plan.publishAt}` : "",
        `Texto en diseño: ${post.route.copy}`,
        post.slides?.length ? `Carrusel:\n${post.slides.map((slide, slideIndex) => `${slideIndex + 1}. ${slide}`).join("\n")}` : "",
        `Caption:\n${post.caption || ""}`,
      ].filter(Boolean).join("\n")).join("\n\n--------------------\n\n");
      zip.file("captions-y-plan.txt", `${batch.topic}\n\n${batch.thesis || ""}\n\n${captions}`);
      const blob = await zip.generateAsync({ type: "blob", compression: "DEFLATE", compressionOptions: { level: 6 } });
      downloadBlob(blob, `${safeFileName(batch.topic)}-semana-completa.zip`);
      setSaved(`${exportItems.length} imágenes y captions exportados.`);
    } catch {
      setSaved("No se pudo exportar. Intenta otra vez.");
    } finally {
      setDesign(previousDesign);
      setSelected(previousSelected);
      setExportingBatchId(null);
    }
  };
  useEffect(() => {
    const key = (event: KeyboardEvent) => {
      const mod = event.metaKey || event.ctrlKey;
      if (
        (event.key === "Backspace" || event.key === "Delete") &&
        selected.length
      ) {
        event.preventDefault();
        updateElements((items) =>
          items.filter((i) => !selected.includes(i.id)),
        );
        setSelected([]);
      }
      if (mod && event.key.toLowerCase() === "z") {
        event.preventDefault();
        if (event.shiftKey) redo();
        else undo();
      }
      if (mod && event.key.toLowerCase() === "d" && selectedItem) {
        event.preventDefault();
        add({
          ...selectedItem,
          id: uid(),
          x: selectedItem.x + 30,
          y: selectedItem.y + 30,
          name: `${selectedItem.name} copia`,
        });
      }
      if (event.key === "Escape") setSelected([]);
      if (
        ["ArrowLeft", "ArrowRight", "ArrowUp", "ArrowDown"].includes(
          event.key,
        ) &&
        selected.length
      ) {
        event.preventDefault();
        const n = event.shiftKey ? 10 : 1,
          dx =
            event.key === "ArrowLeft" ? -n : event.key === "ArrowRight" ? n : 0,
          dy = event.key === "ArrowUp" ? -n : event.key === "ArrowDown" ? n : 0;
        updateElements((items) =>
          items.map((i) =>
            selected.includes(i.id) ? { ...i, x: i.x + dx, y: i.y + dy } : i,
          ),
        );
      }
    };
    window.addEventListener("keydown", key);
    return () => window.removeEventListener("keydown", key);
  });
  const templateList = referenceTemplateIds
    .map((id) => templates.find((template) => template.id === id))
    .filter((template): template is Template => Boolean(template));
  if (screen === "library")
    return (
      <main className="library">
        <header className="library-head">
          <div className="wordmark">
            JAY <span>POST STUDIO</span>
          </div>
          <button className="primary" onClick={() => newFrom(emptyDesign())}>
            <Plus size={16} />
            Nuevo diseño
          </button>
        </header>
        <section className="library-hero">
          <p>
            MIS DISEÑOS <em>{myDesigns.length.toString().padStart(2, "0")}</em>
          </p>
          <h1>
            Haz espacio
            <br />
            para la idea.
          </h1>
          <button
            onClick={() => {
              setTool("templates");
              newFrom(emptyDesign());
            }}
          >
            Elegir una plantilla <Sparkles size={16} />
          </button>
        </section>
        <section className={myDesigns.length ? "design-grid" : "design-empty"}>
          {myDesigns.length ? (
            myDesigns.map((item) => (
              <button
                className="design-card"
                key={item.id}
                onClick={() => newFrom(item)}
              >
                <DesignPreview design={item} />
                <strong>{templateName(item)}</strong>
                <small>1080 × 1080</small>
              </button>
            ))
          ) : (
            <div className="empty-card">
              <Grid2X2 size={26} />
              <p>Aquí estarán tus posts guardados.</p>
            </div>
          )}
        </section>
        <section className="template-library">
          <div className="template-library-head">
            <div>
              <p>PLANTILLAS / {templateList.length.toString().padStart(2, "0")} SISTEMAS</p>
              <h2>Elige una composición.</h2>
            </div>
            <button
              className="view-library"
              onClick={() => {
                setTool("templates");
                newFrom(emptyDesign());
              }}
            >
              Ver plantillas <Plus size={15} />
            </button>
          </div>
          <div className="template-row">
            {templateList.slice(0, 6).map((template) => (
              <button
                key={template.id}
                className="template-card"
                disabled={Boolean(templateGeneratingId)}
                onClick={() => createFromTemplate(template)}
              >
                <MiniPreview template={template} />
                <span>{templateName(template)}</span>
                <small>{template.subtitle}</small>
              </button>
            ))}
          </div>
        </section>
      </main>
    );
  return (
    <main className="studio">
      <header className="topbar">
        <button className="wordmark" onClick={() => setScreen("library")}>
          JAY <span>POST STUDIO</span>
        </button>
        <label className="design-name">
          <input
            value={design.name}
            onChange={(e) => {
              setShouldPersist(true);
              setDesign({ ...design, name: e.target.value });
            }}
          />
          <small>{saved}</small>
        </label>
        <div className="top-actions">
          <button title="Deshacer" onClick={undo} disabled={!history.length}>
            <Undo2 size={17} />
          </button>
          <button title="Rehacer" onClick={redo} disabled={!future.length}>
            <Redo2 size={17} />
          </button>
          <button onClick={() => newFrom(emptyDesign())}>
            <FilePlus2 size={16} />
            Nuevo
          </button>
          <button
            onClick={() => {
              setShouldPersist(true);
              persist(design);
            }}
          >
            <Save size={16} />
            Guardar
          </button>
          <button
            onClick={() =>
              newFrom({ ...design, id: uid(), name: `${design.name} copia` })
            }
          >
            <Copy size={16} />
            Duplicar
          </button>
          <button className="export" onClick={exportPng}>
            <Download size={16} />
            Exportar PNG
          </button>
        </div>
      </header>
      <div className="workspace">
        <aside className="leftbar">
          <nav>
            {(
              [
                { id: "templates", icon: Grid2X2, label: "Plantillas" },
                { id: "text", icon: Type, label: "Texto" },
                { id: "shapes", icon: Shapes, label: "Formas" },
                { id: "images", icon: ImagePlus, label: "Imágenes" },
                { id: "background", icon: Palette, label: "Fondo" },
                { id: "effects", icon: Sparkles, label: "Efectos" },
                { id: "layers", icon: Layers3, label: "Capas" },
              ] as { id: Tool; icon: typeof Type; label: string }[]
            ).map(({ id, icon: Icon, label }) => (
              <button
                key={id}
                className={tool === id ? "active" : ""}
                onClick={() => setTool(id)}
              >
                <Icon size={19} />
                <span>{label}</span>
              </button>
            ))}
          </nav>
          <section className="left-content" ref={leftContentRef}>
            {tool === "templates" && (
              <>
                <h3>Plantillas</h3>
                <p className="muted">Elige una. La IA escribe y ajusta el texto.</p>
                {templateGeneratingId && (
                  <div className="template-ai-status" role="status">
                    <Sparkles size={14} />
                    <span>Creando una idea JAY para esta plantilla…</span>
                  </div>
                )}
                {templateAiError && <p className="batch-error" role="alert">{templateAiError}</p>}
                {templateAiResult && !templateGeneratingId && (
                  <article className="template-ai-result">
                    <p className="idea-kicker">Texto listo</p>
                    <strong>{templateAiResult.title}</strong>
                    <p>{templateAiResult.copy}</p>
                    <label>
                      <span>Caption</span>
                      <textarea readOnly value={templateAiResult.caption} />
                    </label>
                    <div className="template-ai-result-actions">
                      <button
                        onClick={() => {
                          const template = templateList.find((item) => item.id === templateAiResult.templateId);
                          if (template) createFromTemplate(template);
                        }}
                      >
                        <Sparkles size={12} /> Probar otro texto
                      </button>
                      <button
                        onClick={() => {
                          navigator.clipboard.writeText(templateAiResult.caption)
                            .then(() => setSaved("Caption copiado."))
                            .catch(() => setSaved("Selecciona el caption para copiarlo."));
                        }}
                      >
                        <Copy size={12} /> Copiar caption
                      </button>
                    </div>
                  </article>
                )}
                <div className="template-grid">
                  {templateList.map((template) => (
                    <button
                      key={template.id}
                      disabled={Boolean(templateGeneratingId)}
                      onClick={() => createFromTemplate(template)}
                    >
                      <MiniPreview template={template} />
                      <span>{templateName(template)}</span>
                    </button>
                  ))}
                </div>
              </>
            )}
            {tool === "ideas" && (
              <>
                <h3>Desde una idea</h3>
                <p className="muted">Escribe una idea. Te damos cuatro direcciones.</p>
                <label className="field">
                  <span>Tu idea</span>
                  <textarea
                    className="idea-input"
                    value={ideaInput}
                    placeholder="Gano más dinero, pero tengo menos tiempo."
                    onChange={(event) => setIdeaInput(event.target.value)}
                  />
                </label>
                <label className="field">
                  <span>Tensión</span>
                  <select
                    value={ideaTension}
                    onChange={(event) => setIdeaTension(event.target.value as IdeaTension)}
                  >
                    <option value="time">Tiempo</option>
                    <option value="freedom">Libertad</option>
                    <option value="limits">Límites</option>
                    <option value="money">Dinero</option>
                    <option value="identity">Identidad</option>
                    <option value="routine">Rutina</option>
                    <option value="other">Otra</option>
                  </select>
                </label>
                <label className="field">
                  <span>Tono</span>
                  <select
                    value={ideaAngle}
                    onChange={(event) => setIdeaAngle(event.target.value as IdeaAngle)}
                  >
                    <option value="reflective">Reflexivo</option>
                    <option value="direct">Directo</option>
                    <option value="contrarian">Contrario</option>
                  </select>
                </label>
                <button
                  className="idea-generate"
                  disabled={!cleanIdea(ideaInput) || ideaGenerating}
                  onClick={createIdeaDirections}
                >
                  <Sparkles size={15} />
                  {ideaGenerating ? "Buscando ángulos..." : "Crear direcciones"}
                </button>
                {ideaError && <p className="batch-error" role="alert">{ideaError}</p>}
                {ideaRoutes.length > 0 && (
                  <div className="idea-routes">
                    <p className="idea-source">
                      {ideaSource === "ai" ? "IA + edición JAY" : "Motor editorial JAY"}
                    </p>
                    {ideaRoutes.map((route) => (
                      <article className="idea-route" key={route.id}>
                        <p className="idea-kicker">{localizedRouteLabel(route.label)}</p>
                        <h4>{route.title}</h4>
                        <p className="idea-copy">{route.copy}</p>
                        <button onClick={() => openIdeaRoute(route)}>
                          Abrir dirección <Plus size={13} />
                        </button>
                      </article>
                    ))}
                  </div>
                )}
              </>
            )}
            {tool === "queue" && (
              <>
                <h3>Semana editorial</h3>
                <p className="muted">Un tema común. Cinco posts independientes.</p>
                {carouselPreview?.post.slides?.length ? (
                  <section className="carousel-browser" aria-label="Visor de carrusel">
                    <header>
                      <div>
                        <p className="idea-kicker">Carrusel</p>
                        <h4>Lámina {carouselPreview.index + 1} de {carouselPreview.post.slides.length}</h4>
                      </div>
                      <button onClick={() => setCarouselPreview(null)}>Cerrar</button>
                    </header>
                    <p>{carouselPreview.post.slides[carouselPreview.index]}</p>
                    <div className="carousel-edit-actions">
                      <button
                        onClick={() => {
                          const batchId = batchIdForPost(carouselPreview.post.id);
                          if (batchId) changeQueuePostDesign(batchId, carouselPreview.post);
                        }}
                      >
                        <Palette size={11} /> Cambiar diseño
                      </button>
                      <button onClick={() => editQueuePostText(carouselPreview.post)}>
                        <Type size={11} /> Editar esta lámina
                      </button>
                    </div>
                    <div className="carousel-slide-picker">
                      {carouselPreview.post.slides.map((_, index) => (
                        <button
                          key={`${carouselPreview.post.id}-picker-${index}`}
                          className={index === carouselPreview.index ? "selected" : ""}
                          onClick={() => openCarouselSlide(carouselPreview.post, index)}
                        >
                          {index + 1}
                        </button>
                      ))}
                    </div>
                    <div className="carousel-step-actions">
                      <button
                        disabled={carouselPreview.index === 0}
                        onClick={() => openCarouselSlide(carouselPreview.post, carouselPreview.index - 1)}
                      >
                        ← Anterior
                      </button>
                      <button
                        disabled={carouselPreview.index === carouselPreview.post.slides.length - 1}
                        onClick={() => openCarouselSlide(carouselPreview.post, carouselPreview.index + 1)}
                      >
                        Siguiente →
                      </button>
                    </div>
                  </section>
                ) : null}
                <section className="brand-compass" aria-label="Estrategia de marca personal">
                  <p className="idea-kicker">RUMBO · @jaywrkr</p>
                  <h4>Ideas precisas sobre lo que haces, toleras y decides cuando nadie mira.</h4>
                <div className="brand-flow" aria-label="Cinco ángulos del mismo tema">
                  <span>Observar</span><i>·</i><span>Contrastar</span><i>·</i><span>Presionar</span><i>·</i><span>Aterrizar</span><i>·</i><span>Decidir</span>
                  </div>
                  <div className="brand-baseline">
                    <span><b>67</b> posts analizados</span>
                    <span><b>250K</b> vistas récord</span>
                    <span><b>263</b> seguidores ganados</span>
                  </div>
                </section>
                <label className="field">
                  <span>Una idea para esta semana (opcional)</span>
                  <textarea
                    className="idea-input"
                    value={batchTopic}
                    placeholder="Ej.: la diferencia entre tener una vida ocupada y una vida elegida."
                    onChange={(event) => setBatchTopic(event.target.value)}
                  />
                </label>
                <div className="weekly-theme-actions">
                  <button
                    className="idea-generate secondary"
                    disabled={themeSearching || batchGenerating}
                    onClick={findWeeklyThemes}
                  >
                    <Sparkles size={15} />
                    {themeSearching ? "Pensando..." : "Temas JAY"}
                  </button>
                  <button
                    className="idea-generate"
                    disabled={!cleanIdea(batchTopic) || batchGenerating}
                    onClick={() => createWeeklyBatch()}
                  >
                    <Sparkles size={15} />
                    {batchGenerating ? "Creando..." : "Crear semana"}
                  </button>
                </div>
                <p className="queue-note">Elige un tema. Los cinco posts quedan listos.</p>
                {batchError && <p className="batch-error" role="alert">{batchError}</p>}
                {themeIdeas.length > 0 && (
                  <section className="weekly-themes" aria-label="Temas sugeridos por IA">
                    <p className="idea-kicker">Temas posibles para la semana</p>
                    {themeIdeas.map((theme) => (
                      <article className="weekly-theme" key={theme.id}>
                        <div>
                          <h4>{theme.title}</h4>
                          {theme.thesis !== theme.title && <p>{theme.thesis}</p>}
                        </div>
                        <button disabled={batchGenerating} onClick={() => createWeeklyBatch(theme)}>
                          Construir esta semana <Plus size={12} />
                        </button>
                      </article>
                    ))}
                  </section>
                )}
                {contentBatches.filter((batch) => batch.schemaVersion === 7).map((batch) => {
                  const approved = batch.posts.filter((post) => post.status === "approved").length;
                  return (
                    <section className="content-batch" key={batch.id}>
                      <header>
                        <div>
                          <p className="idea-kicker">
                            {batch.source === "ai" ? "Semana con IA" : "Semana JAY"}
                          </p>
                          <h4>{batch.topic}</h4>
                        </div>
                        <div className="batch-header-actions">
                          <button
                            className="queue-export-week"
                            disabled={Boolean(exportingBatchId)}
                            onClick={() => exportWeek(batch)}
                          >
                            <Download size={12} />
                            {exportingBatchId === batch.id ? "Exportando…" : "Exportar semana"}
                          </button>
                          <button className="queue-approve-all" onClick={() => approveBatch(batch.id)}>
                            Aprobar todo
                          </button>
                        </div>
                      </header>
                      {batch.thesis && <p className="batch-thesis">{batch.thesis}</p>}
                      {batch.arc && <p className="batch-arc">{batch.arc}</p>}
                      <p className="queue-count">{approved} aprobados · {batch.posts.length} posts</p>
                      {(
                        <section className="weekly-plan" aria-label={`Plan completo: ${batch.topic}`}>
                          <p className="idea-kicker">Plan completo</p>
                          <div className="weekly-plan-grid">
                            {batch.posts.map((post, index) => {
                              const plan = post.plan || brandWeekPlan[index % brandWeekPlan.length];
                              return (
                                <button
                                  className={`weekly-plan-card ${post.status}`}
                                  key={`${post.id}-plan`}
                                  onClick={() => openQueuePost(post)}
                                >
                                  <span>{plan.day} · {plan.role || "Post"}{plan.publishAt ? ` · ${plan.publishAt.split(" · ").at(-1)}` : ""}</span>
                                  <strong>{post.route.title}</strong>
                                  <small>{brandFormatCopy[plan.format]} · {templateNameFromId(post.route.templateId)}</small>
                                </button>
                              );
                            })}
                          </div>
                        </section>
                      )}
                      <div className="queue-posts">
                        {batch.posts.map((post, index) => {
                          const plan = post.plan || brandWeekPlan[index % brandWeekPlan.length];
                          const objective = brandObjectiveCopy[plan.objective];
                          return (
                            <article className={`queue-post ${post.status}`} key={post.id}>
                              <div className="queue-post-head">
                                <p className="idea-kicker">{plan.day} · {plan.role || post.route.title}</p>
                                <span className={`brand-objective ${plan.objective}`}>{objective.label}</span>
                              </div>
                              <p className="queue-copy">{post.route.copy}</p>
                              <div className="queue-meta">
                                <span>{brandFormatCopy[plan.format]}</span><span>{templateNameFromId(post.route.templateId)}</span><span>{plan.pillar}</span><span>{plan.successMetric}</span>{plan.publishAt && <span>{plan.publishAt}</span>}
                              </div>
                              <p className="queue-intent"><b>{objective.description}</b></p>
                              {post.slides?.length ? (
                                <ol className="queue-slides" aria-label="Guion del carrusel">
                                  {post.slides.map((slide, slideIndex) => <li key={`${post.id}-slide-${slideIndex}`}>{slide}</li>)}
                                </ol>
                              ) : null}
                              <label className="queue-caption">
                                <span>Texto para publicar</span>
                                <textarea
                                  value={post.caption || ""}
                                  placeholder="El texto del post aparecerá aquí."
                                  onChange={(event) => updateQueuePost(batch.id, post.id, { caption: event.target.value })}
                                />
                              </label>
                              <div className="queue-actions">
                                <button onClick={() => post.slides?.length ? openCarouselSlide(post, 0) : openIdeaRoute(post.route)}>
                                  {post.slides?.length ? `Ver carrusel · ${post.slides.length} láminas` : "Abrir diseño"}
                                </button>
                                <button onClick={() => changeQueuePostDesign(batch.id, post)}>
                                  <Palette size={11} /> Cambiar diseño
                                </button>
                                <button onClick={() => editQueuePostText(post)}>
                                  <Type size={11} /> Editar texto
                                </button>
                                <button
                                  className={post.status === "approved" ? "selected" : ""}
                                  onClick={() => setQueuePostStatus(batch.id, post.id, "approved")}
                                >
                                  <Check size={12} /> Aprobar
                                </button>
                                <button
                                  className={post.status === "discarded" ? "selected" : ""}
                                  onClick={() => setQueuePostStatus(batch.id, post.id, "discarded")}
                                >
                                  <Trash2 size={12} /> Omitir
                                </button>
                              </div>
                            </article>
                          );
                        })}
                      </div>
                    </section>
                  );
                })}
                {contentBatches.some((batch) => batch.schemaVersion !== 7) && (
                  <p className="batch-legacy">Los borradores del sistema anterior siguen guardados, pero ya no se mezclan con tus semanas nuevas.</p>
                )}
              </>
            )}
            {tool === "text" && (
              <>
                <h3>Texto</h3>
                <div className="add-list">
                  <button onClick={() => add(text("TÍTULO", 160, 300, 64))}>
                    <Type />
                    Añadir título
                  </button>
                  <button
                    onClick={() =>
                      add(text("Escribe aquí el texto.", 160, 300, 30))
                    }
                  >
                    <Type />
                    Añadir texto
                  </button>
                  <button
                    onClick={() => add(text("ETIQUETA", 160, 300, 18))}
                  >
                    <Type />
                    Añadir etiqueta
                  </button>
                  <button
                    onClick={() =>
                      add(text("UNA FRASE\nCON INTENCIÓN.", 160, 300, 42))
                    }
                  >
                    <Type />
                    Añadir frase
                  </button>
                </div>
                <button
                  className="brand-button"
                  onClick={() =>
                    updateElements((items) => [
                      ...items,
                      ...brand().map((item) => ({ ...item, id: uid() })),
                    ])
                  }
                >
                  + Añadir marco JAY
                </button>
              </>
            )}
            {tool === "shapes" && (
              <>
                <h3>Formas</h3>
                <div className="shape-grid">
                  <button
                    onClick={() =>
                      add(
                        base("rect", {
                          name: "Rectángulo",
                          width: 260,
                          height: 180,
                          fill: "#000000",
                        }),
                      )
                    }
                  >
                    <Square />
                    Rectángulo
                  </button>
                  <button
                    onClick={() =>
                      add(
                        base("rect", {
                          name: "Rectángulo redondeado",
                          width: 260,
                          height: 180,
                          fill: "#EDEDED",
                          radius: 28,
                        }),
                      )
                    }
                  >
                    <Square />
                    Redondeado
                  </button>
                  <button
                    onClick={() =>
                      add(
                        base("circle", {
                          width: 260,
                          height: 260,
                          fill: "transparent",
                          stroke: "#000000",
                          strokeWidth: 3,
                        }),
                      )
                    }
                  >
                    <Circle />
                    Círculo
                  </button>
                  <button
                    onClick={() =>
                      add(
                        base("ellipse", {
                          width: 320,
                          height: 200,
                          fill: "transparent",
                          stroke: "#000000",
                          strokeWidth: 3,
                        }),
                      )
                    }
                  >
                    <Circle />
                    Elipse
                  </button>
                  <button
                    onClick={() =>
                      add(
                        base("line", {
                          width: 300,
                          height: 2,
                          stroke: "#000000",
                          strokeWidth: 3,
                        }),
                      )
                    }
                  >
                    <Minus />
                    Línea
                  </button>
                  <button onClick={() => add(cross(160, 160, "#000000", 56))}>
                    <Plus />
                    Cruz / Más
                  </button>
                </div>
              </>
            )}
            {tool === "images" && (
              <>
                <h3>Imágenes</h3>
                <p className="muted">
                  Añade una foto. Se ajustará al marco cuando cambies su tamaño.
                </p>
                <label className="image-upload">
                  <ImagePlus size={18} />
                  Añadir foto
                  <input
                    type="file"
                    accept="image/*"
                    onChange={(event) => {
                      const file = event.target.files?.[0];
                      if (file) addImageFile(file);
                      event.target.value = "";
                    }}
                  />
                </label>
                <p className="muted image-note">
                  La imagen queda guardada en este diseño. Selecciónala para
                  cambiar su orden.
                </p>
                {imageMessage && <p className="image-note">{imageMessage}</p>}
              </>
            )}
            {tool === "background" && (
              <BackgroundPanel design={design} setDesign={commit} />
            )}{" "}
            {tool === "effects" && (
              <EffectsPanel design={design} setDesign={commit} />
            )}{" "}
            {tool === "layers" && (
              <>
                <h3>Capas</h3>
                <div className="layers">
                  {[...design.elements].reverse().map((item) => (
                    <div
                      key={item.id}
                      className={
                        selected.includes(item.id) ? "layer active" : "layer"
                      }
                      onClick={() => setSelected([item.id])}
                    >
                      <span>
                        {item.type === "text" ? (
                          <Type size={14} />
                        ) : item.type === "plus" ? (
                          <Plus size={14} />
                        ) : (
                          <Shapes size={14} />
                        )}
                      </span>
                      <label>{item.name}</label>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          updateElements((items) =>
                            items.map((i) =>
                              i.id === item.id
                                ? { ...i, visible: !i.visible }
                                : i,
                            ),
                          );
                        }}
                      >
                        {item.visible ? (
                          <Eye size={14} />
                        ) : (
                          <EyeOff size={14} />
                        )}
                      </button>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          updateElements((items) =>
                            items.map((i) =>
                              i.id === item.id
                                ? { ...i, locked: !i.locked }
                                : i,
                            ),
                          );
                        }}
                      >
                        {item.locked ? (
                          <Lock size={13} />
                        ) : (
                          <LockOpen size={13} />
                        )}
                      </button>
                    </div>
                  ))}
                </div>
              </>
            )}
          </section>
        </aside>
        <section className="center">
          <div className="canvas-toolbar">
            <span>1080 × 1080</span>
            <div>
              <button
                className={snap ? "on" : ""}
                onClick={() => setSnap(!snap)}
              >
                <MousePointer2 size={14} />
                Ajuste {snap ? "activo" : "inactivo"}
              </button>
              <select
                value={zoom}
                onChange={(e) => setZoom(Number(e.target.value))}
              >
                <option value={0}>Ajustar</option>
                <option value={0.25}>25%</option>
                <option value={0.5}>50%</option>
                <option value={0.75}>75%</option>
                <option value={1}>100%</option>
              </select>
            </div>
          </div>
          <StudioCanvas
            design={design}
            selected={selected}
            setSelected={setSelected}
            updateElements={updateElements}
            snap={snap}
            zoom={zoom}
            stageRef={stageRef}
          />
        </section>
        <aside className="rightbar">
          {selectedItem ? (
            <Properties
              item={selectedItem}
              update={updateSelected}
              deleteItem={() => {
                updateElements((items) =>
                  items.filter((i) => i.id !== selectedItem.id),
                );
                setSelected([]);
              }}
              duplicate={() =>
                add({
                  ...selectedItem,
                  id: uid(),
                  x: selectedItem.x + 24,
                  y: selectedItem.y + 24,
                  name: `${selectedItem.name} copia`,
                })
              }
              sendToBack={() =>
                updateElements((items) => {
                  const chosen = items.find((item) => item.id === selectedItem.id);
                  return chosen
                    ? [chosen, ...items.filter((item) => item.id !== chosen.id)]
                    : items;
                })
              }
              bringToFront={() =>
                updateElements((items) => {
                  const chosen = items.find((item) => item.id === selectedItem.id);
                  return chosen
                    ? [...items.filter((item) => item.id !== chosen.id), chosen]
                    : items;
                })
              }
            />
          ) : (
            <DocumentPanel
              design={design}
              setDesign={commit}
              snap={snap}
              setSnap={setSnap}
            />
          )}
        </aside>
      </div>
    </main>
  );
}
