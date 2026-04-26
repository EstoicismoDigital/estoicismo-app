/**
 * Motor de brainstorm para los que aún no tienen negocio.
 *
 * Idea: el user marca pasiones, habilidades, presupuesto y tiempo
 * disponible — el motor sugiere ideas de negocio matchadas. NO se
 * trata de inventar negocios desde cero; se trata de mapear lo que
 * ya tiene a opciones realistas y de bajo riesgo.
 *
 * Las ideas son curadas (~40 ideas representativas). Cada una tiene
 * tags que se cruzan con lo que el user marca. El score determina
 * el orden.
 */

export type BrainstormPassion =
  | "tecnologia"
  | "creatividad"
  | "deporte"
  | "comida"
  | "moda"
  | "educacion"
  | "salud"
  | "finanzas"
  | "social"
  | "naturaleza"
  | "musica"
  | "viajes";

export type BrainstormSkill =
  | "escribir"
  | "diseño"
  | "programar"
  | "vender"
  | "enseñar"
  | "cocinar"
  | "hablar-publico"
  | "manualidades"
  | "fotografia"
  | "redes-sociales"
  | "logistica"
  | "atencion-cliente";

export type BrainstormBudget = "<500" | "500-5k" | "5k-30k" | "30k+";
export type BrainstormTime = "horas-libres" | "20h-semana" | "full-time";

export type BrainstormInput = {
  passions: BrainstormPassion[];
  skills: BrainstormSkill[];
  budget: BrainstormBudget;
  time: BrainstormTime;
};

export type BusinessIdeaTemplate = {
  /** Identificador estable. */
  id: string;
  title: string;
  description: string;
  category: "digital" | "fisico" | "servicios" | "contenido" | "hibrido";
  /** Tags semánticos para matching. */
  passions: BrainstormPassion[];
  skills: BrainstormSkill[];
  /** Presupuestos donde tiene sentido (orden creciente). */
  budgets: BrainstormBudget[];
  times: BrainstormTime[];
  /** Costo aproximado de empezar — texto humano. */
  startupCostText: string;
  /** Por qué es fácil empezar. */
  whyEasy: string;
  /** Riesgos / consideraciones. */
  risks: string;
};

