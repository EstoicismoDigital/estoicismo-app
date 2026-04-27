/**
 * 30 ejercicios estoicos clásicos — uno por día del mes,
 * determinístico por fecha. Inspirados en Marco Aurelio,
 * Séneca, Epicteto + reinterpretaciones modernas (Holiday,
 * Pigliucci).
 */

export type StoicExercise = {
  id: number;
  title: string;
  description: string;
  practice: string;
  source?: string;
};

export const STOIC_EXERCISES: StoicExercise[] = [
  {
    id: 1,
    title: "Premeditatio malorum",
    description: "Imagina lo peor que puede pasar hoy. No para temerlo — para descubrir que ya tienes la fuerza.",
    practice: "Antes de empezar el día, dedica 2 minutos a visualizar 1-3 cosas que podrían salir mal. Pregúntate cómo responderías. Sentirás menos ansiedad, no más.",
    source: "Séneca",
  },
  {
    id: 2,
    title: "Vista desde arriba",
    description: "Imagina tu vida desde el espacio. Tu casa, tu ciudad, el continente, el planeta. ¿Qué importa de verdad?",
    practice: "Cierra los ojos. Sube en zoom-out hasta ver la Tierra. ¿Qué de tu lista de hoy aún parece urgente?",
    source: "Marco Aurelio",
  },
  {
    id: 3,
    title: "Memento mori",
    description: "Recuerda que vas a morir. No es macabro: es el filtro que te dice qué importa.",
    practice: "Una vez al día — al despertar o al dormir — di en voz baja: 'puedo morir hoy'. Observa qué cambia.",
    source: "Marco Aurelio · Stoa",
  },
  {
    id: 4,
    title: "Dicotomía del control",
    description: "Hay cosas que dependen de ti y cosas que no. La paz vive en distinguirlas.",
    practice: "Lista 3 preocupaciones de hoy. Junto a cada una escribe: ¿depende de mí o no? Suelta lo que no.",
    source: "Epicteto",
  },
  {
    id: 5,
    title: "Amor fati",
    description: "No deseas que las cosas sean diferentes. Las amas como son — incluso lo difícil.",
    practice: "Frente a algo que te molestó hoy, pregunta: ¿qué me está enseñando? Acéptalo como combustible.",
    source: "Marco Aurelio · Nietzsche",
  },
  {
    id: 6,
    title: "Negative visualization",
    description: "Imagina que pierdes algo o alguien que amas. Vuelve a apreciarlo.",
    practice: "Pensa en una persona o cosa que das por sentada. Visualiza no tenerla. Ahora vuelve al presente y agradécelo.",
    source: "Séneca",
  },
  {
    id: 7,
    title: "Las 4 virtudes",
    description: "Sabiduría · Justicia · Coraje · Templanza. Las 4 brújulas para cada decisión.",
    practice: "En tu próxima decisión difícil del día, pregúntate: ¿qué haría una persona con sabiduría? ¿con justicia? ¿con coraje? ¿con templanza?",
    source: "Stoa",
  },
  {
    id: 8,
    title: "Examen nocturno",
    description: "Antes de dormir, repasa el día con honestidad. Sin culpa — sólo aprendizaje.",
    practice: "3 preguntas: ¿Qué hice mal? ¿Qué hice bien? ¿Qué puedo mejorar mañana?",
    source: "Séneca",
  },
  {
    id: 9,
    title: "Reservación con cláusula",
    description: "Planea, pero acepta que el universo puede tener otros planes. 'Si nada lo impide…'",
    practice: "Cuando hagas un plan, agrega mentalmente 'si nada importante lo impide'. Reduce frustración cuando algo cambia.",
    source: "Stoa",
  },
  {
    id: 10,
    title: "El otro tiene razones",
    description: "Quien te ofendió tiene su propia historia. No la conoces. La compasión empieza ahí.",
    practice: "Pensando en alguien que te molesta, considera: ¿qué dolor o miedo lo lleva a actuar así?",
    source: "Marco Aurelio",
  },
  {
    id: 11,
    title: "Carga ligera",
    description: "Lleva sólo lo necesario hoy. Las opiniones, las preocupaciones, las posesiones — pesan.",
    practice: "Identifica una opinión, una preocupación o un objeto que cargas sin necesidad. Suéltalo conscientemente.",
    source: "Marco Aurelio",
  },
  {
    id: 12,
    title: "El obstáculo es el camino",
    description: "Lo que impide la acción se convierte en la acción. La piedra en el río la fortalece.",
    practice: "Identifica un obstáculo de tu día. ¿Cómo es exactamente lo que necesitas para crecer hoy?",
    source: "Marco Aurelio · Holiday",
  },
  {
    id: 13,
    title: "Vivir según la naturaleza",
    description: "Vives bien cuando tus actos coinciden con tu razón y tu propósito.",
    practice: "¿En qué momento de hoy te traicionaste — actuando contra lo que sabes que es correcto? Aprende, no te castigues.",
    source: "Stoa",
  },
  {
    id: 14,
    title: "Sólo el presente es tuyo",
    description: "El pasado se fue, el futuro no existe. Sólo este momento es tuyo.",
    practice: "Cuando tu mente se vaya al pasado o al futuro, regrésala suavemente al ahora. ¿Qué oyes? ¿Qué sientes?",
    source: "Marco Aurelio",
  },
  {
    id: 15,
    title: "Agere contra",
    description: "Para fortalecer una virtud, practica lo opuesto a tu inclinación. ¿Avaro? Da. ¿Tímido? Habla.",
    practice: "Elige una pequeña incomodidad voluntaria hoy. Subir escaleras en vez de escalera. Decir hola al desconocido. Ducha fría.",
    source: "Tradición jesuita / Stoa",
  },
  {
    id: 16,
    title: "Obstáculo a la felicidad",
    description: "No es lo que te pasa, es lo que crees que te pasa. La opinión es la herida.",
    practice: "Frente a algo que te molesta, pregunta: ¿es la situación o mi juicio sobre ella? Suelta el juicio por 5 minutos.",
    source: "Epicteto",
  },
  {
    id: 17,
    title: "El sabio no se queja",
    description: "La queja te roba la energía que necesitas para cambiar la situación.",
    practice: "Hoy, observa cuántas veces te quejas (en voz alta o mental). Para cada queja, sustituye con: ¿qué puedo hacer YO?",
    source: "Epicteto",
  },
  {
    id: 18,
    title: "Tu yo de los 80",
    description: "¿De qué se sentirá orgulloso tu yo viejo? ¿De qué se arrepentirá?",
    practice: "Imagina a tu yo de 80 años mirándote hoy. ¿Qué te dice? ¿Qué te pide cambiar?",
    source: "Reinterpretación moderna",
  },
  {
    id: 19,
    title: "Practica la pobreza",
    description: "De vez en cuando, vive con lo mínimo. Descubrirás que es suficiente.",
    practice: "Hoy, prescinde voluntariamente de algo que das por seguro: café, pantalla, comodidad. Una sola cosa, un solo día.",
    source: "Séneca",
  },
  {
    id: 20,
    title: "Hospitalidad con la incomodidad",
    description: "El malestar es información. No huyas de él — siéntalo a la mesa.",
    practice: "Cuando algo te incomode hoy, no lo escapes. Pregunta: ¿qué viene a decirme?",
    source: "Stoa contemporánea",
  },
  {
    id: 21,
    title: "Lo bueno escondido",
    description: "Casi siempre hay algo de bueno en lo que parece terrible. Encuéntralo.",
    practice: "En el peor evento de tu día, identifica 1 cosa buena escondida. No te mientas — busca de verdad.",
    source: "Marco Aurelio",
  },
  {
    id: 22,
    title: "Tu próxima respiración",
    description: "Cuando todo es demasiado, vuelve a la próxima respiración. Es lo único cierto.",
    practice: "Pausa 60 segundos. Cuenta 10 respiraciones lentas. Después regresa al mundo.",
    source: "Stoa + tradición contemplativa",
  },
  {
    id: 23,
    title: "El simulacro",
    description: "Vive la mañana como si fuera la última.",
    practice: "Por una hora hoy, actúa como si fuera tu última hora consciente. ¿A quién llamas? ¿Qué dejas dicho?",
    source: "Memento mori práctica",
  },
  {
    id: 24,
    title: "Cuestiona el deseo",
    description: "Lo que pides, ¿es lo que necesitas? El deseo a menudo es ruido.",
    practice: "Por cada cosa que quieras hoy, pregunta: ¿esto me trae más paz, o más ansiedad?",
    source: "Epicteto",
  },
  {
    id: 25,
    title: "Antifragilidad",
    description: "Lo que no te mata te puede fortalecer — si lo entrenas.",
    practice: "Identifica un golpe que recibiste recientemente. ¿Qué músculo creció? Si no, ¿cuál podría crecer?",
    source: "Taleb · espíritu estoico",
  },
  {
    id: 26,
    title: "Servicio como medicina",
    description: "El antídoto al ego es servir. Servir desinfla, calma, dignifica.",
    practice: "Haz una cosa hoy SÓLO porque ayuda a otro, sin esperar nada. Observa cómo te sientes después.",
    source: "Stoa social",
  },
  {
    id: 27,
    title: "El círculo de Hierocles",
    description: "Tu identidad va expandiéndose: tú → familia → vecinos → ciudad → humanidad → cosmos. Practica los círculos exteriores.",
    practice: "Hoy, haz algo que beneficie a alguien que no conoces. Una donación, una nota, una ayuda anónima.",
    source: "Hierocles",
  },
  {
    id: 28,
    title: "La voz interior",
    description: "Mucho de lo que oyes en tu cabeza no es la verdad — es entrenamiento. Cuestiona.",
    practice: "Cuando una voz te diga 'no puedes' o 'no vales', pregunta: ¿de quién oí esto primero? ¿Sigue siendo cierto?",
    source: "Stoa + psicología cognitiva",
  },
  {
    id: 29,
    title: "Acción virtuosa antes que sentimiento",
    description: "No esperas a sentirte motivado para actuar. La acción crea el sentimiento.",
    practice: "Una cosa que sabes que debes hacer y no quieres — hazla en los próximos 5 minutos. La motivación viene después.",
    source: "Stoa moderna",
  },
  {
    id: 30,
    title: "El día completo",
    description: "Si vivieras hoy plenamente — ni un minuto desperdiciado en ruido — ¿cómo se vería?",
    practice: "Diseña los próximos 6 horas con intención. ¿Qué quitas? ¿Qué priorizas? Vive ese plan.",
    source: "Síntesis estoica",
  },
];

/**
 * Ejercicio del día — determinístico por día del año mod 30.
 */
export function getStoicExerciseOfDay(date: Date = new Date()): StoicExercise {
  const start = new Date(date.getFullYear(), 0, 0);
  const diff =
    date.getTime() -
    start.getTime() +
    (start.getTimezoneOffset() - date.getTimezoneOffset()) * 60 * 1000;
  const dayOfYear = Math.floor(diff / (1000 * 60 * 60 * 24));
  return STOIC_EXERCISES[(dayOfYear - 1 + STOIC_EXERCISES.length) % STOIC_EXERCISES.length];
}
