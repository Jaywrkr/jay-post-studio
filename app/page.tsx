"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import {
  AlignCenter,
  AlignLeft,
  AlignRight,
  Circle,
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
  uppercase?: boolean;
};
const uid = () => Math.random().toString(36).slice(2, 9);
const base = (
  type: ElementType,
  extra: Partial<StudioElement> = {},
): StudioElement => ({
  id: uid(),
  type,
  name:
    type === "text"
      ? "Text"
      : type === "plus"
        ? "Cross / Plus"
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
    name: value.slice(0, 24) || "Text",
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
  name = "Photo",
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
  subtitle: "JAY visual system",
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
      42,
      811,
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
    ...brand(),
    base("ellipse", { name: "Outer orbit", x: 121, y: 120, width: 838, height: 840, fill: "transparent", stroke: "#000000", strokeWidth: 3 }),
    base("ellipse", { name: "Middle orbit", x: 121, y: 370, width: 838, height: 330, fill: "transparent", stroke: "#000000", strokeWidth: 3 }),
    base("circle", { name: "Choice", x: 380, y: 643, width: 320, height: 320, fill: "transparent", stroke: "#000000", strokeWidth: 3 }),
    text("Hay gente", 457, 232, 31, "#000000", 250),
    { ...text("exitosa\nviviendo vidas", 310, 494, 31, "#000000", 460), align: "center" },
    { ...text("que no\nquieres", 414, 790, 31, "#000000", 250), align: "center" },
  ]),
  make("JAY / Repeater", black, [
    ...brand("#8C8C8C"),
    ...[
      [452, 110], [90, 260], [800, 216], [-34, 379], [590, 375], [835, 618],
      [-22, 640], [356, 750], [628, 869], [195, 947],
    ].map(([x, y]) =>
      text("LA MUERTE MEJORA MUCHAS PRIORIDADES.", x, y, 20, "#555555", 530),
    ),
    text("LA MUERTE MEJORA MUCHAS PRIORIDADES.", 195, 540, 30, "#FFFFFF", 720),
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
    { ...text("EL FUTURO", 220, 151, 31, "#000000", 640), align: "center", letterSpacing: 1 },
    { ...text("NO\nRESPETA", 350, 494, 31, "#000000", 380), align: "center", letterSpacing: 1 },
    { ...text("TUS\nEXCUSAS", 350, 888, 31, "#000000", 380), align: "center", letterSpacing: 1 },
  ]),
  make("JAY / Photo Reference", black, [
    postImage("/reference/jay-shadow.png", "JAY shadow reference"),
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
  elements: template.design.elements.map((e) => ({ ...e, id: uid() })),
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
});
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
      label: "Quiet Paper · reflexión directa",
      templateId: "jay-quiet-paper",
      copy: idea,
    },
    {
      id: "contrast",
      title: "La pregunta incómoda",
      label: "Four Sides · tensión y remate",
      templateId: "jay-four-sides",
      copy: `${frame.contrast}\n\nQuizá la pregunta no es cómo conseguir más.`,
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
      copy: `${frame.contrast}\n\n${idea}`,
      uppercase: true,
    },
  ];
};
const emptyDesign = (): Design => ({
  id: uid(),
  name: "Untitled post",
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
  return <DesignPreview design={template.design} />;
}

function Noise({ effects }: { effects: Effects }) {
  const [image, setImage] = useState<HTMLCanvasElement | null>(null);
  useEffect(() => {
    if (!effects.noise) {
      setImage(null);
      return;
    }
    const canvas = document.createElement("canvas");
    canvas.width = SIZE;
    canvas.height = SIZE;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
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
    setImage(canvas);
  }, [effects]);
  return image ? (
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
  const isDark = background.color.toLowerCase() === "#000000";
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
    if (!item.src) {
      setBitmap(null);
      return;
    }
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
  if (!bitmap) return null;
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
  useEffect(() => setCanvasReady(true), []);
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
    updateElements((items) =>
      items.map((i) =>
        i.id === item.id
          ? {
              ...i,
              x: node.x(),
              y: node.y(),
              rotation: node.rotation(),
              width: Math.max(12, item.width * sx),
              height: Math.max(12, item.height * sy),
            }
          : i,
      ),
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
    return <div className="canvas-wrap"><div className="canvas-loading">Preparing canvas…</div></div>;
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
                        fontFamily="Geist Mono"
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
                "top-right",
                "bottom-left",
                "bottom-right",
              ]}
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
      <h3>Background</h3>
      <div className="segmented">
        {(["solid", "linear", "radial"] as const).map((type) => (
          <button
            key={type}
            className={bg.type === type ? "selected" : ""}
            onClick={() =>
              setDesign({ ...design, background: { ...bg, type } })
            }
          >
            {type}
          </button>
        ))}
      </div>
      <ColorInput
        label="Color A"
        value={bg.color}
        onChange={(color) =>
          setDesign({ ...design, background: { ...bg, color } })
        }
      />
      {bg.type !== "solid" && (
        <>
          <ColorInput
            label="Color B"
            value={bg.colorB}
            onChange={(colorB) =>
              setDesign({ ...design, background: { ...bg, colorB } })
            }
          />
          <NumberField
            label="Angle"
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
      <h3>Effects</h3>
      <label className="toggle">
        <span>Noise / grain</span>
        <input
          type="checkbox"
          checked={fx.noise}
          onChange={(e) => patch({ noise: e.target.checked })}
        />
      </label>
      <p className="muted">
        Procedural texture; it is included in exported PNG files.
      </p>
      <NumberField
        label="Noise amount"
        value={fx.noiseAmount}
        onChange={(noiseAmount) => patch({ noiseAmount })}
      />
      <NumberField
        label="Noise opacity"
        value={fx.noiseOpacity}
        step={0.01}
        onChange={(noiseOpacity) => patch({ noiseOpacity })}
      />
      <NumberField
        label="Grain scale"
        value={fx.noiseScale}
        step={0.5}
        onChange={(noiseScale) => patch({ noiseScale })}
      />
      <NumberField
        label="Seed"
        value={fx.seed}
        onChange={(seed) => patch({ seed })}
      />
      <div className="side-rule" />
      <h3>Post details</h3>
      <p className="muted">
        Small editorial treatments for giving the post a more intentional finish.
      </p>
      <label className="toggle">
        <span>Scanlines</span>
        <input
          type="checkbox"
          checked={fx.scanlines || false}
          onChange={(e) => patch({ scanlines: e.target.checked })}
        />
      </label>
      <NumberField
        label="Line opacity"
        value={fx.scanlineOpacity || 0.08}
        step={0.01}
        onChange={(scanlineOpacity) => patch({ scanlineOpacity })}
      />
      <NumberField
        label="Line spacing"
        value={fx.scanlineSpacing || 12}
        onChange={(scanlineSpacing) => patch({ scanlineSpacing })}
      />
      <label className="toggle">
        <span>Dot field</span>
        <input
          type="checkbox"
          checked={fx.dotField || false}
          onChange={(e) => patch({ dotField: e.target.checked })}
        />
      </label>
      <NumberField
        label="Dot opacity"
        value={fx.dotOpacity || 0.12}
        step={0.01}
        onChange={(dotOpacity) => patch({ dotOpacity })}
      />
      <NumberField
        label="Dot spacing"
        value={fx.dotSpacing || 48}
        onChange={(dotSpacing) => patch({ dotSpacing })}
      />
      <NumberField
        label="Dot size"
        value={fx.dotSize || 1.5}
        step={0.5}
        onChange={(dotSize) => patch({ dotSize })}
      />
      <label className="toggle">
        <span>Edge focus</span>
        <input
          type="checkbox"
          checked={fx.vignette || false}
          onChange={(e) => patch({ vignette: e.target.checked })}
        />
      </label>
      <NumberField
        label="Edge opacity"
        value={fx.vignetteOpacity || 0.16}
        step={0.01}
        onChange={(vignetteOpacity) => patch({ vignetteOpacity })}
      />
      <label className="toggle">
        <span>Archive frame</span>
        <input
          type="checkbox"
          checked={fx.frame || false}
          onChange={(e) => patch({ frame: e.target.checked })}
        />
      </label>
      <NumberField
        label="Frame inset"
        value={fx.frameInset || 48}
        onChange={(frameInset) => patch({ frameInset })}
      />
      <NumberField
        label="Frame opacity"
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
      <p className="panel-kicker">DOCUMENT</p>
      <h2>Instagram Square</h2>
      <div className="document-size">
        1080 <span>×</span> 1080 <small>px</small>
      </div>
      <div className="side-rule" />
      <label className="toggle">
        <span>Snap to guides</span>
        <input
          type="checkbox"
          checked={snap}
          onChange={(e) => setSnap(e.target.checked)}
        />
      </label>
      <label className="toggle">
        <span>Grain effect</span>
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
        Select an element to edit its typography, color and position.
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
  return (
    <>
      <div className="property-head">
        <div>
          <p className="panel-kicker">{item.type.toUpperCase()}</p>
          <h2>{item.name}</h2>
        </div>
        <button onClick={deleteItem}>
          <Trash2 size={17} />
        </button>
      </div>
      {item.type === "text" ? (
        <section className="property-section">
          <h3>Text</h3>
          <label className="field">
            <span>Content</span>
            <textarea
              value={item.text || ""}
              onChange={(e) =>
                update({
                  text: e.target.value,
                  name: e.target.value.slice(0, 24) || "Text",
                })
              }
            />
          </label>
          <label className="field">
            <span>Font</span>
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
              label="Size"
              value={item.fontSize || 0}
              onChange={(fontSize) => update({ fontSize })}
            />
            <label className="field">
              <span>Weight</span>
              <select
                value={item.fontStyle || "normal"}
                onChange={(e) => update({ fontStyle: e.target.value })}
              >
                <option value="100">Thin</option>
                <option value="200">Extra Light</option>
                <option value="300">Light</option>
                <option value="normal">Regular</option>
                <option value="500">Medium</option>
                <option value="600">SemiBold</option>
                <option value="bold">Bold</option>
                <option value="800">ExtraBold</option>
                <option value="900">Black</option>
                <option value="italic">Italic</option>
              </select>
            </label>
          </div>
          <div className="field-row">
            <NumberField
              label="Line height"
              value={item.lineHeight || 1}
              step={0.1}
              onChange={(lineHeight) => update({ lineHeight })}
            />
            <NumberField
              label="Tracking"
              value={item.letterSpacing || 0}
              onChange={(letterSpacing) => update({ letterSpacing })}
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
            <span>Uppercase</span>
            <input
              type="checkbox"
              checked={item.uppercase || false}
              onChange={(e) => update({ uppercase: e.target.checked })}
            />
          </label>
        </section>
      ) : item.type === "image" ? (
        <section className="property-section">
          <h3>Image</h3>
          <p className="muted">Drag, resize or replace this photo from Images.</p>
        </section>
      ) : (
        <section className="property-section">
          <h3>Appearance</h3>
          <ColorInput
            label="Fill"
            value={item.fill}
            onChange={(fill) => update({ fill })}
          />
          {item.type !== "plus" && (
            <ColorInput
              label="Stroke"
              value={item.stroke || "#000000"}
              onChange={(stroke) => update({ stroke })}
            />
          )}
          <NumberField
            label="Stroke width"
            value={item.strokeWidth || 0}
            onChange={(strokeWidth) => update({ strokeWidth })}
          />
          {item.type === "rect" && (
            <NumberField
              label="Corner radius"
              value={item.radius || 0}
              onChange={(radius) => update({ radius })}
            />
          )}
        </section>
      )}
      <section className="property-section">
        <h3>Position</h3>
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
            onChange={(width) => update({ width })}
          />
          <NumberField
            label="H"
            value={Math.round(item.height)}
            onChange={(height) => update({ height })}
          />
          <NumberField
            label="Rotation"
            value={Math.round(item.rotation)}
            onChange={(rotation) => update({ rotation })}
          />
          <NumberField
            label="Opacity"
            value={item.opacity}
            step={0.05}
            onChange={(opacity) => update({ opacity })}
          />
        </div>
      </section>
      <div className="property-actions">
        <button onClick={() => update({ x: 0 })}>
          <AlignLeft size={15} />
          Canvas left
        </button>
        <button onClick={() => update({ x: (SIZE - item.width) / 2 })}>
          <AlignCenter size={15} />
          Center
        </button>
        <button onClick={() => update({ x: SIZE - item.width })}>
          <AlignRight size={15} />
          Canvas right
        </button>
        <button onClick={duplicate}>
          <Copy size={15} />
          Duplicate
        </button>
        <button onClick={sendToBack}>To back</button>
        <button onClick={bringToFront}>To front</button>
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
  const [saved, setSaved] = useState("Saved");
  const [history, setHistory] = useState<Design[]>([]);
  const [future, setFuture] = useState<Design[]>([]);
  const [myDesigns, setMyDesigns] = useState<Design[]>([]);
  const [myTemplates, setMyTemplates] = useState<Template[]>([]);
  const [shouldPersist, setShouldPersist] = useState(false);
  const [imageMessage, setImageMessage] = useState("");
  const [ideaInput, setIdeaInput] = useState("");
  const [ideaTension, setIdeaTension] = useState<IdeaTension>("other");
  const [ideaRoutes, setIdeaRoutes] = useState<IdeaRoute[]>([]);
  const stageRef = useRef<Konva.Stage>(null);
  useEffect(() => {
    try {
      setMyDesigns(
        JSON.parse(localStorage.getItem("jay-post-designs") || "[]"),
      );
      setMyTemplates(
        JSON.parse(localStorage.getItem("jay-post-templates") || "[]"),
      );
    } catch {}
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
      setSaved("Saved");
    } catch {
      setSaved("Saved in this session");
    }
  }, []);
  useEffect(() => {
    if (screen !== "editor" || !shouldPersist) return;
    const timer = window.setTimeout(() => persist(design), 1200);
    setSaved("Saving…");
    return () => window.clearTimeout(timer);
  }, [design, persist, screen, shouldPersist]);
  const commit = (next: Design) => {
    setHistory((h) => [...h.slice(-39), design]);
    setFuture([]);
    setShouldPersist(true);
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
      setImageMessage("Choose an image file.");
      return;
    }
    if (file.size > 2 * 1024 * 1024) {
      setImageMessage("Use a photo under 2 MB so the design can be saved.");
      return;
    }
    const reader = new FileReader();
    reader.onload = () => {
      add(postImage(String(reader.result), file.name, 120, 120, 720, 720));
      setImageMessage("Photo added. Select it to resize or reorder it.");
    };
    reader.readAsDataURL(file);
  };
  const selectedItem =
    selected.length === 1
      ? design.elements.find((item) => item.id === selected[0])
      : undefined;
  const updateSelected = (patch: Partial<StudioElement>) =>
    selectedItem &&
    updateElements((items) =>
      items.map((item) =>
        item.id === selectedItem.id ? { ...item, ...patch } : item,
      ),
    );
  const newFrom = (d: Design) => {
    setDesign(d);
    setSelected([]);
    setHistory([]);
    setFuture([]);
    setShouldPersist(false);
    setSaved("Template ready");
    setScreen("editor");
  };
  const openIdeaRoute = (route: IdeaRoute) => {
    const source = templates.find((template) => template.id === route.templateId);
    if (!source) return;
    const next = cloneTemplate(source);
    const copyTargets = next.elements
      .filter(
        (item) =>
          item.type === "text" &&
          (item.fontSize || 0) >= 28 &&
          item.text?.toUpperCase() !== "SIMPLE",
      )
      .sort((a, b) => a.y - b.y);
    const rewrite = (item: StudioElement, value: string) => ({
      ...item,
      text: value,
      name: value.slice(0, 24) || item.name,
      height: (item.fontSize || 36) * 1.35 * Math.max(1, value.split("\n").length),
      uppercase: route.uppercase || item.uppercase,
    });
    next.elements = next.elements.map((item) => {
      const index = copyTargets.findIndex((target) => target.id === item.id);
      if (index < 0) return item;
      if (route.templateId === "jay-four-sides")
        return rewrite(item, index === 0 ? route.copy : route.counterpoint || route.copy);
      return rewrite(item, route.copy);
    });
    next.name = route.title;
    newFrom(next);
    setTool("text");
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
  const exportPng = () => {
    if (!stageRef.current) return;
    setSelected([]);
    window.requestAnimationFrame(() => window.requestAnimationFrame(() => {
      const a = document.createElement("a");
      a.download = `${design.name.toLowerCase().replace(/[^a-z0-9]+/g, "-") || "jay-post"}.png`;
      a.href = stageRef.current!.toDataURL({ pixelRatio: 1 });
      a.click();
    }));
  };
  const saveTemplate = () => {
    const template: Template = {
      id: uid(),
      name: design.name,
      subtitle: "My template",
      design: {
        background: design.background,
        effects: design.effects,
        elements: design.elements.map((e) => ({ ...e, id: uid() })),
      },
    };
    setMyTemplates((list) => {
      const next = [template, ...list];
      localStorage.setItem("jay-post-templates", JSON.stringify(next));
      return next;
    });
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
        event.shiftKey ? redo() : undo();
      }
      if (mod && event.key.toLowerCase() === "d" && selectedItem) {
        event.preventDefault();
        add({
          ...selectedItem,
          id: uid(),
          x: selectedItem.x + 30,
          y: selectedItem.y + 30,
          name: `${selectedItem.name} copy`,
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
  const templateList = [...templates.slice(0, 15), ...myTemplates];
  if (screen === "library")
    return (
      <main className="library">
        <header className="library-head">
          <div className="wordmark">
            JAY <span>POST STUDIO</span>
          </div>
          <button className="primary" onClick={() => newFrom(emptyDesign())}>
            <Plus size={16} />
            New design
          </button>
        </header>
        <section className="library-hero">
          <p>
            MY DESIGNS <em>{myDesigns.length.toString().padStart(2, "0")}</em>
          </p>
          <h1>
            Make room
            <br />
            for the idea.
          </h1>
          <button
            onClick={() => {
              setTool("ideas");
              newFrom(emptyDesign());
            }}
          >
            Turn an idea into a post <Sparkles size={16} />
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
                <strong>{item.name}</strong>
                <small>1080 × 1080</small>
              </button>
            ))
          ) : (
            <div className="empty-card">
              <Grid2X2 size={26} />
              <p>Your saved posts will live here.</p>
            </div>
          )}
        </section>
        <section className="template-library">
          <div className="template-library-head">
            <div>
              <p>TEMPLATE LIBRARY / {templateList.length.toString().padStart(2, "0")} SYSTEMS</p>
              <h2>Choose the composition first.</h2>
            </div>
            <button
              className="view-library"
              onClick={() => {
                setTool("templates");
                newFrom(emptyDesign());
              }}
            >
              Browse all templates <Plus size={15} />
            </button>
          </div>
          <div className="template-row">
            {templateList.slice(0, 6).map((template) => (
              <button
                key={template.id}
                className="template-card"
                onClick={() => newFrom(cloneTemplate(template))}
              >
                <MiniPreview template={template} />
                <span>{template.name}</span>
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
          <button title="Undo" onClick={undo} disabled={!history.length}>
            <Undo2 size={17} />
          </button>
          <button title="Redo" onClick={redo} disabled={!future.length}>
            <Redo2 size={17} />
          </button>
          <button onClick={() => newFrom(emptyDesign())}>
            <FilePlus2 size={16} />
            New
          </button>
          <button
            onClick={() => {
              setShouldPersist(true);
              persist(design);
            }}
          >
            <Save size={16} />
            Save
          </button>
          <button
            onClick={() =>
              newFrom({ ...design, id: uid(), name: `${design.name} copy` })
            }
          >
            <Copy size={16} />
            Duplicate
          </button>
          <button onClick={saveTemplate}>
            <Sparkles size={16} />
            Template
          </button>
          <button className="export" onClick={exportPng}>
            <Download size={16} />
            Export PNG
          </button>
        </div>
      </header>
      <div className="workspace">
        <aside className="leftbar">
          <nav>
            {(
              [
                { id: "templates", icon: Grid2X2, label: "Templates" },
                { id: "ideas", icon: Sparkles, label: "Idea" },
                { id: "text", icon: Type, label: "Text" },
                { id: "shapes", icon: Shapes, label: "Shapes" },
                { id: "images", icon: ImagePlus, label: "Images" },
                { id: "background", icon: Palette, label: "Background" },
                { id: "effects", icon: Sparkles, label: "Effects" },
                { id: "layers", icon: Layers3, label: "Layers" },
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
          <section className="left-content">
            {tool === "templates" && (
              <>
                <h3>Templates</h3>
                <p className="muted">
                  Use a composition. You will edit a new copy.
                </p>
                <div className="template-grid">
                  {templateList.map((template) => (
                    <button
                      key={template.id}
                      onClick={() => newFrom(cloneTemplate(template))}
                    >
                      <MiniPreview template={template} />
                      <span>{template.name}</span>
                    </button>
                  ))}
                </div>
              </>
            )}
            {tool === "ideas" && (
              <>
                <h3>From an idea</h3>
                <p className="muted">
                  Write the raw thought first. The studio will turn it into
                  four JAY directions you can edit.
                </p>
                <label className="field">
                  <span>Your raw thought</span>
                  <textarea
                    className="idea-input"
                    value={ideaInput}
                    placeholder="I am making more money but have less control of my time."
                    onChange={(event) => setIdeaInput(event.target.value)}
                  />
                </label>
                <label className="field">
                  <span>What is underneath it?</span>
                  <select
                    value={ideaTension}
                    onChange={(event) => setIdeaTension(event.target.value as IdeaTension)}
                  >
                    <option value="time">Time</option>
                    <option value="freedom">Freedom</option>
                    <option value="limits">Limits</option>
                    <option value="money">Money</option>
                    <option value="identity">Identity</option>
                    <option value="routine">Routine</option>
                    <option value="other">Something else</option>
                  </select>
                </label>
                <button
                  className="idea-generate"
                  disabled={!cleanIdea(ideaInput)}
                  onClick={() => setIdeaRoutes(buildIdeaRoutes(ideaInput, ideaTension))}
                >
                  <Sparkles size={15} />
                  Create directions
                </button>
                {ideaRoutes.length > 0 && (
                  <div className="idea-routes">
                    {ideaRoutes.map((route) => (
                      <article className="idea-route" key={route.id}>
                        <p className="idea-kicker">{route.label}</p>
                        <h4>{route.title}</h4>
                        <p className="idea-copy">{route.copy}</p>
                        <button onClick={() => openIdeaRoute(route)}>
                          Open this direction <Plus size={13} />
                        </button>
                      </article>
                    ))}
                  </div>
                )}
              </>
            )}
            {tool === "text" && (
              <>
                <h3>Text</h3>
                <div className="add-list">
                  <button onClick={() => add(text("HEADLINE", 160, 300, 64))}>
                    <Type />
                    Add headline
                  </button>
                  <button
                    onClick={() =>
                      add(text("Body text goes here.", 160, 300, 30))
                    }
                  >
                    <Type />
                    Add body
                  </button>
                  <button
                    onClick={() => add(text("SMALL LABEL", 160, 300, 18))}
                  >
                    <Type />
                    Add small label
                  </button>
                  <button
                    onClick={() =>
                      add(text("A MONO QUOTE\nWITH INTENTION.", 160, 300, 42))
                    }
                  >
                    <Type />
                    Add mono quote
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
                  + Add brand frame
                </button>
              </>
            )}
            {tool === "shapes" && (
              <>
                <h3>Shapes</h3>
                <div className="shape-grid">
                  <button
                    onClick={() =>
                      add(
                        base("rect", {
                          name: "Rectangle",
                          width: 260,
                          height: 180,
                          fill: "#000000",
                        }),
                      )
                    }
                  >
                    <Square />
                    Rectangle
                  </button>
                  <button
                    onClick={() =>
                      add(
                        base("rect", {
                          name: "Rounded rectangle",
                          width: 260,
                          height: 180,
                          fill: "#EDEDED",
                          radius: 28,
                        }),
                      )
                    }
                  >
                    <Square />
                    Rounded
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
                    Circle
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
                    Ellipse
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
                    Line
                  </button>
                  <button onClick={() => add(cross(160, 160, "#000000", 56))}>
                    <Plus />
                    Cross / Plus
                  </button>
                </div>
              </>
            )}
            {tool === "images" && (
              <>
                <h3>Images</h3>
                <p className="muted">
                  Add your own photo. It will cover its frame cleanly when you
                  resize it.
                </p>
                <label className="image-upload">
                  <ImagePlus size={18} />
                  Add photo
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
                  Your image stays in this design on this browser. Select it
                  to send it behind text or bring it forward.
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
                <h3>Layers</h3>
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
                Snap {snap ? "on" : "off"}
              </button>
              <select
                value={zoom}
                onChange={(e) => setZoom(Number(e.target.value))}
              >
                <option value={0}>Fit</option>
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
                  name: `${selectedItem.name} copy`,
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