const IDEAS: BusinessIdeaTemplate[] = [
  // ─── DIGITALES ──────────────────────────────────────────────
  {
    id: "freelance-tech",
    title: "Freelance técnico (programación / soporte)",
    description: "Vende tus horas a empresas o personas que necesitan ayuda con su web, app o configuración técnica.",
    category: "servicios",
    passions: ["tecnologia"],
    skills: ["programar", "atencion-cliente"],
    budgets: ["<500", "500-5k"],
    times: ["horas-libres", "20h-semana", "full-time"],
    startupCostText: "$0 si ya tienes laptop",
    whyEasy: "Cero inventario, vendes desde el día uno en LinkedIn / Upwork / Fiverr.",
    risks: "Te puedes saturar; aprende a decir no y a cobrar por valor, no por hora.",
  },
  {
    id: "diseño-canva",
    title: "Diseño en Canva para PyMEs",
    description: "Ofreces packs de diseño (redes sociales, presentaciones, flyers) a negocios pequeños que no quieren agencia.",
    category: "servicios",
    passions: ["creatividad"],
    skills: ["diseño", "vender"],
    budgets: ["<500"],
    times: ["horas-libres", "20h-semana"],
    startupCostText: "$0 (Canva gratis) — $250/mes Pro",
    whyEasy: "Curva de aprendizaje baja. Demanda altísima en PyMEs.",
    risks: "Margen bajo si no sales del 'soy barato'. Sube precios cada 5 clientes.",
  },
  {
    id: "tienda-print-on-demand",
    title: "Tienda de print-on-demand",
    description: "Diseñas playeras, tazas, posters; Printful o Printify imprime y envía. Tú no tocas inventario.",
    category: "digital",
    passions: ["creatividad", "moda"],
    skills: ["diseño", "redes-sociales"],
    budgets: ["<500", "500-5k"],
    times: ["horas-libres", "20h-semana"],
    startupCostText: "$500-2000 MXN para Shopify + dominio",
    whyEasy: "Sin inventario, sin envíos. Subes diseños y listo.",
    risks: "Marketing es todo. Sin tráfico no vendes. Empieza con TikTok orgánico.",
  },
  {
    id: "newsletter-paga",
    title: "Newsletter de pago en tu nicho",
    description: "Una vez por semana mandas algo valioso (analítica, recomendaciones, insights). 100 suscriptores a $99/mes = $9,900/mes.",
    category: "contenido",
    passions: ["tecnologia", "finanzas", "creatividad", "educacion"],
    skills: ["escribir"],
    budgets: ["<500"],
    times: ["horas-libres"],
    startupCostText: "$0 (Substack toma 10% si cobras)",
    whyEasy: "Audiencia es trabajo, no dinero. Calidad > frecuencia.",
    risks: "Tarda 6-12 meses construir base. Empieza gratis, monetiza al llegar a 500 lectores.",
  },
  {
    id: "curso-online",
    title: "Curso online de algo que ya enseñas",
    description: "Empaqueta lo que sabes (programar, cocinar, fotografiar) en 5-10 lecciones grabadas y véndelo en Hotmart / Gumroad.",
    category: "digital",
    passions: ["educacion"],
    skills: ["enseñar", "hablar-publico"],
    budgets: ["<500", "500-5k"],
    times: ["20h-semana"],
    startupCostText: "$1k-5k MXN (mic decente, un mes de tiempo)",
    whyEasy: "Lo grabas una vez, vendes infinito.",
    risks: "El curso muere sin marketing. Construye audiencia primero (Instagram / TikTok / blog).",
  },
  // ─── FÍSICOS ────────────────────────────────────────────────
  {
    id: "comida-domicilio",
    title: "Comida casera a domicilio (1 platillo, 1 día)",
    description: "Tienes 'martes de lasaña' o 'viernes de tacos'. Cocinas en tu casa, vendes por WhatsApp / IG. Empezas con 10 órdenes.",
    category: "fisico",
    passions: ["comida"],
    skills: ["cocinar", "atencion-cliente"],
    budgets: ["<500", "500-5k"],
    times: ["horas-libres", "20h-semana"],
    startupCostText: "$1k-3k MXN (utensilios + envases)",
    whyEasy: "Producto que la gente pide hoy. Ciclo de venta de horas.",
    risks: "Higiene es no negociable. Costos crecen rápido si no llevas cuentas. Empieza con margen 60%+.",
  },
  {
    id: "venta-segunda-mano",
    title: "Venta de cosas usadas (Marketplace / Vinted)",
    description: "Tu casa tiene $20-50k MXN escondidos. Empezar es vaciar tu clóset.",
    category: "fisico",
    passions: ["moda", "social"],
    skills: ["vender", "fotografia"],
    budgets: ["<500"],
    times: ["horas-libres"],
    startupCostText: "$0",
    whyEasy: "Inventario gratis (ya lo tienes).",
    risks: "Sin escala — es ingreso de transición o complemento, no negocio principal.",
  },
  {
    id: "tienda-nicho",
    title: "Tienda online de nicho (1 producto-héroe)",
    description: "Importa o fabrica UN producto que tú usas y entiendes. Lo vendes con marca propia. Ej: cuadernos especiales, café especialidad.",
    category: "fisico",
    passions: ["creatividad", "comida", "moda", "deporte"],
    skills: ["vender", "redes-sociales"],
    budgets: ["5k-30k"],
    times: ["20h-semana", "full-time"],
    startupCostText: "$10k-30k MXN (inventario + ads)",
    whyEasy: "Margen sano si eliges bien el producto. Marca propia construye valor a largo plazo.",
    risks: "Inventario es capital atrapado. Valida antes de pedir. Empieza con preventa.",
  },
  {
    id: "manualidades",
    title: "Productos artesanales (jabones, velas, accesorios)",
    description: "Haces algo a mano que te apasione. Vendes en bazares, IG, mercados. Etsy si te aventuras al inglés.",
    category: "fisico",
    passions: ["creatividad", "naturaleza"],
    skills: ["manualidades"],
    budgets: ["<500", "500-5k"],
    times: ["horas-libres"],
    startupCostText: "$500-3k MXN según producto",
    whyEasy: "Empiezas en tu mesa. Margen por unidad muy bueno.",
    risks: "Volumen limitado por horas. Para escalar necesitas equipo o automatización.",
  },
  // ─── SERVICIOS ──────────────────────────────────────────────
  {
    id: "marketing-pymes",
    title: "Marketing digital para PyMEs locales",
    description: "Eres el 'community manager' de 3-5 negocios. $3-5k MXN cada uno por mes.",
    category: "servicios",
    passions: ["creatividad", "social"],
    skills: ["redes-sociales", "vender", "diseño"],
    budgets: ["<500"],
    times: ["20h-semana", "full-time"],
    startupCostText: "$0",
    whyEasy: "Mercado masivo (todo negocio local lo necesita). Cobras retainer mensual.",
    risks: "Vender es 50% del trabajo al empezar. Define un nicho concreto: 'restaurantes', 'gimnasios', etc.",
  },
  {
    id: "limpieza-hogar",
    title: "Servicio de limpieza profunda",
    description: "Casas / oficinas. Llegas con tu kit, dejas todo brillando. Cobra por turno (4h = $800-1,500 MXN).",
    category: "servicios",
    passions: [],
    skills: ["atencion-cliente"],
    budgets: ["<500"],
    times: ["20h-semana", "full-time"],
    startupCostText: "$1k-2k MXN (kit de limpieza + tarjetas)",
    whyEasy: "Demanda altísima en CDMX/GDL/MTY. Cliente recurrente.",
    risks: "Tu cuerpo es tu activo — cuídate. Escala contratando o subcontratando.",
  },
  {
    id: "asesoria-personal",
    title: "Asesoría 1:1 (lo que ya sabes)",
    description: "Si la gente te pregunta cosas y te dice 'wow', cobra por eso. Sesiones de 1h por $500-2,000 MXN según área.",
    category: "servicios",
    passions: ["finanzas", "salud", "deporte", "educacion"],
    skills: ["enseñar", "hablar-publico"],
    budgets: ["<500"],
    times: ["horas-libres", "20h-semana"],
    startupCostText: "$0",
    whyEasy: "Tiempo a cambio de dinero, sin inventario.",
    risks: "Techo claro (tus horas). Eventualmente conviene productizar.",
  },
  {
    id: "fotografia-eventos",
    title: "Fotografía / video para eventos pequeños",
    description: "Cumpleaños, graduaciones, sesiones familiares. $2-8k MXN por evento.",
    category: "servicios",
    passions: ["creatividad"],
    skills: ["fotografia"],
    budgets: ["500-5k", "5k-30k"],
    times: ["horas-libres", "20h-semana"],
    startupCostText: "$5k-25k MXN si necesitas equipo",
    whyEasy: "Eventos pequeños siempre están — y prefieren a alguien cercano que a estudio caro.",
    risks: "Edición consume horas. Cobra por proyecto, nunca por hora editando.",
  },
  // ─── CONTENIDO ──────────────────────────────────────────────
  {
    id: "tiktok-creator",
    title: "Creator de TikTok / Instagram en un nicho",
    description: "Eliges un tema (libros, finanzas, fitness, comida casera) y publicas 1-3 videos al día. Monetizas con marcas a los 10k+ seguidores.",
    category: "contenido",
    passions: ["tecnologia", "creatividad", "deporte", "comida", "moda", "salud", "finanzas", "musica", "viajes", "educacion"],
    skills: ["redes-sociales", "hablar-publico"],
    budgets: ["<500"],
    times: ["horas-libres", "20h-semana"],
    startupCostText: "$0 (sólo tu celular)",
    whyEasy: "El algoritmo te puede llevar a 1M de vistas en una semana. No requiere capital.",
    risks: "Plataforma riesgo (cambia el algoritmo, te apagas). Construye email + IG en paralelo.",
  },
  {
    id: "podcast-nicho",
    title: "Podcast en un nicho específico",
    description: "Una hora a la semana, conversación con alguien que sabe. Patrocinios cuando llegas a 1k oyentes recurrentes.",
    category: "contenido",
    passions: ["tecnologia", "finanzas", "social", "salud", "musica"],
    skills: ["hablar-publico", "escribir"],
    budgets: ["<500", "500-5k"],
    times: ["horas-libres"],
    startupCostText: "$2k-5k MXN (mic + edición)",
    whyEasy: "Audio es íntimo. Conviertes oyentes en clientes de otros productos tuyos.",
    risks: "Tarda construir. No es ingreso pasivo — es activo de marca personal.",
  },
  // ─── HÍBRIDOS ───────────────────────────────────────────────
  {
    id: "consultorias-paquete",
    title: "Paquetes de consultoría (no horas)",
    description: "En vez de cobrar $500/h, ofreces 'auditoría de redes sociales por $5k' con entregables claros.",
    category: "hibrido",
    passions: ["tecnologia", "finanzas", "creatividad"],
    skills: ["enseñar", "vender", "escribir"],
    budgets: ["<500"],
    times: ["horas-libres", "20h-semana"],
    startupCostText: "$0",
    whyEasy: "Margen muy alto. Cliente paga por resultado, no por tiempo.",
    risks: "Define entregables exactos antes de cobrar. Sin scope claro = trabajar de gratis.",
  },
];

export const PASSION_LABELS: Record<BrainstormPassion, string> = {
  tecnologia: "Tecnología",
  creatividad: "Creatividad",
  deporte: "Deporte",
  comida: "Comida",
  moda: "Moda y belleza",
  educacion: "Educación",
  salud: "Salud y bienestar",
  finanzas: "Finanzas",
  social: "Personas / social",
  naturaleza: "Naturaleza",
  musica: "Música",
  viajes: "Viajes",
};

export const SKILL_LABELS: Record<BrainstormSkill, string> = {
  escribir: "Escribir",
  diseño: "Diseñar",
  programar: "Programar",
  vender: "Vender / negociar",
  enseñar: "Enseñar",
  cocinar: "Cocinar",
  "hablar-publico": "Hablar en público",
  manualidades: "Manualidades",
  fotografia: "Fotografía / video",
  "redes-sociales": "Redes sociales",
  logistica: "Logística",
  "atencion-cliente": "Atención al cliente",
};

export const BUDGET_LABELS: Record<BrainstormBudget, string> = {
  "<500": "Menos de $500",
  "500-5k": "$500 – $5,000",
  "5k-30k": "$5,000 – $30,000",
  "30k+": "Más de $30,000",
};

export const TIME_LABELS: Record<BrainstormTime, string> = {
  "horas-libres": "Solo en mis horas libres",
  "20h-semana": "Unas 20 horas a la semana",
  "full-time": "Tiempo completo / casi",
};

export type ScoredIdea = {
  template: BusinessIdeaTemplate;
  score: number;
  /** Cómo conectó con tus inputs — para mostrar al user. */
  reasons: string[];
};

/**
 * Computa ideas matchadas según los inputs del user. Score se calcula
 * sumando puntos:
 *   - +2 por pasión que cruza
 *   - +2 por skill que cruza
 *   - +3 si el budget está en el rango de la idea
 *   - +1 si el tiempo coincide
 *   - +1 si la idea está dentro de los budgets en orden ascendente
 *     (ideas baratas tienen pequeño boost porque son menos riesgosas)
 *
 * Devuelve top N ordenadas por score desc.
 */
export function suggestIdeas(input: BrainstormInput, limit = 6): ScoredIdea[] {
  const passionsSet = new Set(input.passions);
  const skillsSet = new Set(input.skills);

  const scored: ScoredIdea[] = IDEAS.map((tpl) => {
    let score = 0;
    const reasons: string[] = [];

    const passionMatches = tpl.passions.filter((p) => passionsSet.has(p));
    if (passionMatches.length > 0) {
      score += passionMatches.length * 2;
      reasons.push(
        `Conecta con tu pasión: ${passionMatches.map((p) => PASSION_LABELS[p].toLowerCase()).join(", ")}.`
      );
    }

    const skillMatches = tpl.skills.filter((s) => skillsSet.has(s));
    if (skillMatches.length > 0) {
      score += skillMatches.length * 2;
      reasons.push(
        `Aprovecha lo que ya sabes: ${skillMatches.map((s) => SKILL_LABELS[s].toLowerCase()).join(", ")}.`
      );
    }

    if (tpl.budgets.includes(input.budget)) {
      score += 3;
      reasons.push("Encaja con tu presupuesto.");
    }

    if (tpl.times.includes(input.time)) {
      score += 1;
      reasons.push("Cabe en el tiempo que tienes disponible.");
    }

    // Pequeño bias hacia bajo presupuesto
    if (tpl.budgets[0] === "<500") {
      score += 0.5;
    }

    return { template: tpl, score, reasons };
  });

  return scored
    .filter((s) => s.score > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, limit);
}

export function getAllPassions(): BrainstormPassion[] {
  return Object.keys(PASSION_LABELS) as BrainstormPassion[];
}

export function getAllSkills(): BrainstormSkill[] {
  return Object.keys(SKILL_LABELS) as BrainstormSkill[];
}

export function getAllBudgets(): BrainstormBudget[] {
  return Object.keys(BUDGET_LABELS) as BrainstormBudget[];
}

export function getAllTimes(): BrainstormTime[] {
  return Object.keys(TIME_LABELS) as BrainstormTime[];
}
