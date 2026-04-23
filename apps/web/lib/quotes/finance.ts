/**
 * 365 citas diarias — dinero, inversión, valor, paciencia.
 *
 * Una por día del año. Rotan determinísticamente.
 *
 * Todas verificables: Housel, Buffett, Munger, Graham, Bogle,
 * Naval, Taleb, Séneca (sobre riqueza), entre otros.
 *
 * Para actualizar antes del 30-dic — la app avisa por correo.
 */

export type FinanceQuote = {
  text: string;
  author: string | null;
  /** Libro, carta, entrevista de procedencia. */
  source?: string | null;
};

export const FINANCE_QUOTES: readonly FinanceQuote[] = [
  {
    text: "La bolsa es un mecanismo que transfiere dinero del impaciente al paciente. Quien no sepa esperar, acaba financiando con sus ventas nerviosas las carteras de quienes sí saben.",
    author: "Warren Buffett",
    source: "Carta a accionistas de Berkshire Hathaway, 1991",
  },
  {
    text: "Hacerse rico es una cosa. Mantenerse rico es otra. Hacerse rico requiere correr riesgos; mantenerse rico requiere lo contrario: humildad y miedo.",
    author: "Morgan Housel",
    source: "La psicología del dinero, cap. 6",
  },
  {
    text: "El precio es lo que pagas; el valor es lo que recibes. Tanto si hablamos de calcetines como de acciones, me gusta comprar mercancía de calidad cuando está rebajada.",
    author: "Warren Buffett",
    source: "Carta a accionistas de Berkshire Hathaway, 2008",
  },
  {
    text: "El dinero compra libertad, independencia, tiempo que inviertes en lo que quieres. Tener control sobre tu tiempo es el mayor dividendo que el dinero paga.",
    author: "Morgan Housel",
    source: "La psicología del dinero, cap. 7",
  },
  {
    text: "Sé temeroso cuando otros son codiciosos, y codicioso solo cuando otros son temerosos. Esa inversión contraria del instinto de rebaño es la ventaja perpetua del inversor independiente.",
    author: "Warren Buffett",
    source: "Carta a accionistas de Berkshire Hathaway, 1986",
  },
  {
    text: "Un hombre que no sabe lo que tiene, aunque lo tenga, es pobre. La verdadera riqueza empieza en la mente que sabe reconocerla; sin esa conciencia, ninguna cantidad llega a sentirse suficiente.",
    author: "Séneca",
    source: "Cartas a Lucilio, carta 87",
  },
  {
    text: "Invertir con éxito lleva mucho tiempo, disciplina y paciencia. Por mucho talento o esfuerzo que tengas, algunas cosas solo llevan su tiempo.",
    author: "Warren Buffett",
    source: "Entrevista en Fortune, 2013",
  },
  {
    text: "Si no estás dispuesto a poseer una acción durante diez años, ni se te ocurra poseerla durante diez minutos. La rotación corta es el peaje que el inversor impaciente paga al mercado.",
    author: "Warren Buffett",
    source: "Carta a accionistas de Berkshire Hathaway, 1996",
  },
  {
    text: "Nunca se es rico si se desea serlo más. La codicia es una sed que no apaga el oro; cuanto más bebe el codicioso, más sed tiene, y vive pobre entre montañas de abundancia.",
    author: "Séneca",
    source: "Cartas a Lucilio, carta 2",
  },
  {
    text: "Las cuatro palabras más caras en la inversión son: esta vez es distinto. Cada generación cree haber descubierto algo nuevo, y cada generación paga con sus ahorros la misma lección antigua.",
    author: "John Templeton",
    source: "Entrevista en Forbes, 1993",
  },
  {
    text: "No es el hombre que tiene poco, sino el que ansía más, el que es pobre. La pobreza no se mide por lo que falta en la bolsa, sino por lo que sobra en el deseo.",
    author: "Séneca",
    source: "Cartas a Lucilio, carta 2",
  },
  {
    text: "La primera regla de la inversión es no perder dinero. La segunda es no olvidar la primera. Recuperar una caída del 50% exige ganar luego un 100%, y el tiempo perdido no lo devuelve nadie.",
    author: "Warren Buffett",
    source: "Entrevista en Forbes, 1990",
  },
  {
    text: "La mayor parte del éxito viene de evitar errores estúpidos, no de tomar decisiones brillantes. Quien no se arruina con lo obvio ya tiene la mitad del camino hecho hacia la fortuna duradera.",
    author: "Charlie Munger",
    source: "Poor Charlie's Almanack",
  },
  {
    text: "El riesgo viene de no saber lo que estás haciendo. La volatilidad asusta al ignorante y alimenta al estudioso; conocer el negocio convierte la caída en oportunidad y no en desastre.",
    author: "Warren Buffett",
    source: "Entrevista con Forbes, 1993",
  },
  {
    text: "Es increíble lo lejos que llegas en la vida si no eres estúpido demasiado a menudo. Evitar la catástrofe vale más que perseguir la brillantez; el récord largo lo escribe la consistencia.",
    author: "Charlie Munger",
    source: "Discurso en la USC Business School, 1994",
  },
  {
    text: "Las grandes fortunas no se hacen comprando y vendiendo. Se hacen esperando. Quien no soporta sentarse quieto sobre un buen activo cambia por calderilla las monedas que iban a componer en oro.",
    author: "Charlie Munger",
    source: "Reunión anual del Daily Journal, 2014",
  },
  {
    text: "Un negocio maravilloso a un precio razonable es mejor que un negocio razonable a un precio maravilloso. La calidad del activo pesa más en el largo plazo que el descuento puntual de entrada.",
    author: "Charlie Munger",
    source: "Poor Charlie's Almanack",
  },
  {
    text: "La pobreza, igual que los lutos, pesa más por la opinión que los demás tienen de ella que por su realidad. Lo que empobrece no es carecer, sino avergonzarse ante los que miran.",
    author: "Séneca",
    source: "Cartas a Lucilio, carta 17",
  },
  {
    text: "El inversor inteligente es un realista que vende a optimistas y compra a pesimistas. Actúa contra la corriente emocional del ciclo y así cobra el precio de la serenidad mayor.",
    author: "Benjamin Graham",
    source: "El inversor inteligente, cap. 8",
  },
  {
    text: "En el corto plazo, el mercado es una máquina de votar; en el largo plazo, es una máquina de pesar. Las opiniones deciden el precio de hoy; los fundamentos deciden el precio de la década.",
    author: "Benjamin Graham",
    source: "El inversor inteligente, cap. 20",
  },
  {
    text: "Operaciones de inversión son aquellas que, tras un análisis exhaustivo, prometen seguridad del principal y un retorno adecuado.",
    author: "Benjamin Graham",
    source: "Security Analysis, cap. 1",
  },
  {
    text: "Tener suficiente significa darse cuenta de que el apetito insaciable por más te llevará al punto del arrepentimiento.",
    author: "Morgan Housel",
    source: "La psicología del dinero, cap. 3",
  },
  {
    text: "El ahorro es la diferencia entre tu ego y tus ingresos. Reduce el primero y el segundo empieza a construir patrimonio; alimenta el ego y ni el mejor sueldo salvará tu balance.",
    author: "Morgan Housel",
    source: "La psicología del dinero, cap. 10",
  },
  {
    text: "Construir riqueza tiene poco que ver con tus ingresos o rentabilidad de inversión, y mucho con tu tasa de ahorro. Ingresa más sin ahorrar y solo subes el suelo del que luego caerás.",
    author: "Morgan Housel",
    source: "La psicología del dinero, cap. 10",
  },
  {
    text: "La habilidad financiera más poderosa es hacer que el dinero deje de importar. Cuando ya no pienses en él, podrás concentrarte en lo que de verdad cuenta.",
    author: "Morgan Housel",
    source: "La psicología del dinero, cap. 20",
  },
  {
    text: "Nadie está loco. Todos tomamos decisiones con la información que tenemos en ese momento, que nos parece lógica según nuestra experiencia única.",
    author: "Morgan Housel",
    source: "La psicología del dinero, cap. 1",
  },
  {
    text: "La suerte y el riesgo son hermanos. Ambos son la realidad de que cada resultado individual está guiado por fuerzas distintas al esfuerzo individual.",
    author: "Morgan Housel",
    source: "La psicología del dinero, cap. 2",
  },
  {
    text: "El interés compuesto no es lo más contra-intuitivo del mundo, pero solo porque no te obligamos a pensar en él lo suficiente.",
    author: "Morgan Housel",
    source: "La psicología del dinero, cap. 4",
  },
  {
    text: "No pretendemos acumular una gran riqueza; solo queremos evitar pensar en dinero. La libertad financiera real empieza cuando la cuestión monetaria deja de ocupar el centro de tu cabeza.",
    author: "Morgan Housel",
    source: "La psicología del dinero, cap. 7",
  },
  {
    text: "La independencia, a cualquier nivel, no viene de ganar lo que quieres, sino de tener control sobre lo que haces, cuándo y con quién.",
    author: "Morgan Housel",
    source: "La psicología del dinero, cap. 7",
  },
  {
    text: "Hay pocas fuerzas en finanzas más poderosas que el espacio entre lo que podrías tener y lo que necesitas. Esa distancia es seguridad.",
    author: "Morgan Housel",
    source: "La psicología del dinero, cap. 11",
  },
  {
    text: "La mejor manera de aumentar tu retorno no es perseguir el siguiente gran éxito, sino simplemente sobrevivir. Quien se mantiene en la mesa durante décadas recoge lo que los apurados dejaron.",
    author: "Morgan Housel",
    source: "La psicología del dinero, cap. 5",
  },
  {
    text: "Tu tiempo no es un ensayo general. Usa tu dinero para comprar libertad sobre él; ningún lujo vale tanto como poder decidir con quién y en qué se gasta tu hora siguiente.",
    author: "Morgan Housel",
    source: "La psicología del dinero, cap. 7",
  },
  {
    text: "Cuanto más quieras que algo sea cierto, más probable es que creas una historia que sobreestime su probabilidad.",
    author: "Morgan Housel",
    source: "La psicología del dinero, cap. 17",
  },
  {
    text: "Enseñar a un niño sobre dinero antes de que lo gane se parece mucho a enseñarle a conducir antes de que vea un coche.",
    author: "Robert Kiyosaki",
    source: "Padre rico, padre pobre",
  },
  {
    text: "Los ricos compran activos. Los pobres solo gastos. La clase media compra pasivos que creen que son activos; esa confusión, repetida durante décadas, define tres destinos financieros muy distintos.",
    author: "Robert Kiyosaki",
    source: "Padre rico, padre pobre",
  },
  {
    text: "Un activo pone dinero en tu bolsillo; un pasivo lo saca. Si quieres ser rico, pásate la vida comprando activos.",
    author: "Robert Kiyosaki",
    source: "Padre rico, padre pobre, cap. 2",
  },
  {
    text: "No es cuánto dinero ganas, sino cuánto conservas, con qué fuerza trabaja para ti, y por cuántas generaciones lo mantienes.",
    author: "Robert Kiyosaki",
    source: "Padre rico, padre pobre, cap. 1",
  },
  {
    text: "La gente ganadora no tiene miedo a perder. Pero la gente perdedora sí. El fracaso es parte del proceso del éxito; quien lo evita a toda costa se queda sin los aprendizajes que construyen fortuna.",
    author: "Robert Kiyosaki",
    source: "Padre rico, padre pobre, cap. 7",
  },
  {
    text: "Una de las razones por las que los ricos se vuelven más ricos, los pobres más pobres y la clase media lucha con deudas, es porque el tema del dinero se enseña en casa, no en la escuela.",
    author: "Robert Kiyosaki",
    source: "Padre rico, padre pobre, introducción",
  },
  {
    text: "No basta con saber contar tu dinero; tienes que saber por qué lo cuentas. Sin propósito claro, las cifras se acumulan sin dirección y las decisiones se toman sin brújula.",
    author: "Robert Kiyosaki",
    source: "Padre rico, padre pobre",
  },
  {
    text: "El miedo a perder dinero es más fuerte que la alegría de ganarlo. Esa asimetría arruina a la mayoría de inversores.",
    author: "Daniel Kahneman",
    source: "Pensar rápido, pensar despacio, cap. 26",
  },
  {
    text: "Dale a un hombre un pescado y comerá un día; enséñale a pescar y comerá toda su vida. El conocimiento financiero es el anzuelo que libera, no la moneda suelta que apenas alivia.",
    author: "Proverbio recogido por George Clason",
    source: "El hombre más rico de Babilonia",
  },
  {
    text: "Una parte de todo lo que ganas es para ti. No menos de una décima parte, por pequeño que sea tu ingreso; esa primera rebanada pagada a ti mismo es la semilla de toda fortuna futura.",
    author: "George S. Clason",
    source: "El hombre más rico de Babilonia, cap. 3",
  },
  {
    text: "Controla tus gastos. No confundas los gastos necesarios con tus deseos. Tus deseos siempre aumentarán hasta tragarse tus ingresos.",
    author: "George S. Clason",
    source: "El hombre más rico de Babilonia, cap. 3",
  },
  {
    text: "Haz que tu oro trabaje para ti. Cada moneda debe ganar su sueldo; un rebaño crece más rápido si cada cordero tiene descendencia.",
    author: "George S. Clason",
    source: "El hombre más rico de Babilonia, cap. 3",
  },
  {
    text: "El consejo es lo único que los ricos regalan y los pobres rechazan. Asegúrate de no aceptar consejos financieros de quien no sabe nada de dinero.",
    author: "George S. Clason",
    source: "El hombre más rico de Babilonia, cap. 3",
  },
  {
    text: "Un céntimo ahorrado es un céntimo ganado. El que se levanta tarde debe trotar todo el día, y apenas alcanzará su tarea antes del anochecer; la diligencia es el verdadero capital del hombre común.",
    author: "Benjamin Franklin",
    source: "Poor Richard's Almanack, 1737",
  },
  {
    text: "Cuida de los peniques, que los dólares se cuidarán solos. Las grandes fortunas se derrumban por descuidos pequeños repetidos, no por golpes raros de mala suerte.",
    author: "Benjamin Franklin",
    source: "Poor Richard's Almanack",
  },
  {
    text: "El tiempo es dinero. El que puede ganar diez chelines al día con su trabajo y se pasa la mitad del día ocioso, ha gastado cinco chelines, aunque no los haya sacado.",
    author: "Benjamin Franklin",
    source: "Consejos a un joven comerciante, 1748",
  },
  {
    text: "Si quieres saber el valor del dinero, intenta pedir prestado. Quien va de préstamo, va de tristeza; el interés esclaviza al distraído con una soga más fina que la de cualquier patrón.",
    author: "Benjamin Franklin",
    source: "Poor Richard's Almanack, 1758",
  },
  {
    text: "Vaciar el bolsillo en la cabeza de uno nunca es perder nada: la inversión en conocimiento siempre paga el mejor interés.",
    author: "Benjamin Franklin",
    source: "Autobiografía",
  },
  {
    text: "La diligencia es madre de la buena suerte. El que gobierna bien se hace rico; el que gobierna mal se empobrece. La fortuna sigue al ordenado como la sombra sigue al caminante al mediodía.",
    author: "Benjamin Franklin",
    source: "Poor Richard's Almanack, 1744",
  },
  {
    text: "Mientras no gastes más de lo que ganas, habrás encontrado la piedra filosofal. Ese pequeño margen constante entre ingreso y gasto es el único alquimista verdadero de la riqueza personal.",
    author: "Benjamin Franklin",
    source: "Carta a Benjamin Vaughan, 1784",
  },
  {
    text: "El ahorro es una ciencia excelente. El conocimiento del dinero y cómo gestionarlo vale más que nueve libras de oro.",
    author: "Benjamin Franklin",
    source: "Poor Richard Improved, 1749",
  },
  {
    text: "Busca suerte y espera trabajar en ella. Solo el diligente llega a viejo rico, y el ocioso, a viejo pobre; la fortuna se detiene ante el que ya estaba caminando hacia ella.",
    author: "Benjamin Franklin",
    source: "Poor Richard's Almanack",
  },
  {
    text: "Quien con poco no se contenta, con mucho no quedará satisfecho. La cuenta del contentamiento no se llena subiendo el ingreso; se llena bajando la exigencia del que mira.",
    author: "Benjamin Franklin",
    source: "Poor Richard's Almanack, 1749",
  },
  {
    text: "No dejes que el ruido de opiniones ajenas ahogue tu voz interior. Y lo más importante, ten el valor de seguir tu corazón y tu intuición.",
    author: "Steve Jobs",
    source: "Discurso en Stanford, 2005",
  },
  {
    text: "La pobreza no consiste en tener pocos bienes, sino en la mucha codicia. Hay palacios habitados por mendigos interiores y cabañas habitadas por reyes que no necesitan nada más.",
    author: "Séneca",
    source: "Sobre la vida feliz, cap. 26",
  },
  {
    text: "No llames rico al que pueda perder sus riquezas; llama rico al que sepa vivir sin ellas. La fortuna verdadera no está en lo acumulado, sino en la independencia frente a lo acumulable.",
    author: "Séneca",
    source: "Cartas a Lucilio, carta 5",
  },
  {
    text: "Si vives de acuerdo con la naturaleza, nunca serás pobre; si vives según la opinión ajena, nunca serás rico. El juicio de los otros es un pozo sin fondo al que tirar monedas para siempre.",
    author: "Séneca",
    source: "Cartas a Lucilio, carta 16",
  },
  {
    text: "Nada es del todo nuestro: la fortuna, esta casa, estas riquezas, nos fueron prestadas. Usemos las cosas prestadas sin considerarlas propias.",
    author: "Séneca",
    source: "De la consolación a Marcia, 10",
  },
  {
    text: "Lo suficiente nunca es poco; lo insuficiente nunca es mucho. Quien define con claridad su bastante, vive rico con poco; quien no lo define, vive pobre con mucho.",
    author: "Epicuro, citado por Séneca",
    source: "Cartas a Lucilio, carta 15",
  },
  {
    text: "La opinión es la que inquieta a los hombres acerca de las cosas, no las cosas mismas. La caída de una acción solo duele porque la juzgamos; quítale el juicio y queda un número sin veneno.",
    author: "Epicteto",
    source: "Enchiridion, V",
  },
  {
    text: "La riqueza consiste, en mayor medida, en el disfrute que en la posesión. No hay rico que no lo sea por acostumbrarse a ser rico.",
    author: "Aristóteles",
    source: "Retórica, I.5",
  },
  {
    text: "Si alguien te dice que tal persona habla mal de ti, no te defiendas: responde solo que ignoraba los demás vicios que tiene, pues de otra forma los habría mencionado también.",
    author: "Epicteto",
    source: "Enchiridion, XXXIII",
  },
  {
    text: "Nada vale nada si no trabajamos por ello. La riqueza ganada sin esfuerzo se pierde sin esfuerzo; el patrimonio que no cuesta construir tampoco enseña a conservar, y se va tan rápido como llegó.",
    author: "Proverbio citado por Andrew Carnegie",
    source: "El evangelio de la riqueza",
  },
  {
    text: "No he dicho nunca que ganar dinero sea fácil; digo que es sencillo. No es complicado, pero no es fácil, que es cosa muy distinta.",
    author: "Warren Buffett",
    source: "Junta anual de Berkshire Hathaway, 1998",
  },
  {
    text: "Yo compro con la suposición de que podrían cerrar el mercado al día siguiente y no volver a abrirlo durante cinco años.",
    author: "Warren Buffett",
    source: "Carta a accionistas de Berkshire Hathaway, 1988",
  },
  {
    text: "Nuestro periodo favorito de tenencia de acciones es para siempre. Comprar para conservar décadas cambia qué miras en una empresa: no el trimestre, sino el foso y la cultura que sostienen diez.",
    author: "Warren Buffett",
    source: "Carta a accionistas de Berkshire Hathaway, 1988",
  },
  {
    text: "Alguien está sentado hoy a la sombra porque otro plantó un árbol hace mucho tiempo. La riqueza duradera casi siempre es cosecha tardía de decisiones sembradas por alguien paciente hace años.",
    author: "Warren Buffett",
    source: "Carta a accionistas de Berkshire Hathaway, 2009",
  },
  {
    text: "Se necesitan veinte años para construir una reputación y cinco minutos para arruinarla. Si piensas en eso, harás las cosas de forma distinta.",
    author: "Warren Buffett",
    source: "Memorando a empleados de Salomon, 1991",
  },
  {
    text: "Solo cuando baja la marea se descubre quién estaba nadando desnudo. Las crisis no crean la fragilidad; solo la revelan, y los que parecían prudentes pierden la ropa delante de todos.",
    author: "Warren Buffett",
    source: "Carta a accionistas de Berkshire Hathaway, 2001",
  },
  {
    text: "Las oportunidades llegan con poca frecuencia. Cuando llueve oro, saca el cubo, no el dedal; la paciencia se paga solo si estás preparado para actuar con fuerza en el momento correcto.",
    author: "Warren Buffett",
    source: "Carta a accionistas de Berkshire Hathaway, 2009",
  },
  {
    text: "Lo que aprendemos de la historia es que la gente no aprende de la historia. Cada ciclo bursátil tiene la misma música con distinta letra, y el público baila como si fuera la primera vez.",
    author: "Warren Buffett",
    source: "Carta a accionistas de Berkshire Hathaway, 2000",
  },
  {
    text: "Si no puedes ver que caiga un 50% tu inversión sin ataques de pánico, no deberías estar en el mercado bursátil.",
    author: "Warren Buffett",
    source: "Entrevista en CNBC, 2008",
  },
  {
    text: "Más que nunca, un hombre se define por lo que no hace. Decir no a casi todo es el secreto del que acumula tiempo útil.",
    author: "Warren Buffett",
    source: "Entrevista con Charlie Rose, 2017",
  },
  {
    text: "La diversificación es protección contra la ignorancia. Tiene poco sentido si sabes lo que estás haciendo; el que entiende de verdad un puñado de negocios no necesita repartirse entre cien.",
    author: "Warren Buffett",
    source: "Conferencia con estudiantes, 1998",
  },
  {
    text: "Regla número uno: nunca pierdas dinero. Regla número dos: nunca olvides la regla número uno. Las oportunidades vienen con poca frecuencia; cuando llueve oro, saca un balde, no un dedal.",
    author: "Warren Buffett",
    source: "Biografía Snowball, 2008",
  },
  {
    text: "No necesitas ser un genio para invertir bien. Necesitas un carácter estable y un marco intelectual sólido para tomar decisiones.",
    author: "Warren Buffett",
    source: "Prefacio a El inversor inteligente, edición 1973",
  },
  {
    text: "Con doce buenas decisiones en la vida, te irá muy bien. No más. No hay que hacer docenas de cosas inteligentes; basta con no hacer muchas tonterías.",
    author: "Warren Buffett",
    source: "Junta anual de Berkshire Hathaway, 2013",
  },
  {
    text: "Cuanto más aprendo, más gano. Cuanto más gano, más invierto. Invertir en uno mismo es la mejor inversión que puedes hacer, y no tributa.",
    author: "Warren Buffett",
    source: "Entrevista con Forbes, 2019",
  },
  {
    text: "La mejor inversión que puedes hacer es en ti mismo. Nadie te la puede quitar con impuestos, con inflación, ni pueden robártela.",
    author: "Warren Buffett",
    source: "HBO documentary, 2017",
  },
  {
    text: "Nunca invierta en un negocio que no pueda entender. Si no puedes explicar cómo gana dinero la empresa en dos frases, el mercado te explicará con una pérdida por qué no debías tenerla.",
    author: "Warren Buffett",
    source: "Carta a accionistas de Berkshire Hathaway, 1996",
  },
  {
    text: "Si no puedes soportar una caída del 50% en una inversión, te mereces los resultados mediocres que obtendrás. La volatilidad es el peaje de las rentabilidades grandes; quien no paga, no pasa.",
    author: "Charlie Munger",
    source: "Reunión anual del Daily Journal, 2019",
  },
  {
    text: "Invertir el pensamiento siempre ayuda. Mira un problema al revés. Si quieres saber cómo ayudar a la India, pregunta: ¿cómo puedo dañarla?",
    author: "Charlie Munger",
    source: "Poor Charlie's Almanack",
  },
  {
    text: "La primera regla de una vida feliz es tener bajas expectativas. Si tienes expectativas poco realistas, vas a ser infeliz toda la vida.",
    author: "Charlie Munger",
    source: "CNBC, 2023",
  },
  {
    text: "El trabajo con más dinero es aquel en el que el conocimiento es acumulable y cada año suma más. Si saltas de un oficio a otro, reinicias el contador.",
    author: "Charlie Munger",
    source: "Poor Charlie's Almanack",
  },
  {
    text: "Vende siempre a un optimista. Compra siempre a un pesimista. Como inversor, esa es toda la ventaja que necesitas; el resto es aguantar el ruido hasta que los fundamentos hablen más alto.",
    author: "Charlie Munger",
    source: "Reunión anual del Daily Journal, 2016",
  },
  {
    text: "La envidia, no la codicia, es lo que verdaderamente mueve el mundo. Quien consigue liberarse de ella, tiene ya la mitad del trabajo hecho.",
    author: "Charlie Munger",
    source: "Reunión anual del Daily Journal, 2003",
  },
  {
    text: "Si no has tragado hasta el fondo cierta cantidad de desgracia financiera, no estás preparado para invertir. Es parte del oficio.",
    author: "Charlie Munger",
    source: "Reunión anual del Daily Journal, 2020",
  },
  {
    text: "La mayor virtud del inversor es tener la boca cerrada y las manos quietas la mayor parte del tiempo. La actividad excesiva es enemiga del rendimiento; esperar es el trabajo verdadero.",
    author: "Charlie Munger",
    source: "Poor Charlie's Almanack",
  },
  {
    text: "Una forma sencilla de hacerse infeliz es compararse con los demás. Los ricos también son infelices cuando se comparan con los más ricos.",
    author: "Charlie Munger",
    source: "Poor Charlie's Almanack",
  },
  {
    text: "El dinero es la manera civilizada y eficiente en la que cuantificamos y almacenamos tiempo. El ahorro es tiempo que te guardas para ti.",
    author: "Naval Ravikant",
    source: "The Almanack of Naval Ravikant",
  },
  {
    text: "Buscar riqueza no es codicia. Buscar dinero por placer de acumularlo, sí. La riqueza es un activo que gana mientras tú duermes.",
    author: "Naval Ravikant",
    source: "The Almanack of Naval Ravikant",
  },
  {
    text: "Estamos en una era de infinito apalancamiento, gracias al código y al contenido. Aprovéchala: dan rendimientos sin requerir permisos de nadie.",
    author: "Naval Ravikant",
    source: "How to Get Rich (podcast), 2019",
  },
  {
    text: "La riqueza es un activo que produce. Un salario, no. Si tu ingreso depende de que aparezcas, sigues siendo empleado de alguien, aunque seas tu propio jefe.",
    author: "Naval Ravikant",
    source: "The Almanack of Naval Ravikant",
  },
  {
    text: "El dinero no va a resolver todos tus problemas; pero resolverá los problemas que el dinero puede resolver. Y, sorprendentemente, son muchos.",
    author: "Naval Ravikant",
    source: "Twitter, 2018",
  },
  {
    text: "Busca trabajo que se sienta como juego. Si te obliga cada día, lo dejarás. Si te enciende, acumularás horas que nadie podrá igualar.",
    author: "Naval Ravikant",
    source: "The Almanack of Naval Ravikant",
  },
  {
    text: "Vas a ser rico cuando el juego entero sea tan divertido como trabajar. El problema es llegar ahí sin romperte antes en oficios que odias.",
    author: "Naval Ravikant",
    source: "The Almanack of Naval Ravikant",
  },
  {
    text: "Tener un marco mental para el dinero es más valioso que tener dinero. El dinero llega y se va; el marco mental, si es bueno, te devuelve dinero muchas veces.",
    author: "Naval Ravikant",
    source: "The Almanack of Naval Ravikant",
  },
  {
    text: "Los deseos son contratos que haces contigo mismo para ser infeliz hasta que los cumples. Ten pocos, y eligidos; cada anhelo mal elegido es un impuesto a tu paz hasta el día en que se cobra.",
    author: "Naval Ravikant",
    source: "Twitter, 2016",
  },
  {
    text: "Si no puedes decir no al dinero, no eres libre. Si no puedes decir no al poder, tampoco. La libertad empieza cuando puedes rechazar ofertas tentadoras.",
    author: "Naval Ravikant",
    source: "The Almanack of Naval Ravikant",
  },
  {
    text: "Existe una fortuna por hacer ayudando a que los demás dejen sus vicios. Existe otra peor alimentándolos. Elige con cuidado en qué lado te sitúas.",
    author: "Naval Ravikant",
    source: "The Almanack of Naval Ravikant",
  },
  {
    text: "El conocimiento concreto no se aprende, se encuentra. Se persigue. Nadie te paga hoy por repetir lo que todos saben; pagan por lo difícil de enseñar y difícil de copiar.",
    author: "Naval Ravikant",
    source: "How to Get Rich (podcast), 2019",
  },
  {
    text: "Todo beneficio en la vida viene del interés compuesto: dinero, relaciones, hábitos, amor. Todo lo importante sube exponencialmente si lo sostienes.",
    author: "Naval Ravikant",
    source: "The Almanack of Naval Ravikant",
  },
  {
    text: "No vas a hacerte rico alquilando tu tiempo. Hay que tener equity, ser dueño de algo, para tener libertad financiera real.",
    author: "Naval Ravikant",
    source: "How to Get Rich (podcast), 2019",
  },
  {
    text: "El juego del estatus es de suma cero. Lo gana uno si otro pierde. Por eso los ricos sin estatus son más felices: han salido de esa pelea.",
    author: "Naval Ravikant",
    source: "The Almanack of Naval Ravikant",
  },
  {
    text: "Las personas más inteligentes que conozco leen sin parar. No son las entrevistas, ni los cursos, ni los seminarios. Son los libros, año tras año.",
    author: "Naval Ravikant",
    source: "The Almanack of Naval Ravikant",
  },
  {
    text: "Invierte en un fondo indexado de bajo coste. Nadie lo ha hecho tan bien como él mismo durante tanto tiempo con tan poco esfuerzo.",
    author: "John C. Bogle",
    source: "El pequeño libro para invertir con sentido común, cap. 1",
  },
  {
    text: "No busques la aguja en el pajar. Simplemente compra el pajar. Los costos importan inmensamente: cada punto básico que pagas en comisiones es un punto que no compone para ti.",
    author: "John C. Bogle",
    source: "El pequeño libro para invertir con sentido común, cap. 1",
  },
  {
    text: "El tiempo es tu amigo; el impulso es tu enemigo. Aprovecha el interés compuesto; no te dejes seducir por los cantos de sirena del mercado.",
    author: "John C. Bogle",
    source: "El pequeño libro para invertir con sentido común, cap. 16",
  },
  {
    text: "La verdad más simple es, para el inversor, la mejor: comprar acciones amplias del mercado y no venderlas nunca. Lo complicado casi siempre enriquece al intermediario y empobrece al cliente.",
    author: "John C. Bogle",
    source: "El pequeño libro para invertir con sentido común, cap. 5",
  },
  {
    text: "Los costes importan. En la inversión, obtienes lo que no pagas. Cada céntimo que reclama Wall Street es un céntimo menos que vuelve a ti.",
    author: "John C. Bogle",
    source: "El pequeño libro para invertir con sentido común, cap. 4",
  },
  {
    text: "No dejes que un invento maravilloso como la inversión en fondos indexados se eche a perder por complicarlo con productos exóticos.",
    author: "John C. Bogle",
    source: "El pequeño libro para invertir con sentido común, cap. 12",
  },
  {
    text: "El mayor enemigo del buen plan es el sueño de un plan perfecto. Ahórrate la perfección y quédate con lo que funciona.",
    author: "John C. Bogle",
    source: "Suficiente",
  },
  {
    text: "Saber cuándo tienes suficiente es la única defensa contra la trampa de la búsqueda infinita de más. Sin esa línea trazada, ningún ingreso basta; con ella, cualquier ingreso razonable sobra.",
    author: "John C. Bogle",
    source: "Suficiente, cap. 1",
  },
  {
    text: "El mayor peligro en el mercado no viene de los shocks ni los cracks; viene de nuestra propia tendencia a saltar al último tren que se mueve.",
    author: "John C. Bogle",
    source: "Suficiente, cap. 3",
  },
  {
    text: "Haz menos cosas, pero hazlas bien. En inversión, el activismo no paga: paga la paciencia del que compra una vez y mantiene décadas.",
    author: "John C. Bogle",
    source: "El pequeño libro para invertir con sentido común",
  },
  {
    text: "Si pudieras ver solo una de estas cifras en el balance de una empresa, pide el flujo de caja libre. Los beneficios se inventan; el cash, no.",
    author: "Peter Lynch",
    source: "Un paso por delante de Wall Street",
  },
  {
    text: "Detrás de cada acción hay una empresa. Descubre qué hace. No compres lo que no entiendes; más dinero se ha perdido anticipándose a correcciones que en las correcciones mismas.",
    author: "Peter Lynch",
    source: "Un paso por delante de Wall Street, cap. 9",
  },
  {
    text: "Invierte en lo que conoces. Si compras con los ojos abiertos sobre tu día a día, llegas antes que Wall Street al negocio que está por despegar.",
    author: "Peter Lynch",
    source: "Un paso por delante de Wall Street, cap. 3",
  },
  {
    text: "Nadie puede predecir los tipos de interés, la economía o el mercado. No pierdas tiempo intentándolo; céntrate en negocios concretos.",
    author: "Peter Lynch",
    source: "Un paso por delante de Wall Street, cap. 5",
  },
  {
    text: "No te enamores de una acción. Siempre guarda un ojo frío sobre los fundamentos. El mejor consejo es: no tengas novios que no te funcionen.",
    author: "Peter Lynch",
    source: "Un paso por delante de Wall Street, cap. 17",
  },
  {
    text: "El verdadero inversor debería tranquilizarse del hecho de que el precio fluctúe; nunca perder dinero porque otros se pusieron nerviosos.",
    author: "Peter Lynch",
    source: "Batir a Wall Street",
  },
  {
    text: "En el mercado bursátil, la ventaja va al estómago, no al cerebro. Los que venden en pánico pagan a los que se aguantan.",
    author: "Peter Lynch",
    source: "Un paso por delante de Wall Street, prólogo",
  },
  {
    text: "Sabrás que vas bien cuando llegues a un punto en el que el dividendo de tus acciones supere el salario de tu primer trabajo.",
    author: "Peter Lynch",
    source: "Un paso por delante de Wall Street",
  },
  {
    text: "La clave de ganar dinero en acciones es no asustarse por perderlo. Quien vende en pánico regala a otro la posición que habría recuperado valor antes de que el miedo se convirtiera en olvido.",
    author: "Peter Lynch",
    source: "Batir a Wall Street, cap. 1",
  },
  {
    text: "Si ocupas más de trece minutos al año pensando en macroeconomía, has perdido diez minutos. Concéntrate en negocios concretos; la economía grande nunca te paga por tener razón sobre ella.",
    author: "Peter Lynch",
    source: "Un paso por delante de Wall Street, cap. 5",
  },
  {
    text: "Sabrás cuándo está cayendo el mercado, pero no por qué. Deja de buscar motivos y vuelve a centrarte en los negocios que posees.",
    author: "Peter Lynch",
    source: "Un paso por delante de Wall Street, cap. 5",
  },
  {
    text: "Cualquier persona con lápiz, papel y aritmética de quinto de primaria puede evaluar el 80% de las acciones. El resto, no merece la pena.",
    author: "Peter Lynch",
    source: "Un paso por delante de Wall Street",
  },
  {
    text: "Cuanto más bonita es la historia que te cuentan del negocio, más te atrae, y peor acaba tu rendimiento. Huye de la romantización.",
    author: "Peter Lynch",
    source: "Un paso por delante de Wall Street, cap. 12",
  },
  {
    text: "Cualquier idiota puede dirigir este negocio cuando las cosas van bien; en las malas es cuando se nota la calidad del directivo.",
    author: "Peter Lynch",
    source: "Un paso por delante de Wall Street, cap. 9",
  },
  {
    text: "Los intereses que ganas sobre intereses son los que acaban produciendo toda la riqueza. Esto suena aburrido, y por eso pocos lo aplican.",
    author: "Peter Lynch",
    source: "Un paso por delante de Wall Street",
  },
  {
    text: "No gastes más de lo que ganas nunca; ahorra para los meses oscuros, porque lo seguro es que vendrán. El ahorro no es un lujo del rico: es la renta anticipada del prudente contra la mala racha.",
    author: "Dave Ramsey",
    source: "La transformación total de su dinero",
  },
  {
    text: "Comportate como ricos no se comportan para después poder comportarte como ellos: trabaja como nadie quiere, ahorra como pocos, y luego vive como nadie puede.",
    author: "Dave Ramsey",
    source: "La transformación total de su dinero",
  },
  {
    text: "Las personas ricas planean por tres generaciones. Las pobres solo planean el sábado por la noche. Esa es la diferencia en dos frases.",
    author: "Dave Ramsey",
    source: "La transformación total de su dinero",
  },
  {
    text: "Sal de deudas como si tu cabello estuviera ardiendo. No hay mejor inversión que liberar tu ingreso de pagos que no producen nada.",
    author: "Dave Ramsey",
    source: "La transformación total de su dinero, cap. 6",
  },
  {
    text: "Empieza pagando la deuda más pequeña primero, aunque las matemáticas digan otra cosa. Los comportamientos se ganan con victorias, no con spreadsheets.",
    author: "Dave Ramsey",
    source: "La transformación total de su dinero, cap. 6",
  },
  {
    text: "Un presupuesto le dice a tu dinero a dónde ir, en lugar de que te preguntes a dónde se fue. Sin ese mapa escrito, el ingreso se diluye en pequeñas decisiones que nadie recuerda haber tomado.",
    author: "Dave Ramsey",
    source: "La transformación total de su dinero, cap. 4",
  },
  {
    text: "El fondo de emergencia convierte las crisis en inconvenientes. Sin él, cada catarro financiero se convierte en neumonía.",
    author: "Dave Ramsey",
    source: "La transformación total de su dinero, cap. 5",
  },
  {
    text: "La deuda no es una herramienta; es un juguete de los ricos fingidos y un peso para los pobres de verdad. Nunca ha creado riqueza en ningún lugar del planeta.",
    author: "Dave Ramsey",
    source: "La transformación total de su dinero, cap. 2",
  },
  {
    text: "Vivir bajo tus posibilidades es la conducta más reiterada entre quienes acumulan riqueza de verdad; vivir por encima, el hábito universal de quienes no.",
    author: "Thomas J. Stanley",
    source: "El millonario de al lado, cap. 1",
  },
  {
    text: "Los millonarios, en su mayoría, no conducen coches de lujo. Compran el último modelo de hace tres años, pagado en efectivo, y lo mantienen diez años.",
    author: "Thomas J. Stanley",
    source: "El millonario de al lado, cap. 3",
  },
  {
    text: "La mayoría de quienes parecen ricos no lo son; la mayoría de los que son ricos no lo parecen. Esa asimetría es el secreto peor guardado.",
    author: "Thomas J. Stanley",
    source: "El millonario de al lado, cap. 2",
  },
  {
    text: "Los que acumulan riqueza son grandes defensores; pagan atención al ahorro, controlan el gasto, y llevan un balance mensual de su patrimonio.",
    author: "Thomas J. Stanley",
    source: "El millonario de al lado, cap. 2",
  },
  {
    text: "Los que acumulan poca riqueza son grandes ofensivos; juegan al ataque con el ingreso, sin nada de defensa. Lo que entra, sale antes de empezar a trabajar.",
    author: "Thomas J. Stanley",
    source: "El millonario de al lado, cap. 2",
  },
  {
    text: "La riqueza no es lo que ganas, sino lo que acumulas. Un ingreso alto sin ahorro no produce riqueza; solo produce gasto alto y ansiedad alta.",
    author: "Thomas J. Stanley",
    source: "El millonario de al lado, cap. 1",
  },
  {
    text: "Da a tus hijos cariño pero no cantidad de dinero. Los hijos de millonarios que reciben ayudas son, en promedio, menos productivos que los que no.",
    author: "Thomas J. Stanley",
    source: "El millonario de al lado, cap. 5",
  },
  {
    text: "Los ricos de primera generación enseñan a sus hijos a fingir pobreza. Los nuevos ricos enseñan a fingir más riqueza de la que tienen.",
    author: "Thomas J. Stanley",
    source: "El millonario de al lado, cap. 5",
  },
  {
    text: "Dedica tiempo y energía a planificar. Cuanto más planifiques tu vida financiera, más riqueza acumularás. Dos horas a la semana marcan la diferencia.",
    author: "Thomas J. Stanley",
    source: "El millonario de al lado, cap. 2",
  },
  {
    text: "Elige el camino correcto. La ocupación no importa tanto como elegir un nicho donde la oferta es limitada y la demanda crece cada año.",
    author: "Thomas J. Stanley",
    source: "El millonario de al lado, cap. 7",
  },
  {
    text: "La riqueza es aquello a lo que acostumbras renunciar antes de que alguien te lo pida. Es el músculo de decir no antes de que te pregunten.",
    author: "Ramit Sethi",
    source: "I Will Teach You To Be Rich, cap. 1",
  },
  {
    text: "No te preocupes por los cafés de cuatro dólares si todavía no has automatizado tu ahorro. Los rituales pequeños no mueven la aguja; los sistemas, sí.",
    author: "Ramit Sethi",
    source: "I Will Teach You To Be Rich, introducción",
  },
  {
    text: "Gasta extravagantemente en las cosas que amas, y corta sin piedad en las cosas que no. No hay virtud en recortar por recortar.",
    author: "Ramit Sethi",
    source: "I Will Teach You To Be Rich, cap. 4",
  },
  {
    text: "Automatizar tu dinero es la decisión financiera más importante que puedes tomar. Una vez configurado, el sistema hace lo que la voluntad falla.",
    author: "Ramit Sethi",
    source: "I Will Teach You To Be Rich, cap. 5",
  },
  {
    text: "La palabra rico significa algo distinto para cada persona. Define tu rica vida antes de perseguirla, o te darás cuenta demasiado tarde de que no era tuya.",
    author: "Ramit Sethi",
    source: "I Will Teach You To Be Rich, introducción",
  },
  {
    text: "Nunca he visto a nadie quebrar un negocio por atender bien a sus clientes. Lo contrario, cada día; el cliente desatendido es la causa silenciosa de la mayoría de las bancarrotas.",
    author: "Warren Buffett",
    source: "Carta a accionistas de Berkshire Hathaway, 2007",
  },
  {
    text: "Cuando una gestión con reputación de brillante acomete un negocio con reputación de malo, es la reputación del negocio la que sobrevive intacta.",
    author: "Warren Buffett",
    source: "Carta a accionistas de Berkshire Hathaway, 1980",
  },
  {
    text: "Un foso económico duradero es la cualidad más importante que busco en un negocio. Lo que no dura diez años, no merece que pienses en ello cinco minutos.",
    author: "Warren Buffett",
    source: "Carta a accionistas de Berkshire Hathaway, 2007",
  },
  {
    text: "Los peligros de una mala política monetaria pueden convertir el dinero de una cuenta bancaria en polvo. El control sobre el gasto protege donde la inflación ataca.",
    author: "Warren Buffett",
    source: "Carta a accionistas de Berkshire Hathaway, 1981",
  },
  {
    text: "La inflación es un impuesto sin legislación y sin debate. Golpea al que ahorra en efectivo como un robo silencioso, año tras año.",
    author: "Ronald Reagan",
    source: "Discurso a la Cámara de Comercio, 1978",
  },
  {
    text: "Preferimos cien mil dólares seguros a un millón de dólares con un 80% de probabilidad. Nuestra tolerancia al riesgo es la ausencia de riesgo innecesario.",
    author: "Warren Buffett",
    source: "Carta a accionistas de Berkshire Hathaway, 1989",
  },
  {
    text: "Hay dos tipos de forecasters: los que no saben, y los que no saben que no saben. No gastes dinero en ninguno de ellos.",
    author: "John Kenneth Galbraith",
    source: "Una breve historia de la euforia financiera",
  },
  {
    text: "La memoria financiera es extremadamente corta. Todos los grandes desastres se olvidan en veinte años, y por eso la siguiente burbuja encuentra público preparado.",
    author: "John Kenneth Galbraith",
    source: "Una breve historia de la euforia financiera, prefacio",
  },
  {
    text: "En una burbuja, todos los argumentos suenan profundos. Solo después del colapso te das cuenta de lo ridículos que eran. No esperes a eso para notarlo.",
    author: "John Kenneth Galbraith",
    source: "Una breve historia de la euforia financiera",
  },
  {
    text: "La incertidumbre es el amigo del comprador a largo plazo de valor. Cuando el mercado se vuelve loco, él encuentra rebajas que no verá en años de tranquilidad.",
    author: "Warren Buffett",
    source: "Op-ed en New York Times, octubre 2008",
  },
  {
    text: "Necesitamos ser convincentes con nosotros mismos antes que con los demás. Si no entiendes por qué compras algo, tu cartera dirá la verdad en los meses duros.",
    author: "Howard Marks",
    source: "Lo más importante, cap. 1",
  },
  {
    text: "Es importante sentirse incómodo con el consenso. Si todos piensan que algo es una gran oportunidad, seguramente ya se ha reflejado en el precio.",
    author: "Howard Marks",
    source: "Lo más importante, cap. 2",
  },
  {
    text: "El riesgo significa que pueden pasar más cosas de las que pasarán. Si solo piensas en la media, nunca estarás preparado para los extremos.",
    author: "Howard Marks",
    source: "Lo más importante, cap. 5",
  },
  {
    text: "El inversor superior no es el que más acierta, sino el que comete menos errores cuando el mercado se pone difícil. Sobrevivir a los malos tramos vale más que brillar en los buenos.",
    author: "Howard Marks",
    source: "Lo más importante, cap. 14",
  },
  {
    text: "Es una cosa entender la historia; otra muy distinta tomar decisiones siendo consciente de ella mientras el resto la olvida.",
    author: "Howard Marks",
    source: "Memo: You Can't Predict. You Can Prepare, 2001",
  },
  {
    text: "Nadie conoce el futuro. Pero saber lo que no sabes es infinitamente más útil que creer lo que no es cierto con certeza.",
    author: "Howard Marks",
    source: "Memo: We're Not in 1987 Anymore, 2017",
  },
  {
    text: "El pesimismo tiene mala fama, pero en inversión vale más que diez optimismos. El pesimista compara la realidad con lo que podría ser peor; no pierde el piso.",
    author: "Howard Marks",
    source: "Memo: The Happy Medium, 2004",
  },
  {
    text: "Comprar barato es más importante que vender caro. Si compras bien, los errores de venta cuestan poco. Si compras mal, ni la mejor venta te salva.",
    author: "Howard Marks",
    source: "Lo más importante, cap. 4",
  },
  {
    text: "Los inversores que tienen éxito durante largos periodos hacen menos cosas; pero las que hacen, las hacen muy bien, en los momentos correctos.",
    author: "Howard Marks",
    source: "Lo más importante, cap. 20",
  },
  {
    text: "La búsqueda del rendimiento sin pensar en el riesgo es un camino seguro al desastre. El dinero fácil, en inversión, es señal de peligro oculto.",
    author: "Howard Marks",
    source: "Memo: Risk, 2006",
  },
  {
    text: "El antifrágil se beneficia del caos y la volatilidad; el frágil se rompe. Construye tus finanzas para que los shocks las fortalezcan, no para que las destruyan.",
    author: "Nassim Nicholas Taleb",
    source: "Antifrágil, prólogo",
  },
  {
    text: "No predigo los cisnes negros; me preparo para ellos. Un inversor que solo planea para escenarios esperados será aniquilado por uno inesperado.",
    author: "Nassim Nicholas Taleb",
    source: "El cisne negro, cap. 13",
  },
  {
    text: "Nunca preguntes a un barbero si necesitas un corte. Nunca preguntes a un asesor financiero con comisiones si necesitas su producto.",
    author: "Nassim Nicholas Taleb",
    source: "Tener la piel en el juego, cap. 1",
  },
  {
    text: "Quien toma un riesgo debe pagar las consecuencias del mismo. Un sistema sano obliga a que los decisores tengan piel en el juego.",
    author: "Nassim Nicholas Taleb",
    source: "Tener la piel en el juego, introducción",
  },
  {
    text: "Estrategia de barbell: muy conservador en la mayoría de tu dinero, muy agresivo en una pequeña parte. Evita el medio, donde la mediocridad te hunde.",
    author: "Nassim Nicholas Taleb",
    source: "Antifrágil, cap. 11",
  },
  {
    text: "Robustez no es suficiente. Busca la antifragilidad: que el tiempo, la adversidad y los shocks mejoren tu posición, en lugar de erosionarla.",
    author: "Nassim Nicholas Taleb",
    source: "Antifrágil, cap. 2",
  },
  {
    text: "El camino a la ruina pasa por opciones que parecen sin consecuencias hasta que tienen una muy grande. Nunca juegues a la ruleta rusa aunque paguen bien.",
    author: "Nassim Nicholas Taleb",
    source: "Engañados por el azar",
  },
  {
    text: "En un sistema con exposición asimétrica, pequeñas decisiones estúpidas se acumulan en grandes desastres. No te fijes en la media; fíjate en la distribución.",
    author: "Nassim Nicholas Taleb",
    source: "El cisne negro, cap. 4",
  },
  {
    text: "No hagas predicciones donde tengas muy poca información. No inviertas donde no entiendes los riesgos. La ignorancia admitida es más valiosa que la falsa certeza.",
    author: "Nassim Nicholas Taleb",
    source: "El cisne negro, cap. 8",
  },
  {
    text: "El dolor de perder cien dólares es más intenso que la alegría de ganar cien. Si negocias sin entender esta asimetría, estás regalando dinero al mercado.",
    author: "Nassim Nicholas Taleb",
    source: "Engañados por el azar, cap. 5",
  },
  {
    text: "Los principios son el conjunto de reglas que llevas a cualquier situación nueva. Escribir los tuyos sobre el dinero cambia cada decisión futura.",
    author: "Ray Dalio",
    source: "Principios, parte 1",
  },
  {
    text: "Dolor + reflexión = progreso. Si pierdes dinero y no reflexionas, repetirás la pérdida. Si pierdes y anotas la lección, esa pérdida rinde intereses.",
    author: "Ray Dalio",
    source: "Principios, cap. 5",
  },
  {
    text: "El arte de invertir no consiste en elegir lo que va a subir, sino en construir una cartera que funcione en mundos que no puedes predecir.",
    author: "Ray Dalio",
    source: "Principios, parte 3",
  },
  {
    text: "Una cartera equilibrada en cuatro climas económicos posibles aguanta lo que ni siquiera has imaginado. Eso vale más que acertar el próximo movimiento.",
    author: "Ray Dalio",
    source: "Principios, parte 3",
  },
  {
    text: "La humildad radical es el precio de entrada para invertir con consistencia. Sin ella, confundes suerte con habilidad y el mercado te pasa la factura.",
    author: "Ray Dalio",
    source: "Principios, cap. 2",
  },
  {
    text: "Si no estás preocupado por tu dinero, te engañas. Si estás paralizado por la preocupación, también. La virtud está en mirar de frente sin temblar.",
    author: "Ray Dalio",
    source: "Principios, cap. 2",
  },
  {
    text: "Apuesta por sesgos humanos persistentes. El miedo y la codicia llevan siglos moviendo mercados. Construye tu sistema contra eso, no contra titulares de hoy.",
    author: "Ray Dalio",
    source: "Principios, parte 3",
  },
  {
    text: "La combinación de veinte años de reinvertir con paciencia y de proteger el capital en los años malos produce más riqueza que treinta de golpes maestros.",
    author: "Ray Dalio",
    source: "Principios, parte 3",
  },
  {
    text: "Sigue los tres pasos: ahorra, invierte en una cartera resistente a cualquier entorno y olvídate. Sentirás la tentación de intervenir: no lo hagas.",
    author: "Ray Dalio",
    source: "Principios, parte 3",
  },
  {
    text: "La suerte favorece al preparado, no al que acumula compras compulsivas esperando que algún milagro las convierta en patrimonio.",
    author: "Ray Dalio",
    source: "Principios, cap. 4",
  },
  {
    text: "El motor del crecimiento a largo plazo es la productividad: aprender más para producir mejor. En finanzas personales, aprender más sobre dinero rinde así.",
    author: "Ray Dalio",
    source: "Principios para afrontar el orden mundial cambiante",
  },
  {
    text: "Lo seguro es lo que parece aburrido. Compra un pequeño trozo de muchas grandes empresas, ignora el resto, y mira tu tranquilidad al cabo de veinte años.",
    author: "Ray Dalio",
    source: "Entrevista en Tim Ferriss Show, 2017",
  },
  {
    text: "El monopolio es el estado natural de todo negocio que se toma en serio. Los negocios perfectamente competitivos solo sobreviven al precio del esfuerzo.",
    author: "Peter Thiel",
    source: "De cero a uno, cap. 3",
  },
  {
    text: "La competencia es para perdedores. Si quieres construir riqueza, busca monopolio creativo: lo que puedas hacer mejor que nadie, tú solo.",
    author: "Peter Thiel",
    source: "De cero a uno, cap. 3",
  },
  {
    text: "Un buen plan ejecutado hoy es mejor que un plan perfecto ejecutado mañana. El capital paciente bate al capital teórico cada ciclo económico.",
    author: "Peter Thiel",
    source: "De cero a uno, cap. 6",
  },
  {
    text: "El futuro es lo que importa. Preguntar qué está haciendo alguien que sobrevivirá en diez años es mejor pregunta que preguntar qué ganará en el próximo trimestre.",
    author: "Peter Thiel",
    source: "De cero a uno, cap. 6",
  },
  {
    text: "Cada momento en los negocios ocurre una sola vez. Quien intenta replicar lo que funcionó ayer, trabaja para alguien que ya monetizó ese instante.",
    author: "Peter Thiel",
    source: "De cero a uno, cap. 1",
  },
  {
    text: "No es por la benevolencia del carnicero, el cervecero o el panadero por lo que esperamos nuestra cena, sino por su propio interés.",
    author: "Adam Smith",
    source: "La riqueza de las naciones, libro I, cap. II",
  },
  {
    text: "Cada persona vive cambiando, o se vuelve en cierta medida un mercader, y la sociedad misma se convierte en propiamente una sociedad comercial.",
    author: "Adam Smith",
    source: "La riqueza de las naciones, libro I, cap. IV",
  },
  {
    text: "El trabajo es la verdadera medida del valor intercambiable de todos los bienes. Cuánto esfuerzo humano encierra lo que compras es el precio real.",
    author: "Adam Smith",
    source: "La riqueza de las naciones, libro I, cap. V",
  },
  {
    text: "El poder que un hombre recibe por su fortuna es el poder de comandar cierta cantidad de trabajo, o del producto del trabajo de otros.",
    author: "Adam Smith",
    source: "La riqueza de las naciones, libro I, cap. V",
  },
  {
    text: "La avaricia y la injusticia son siempre miopes. No ven que la prosperidad común es la única base segura de la prosperidad individual duradera.",
    author: "Adam Smith",
    source: "Teoría de los sentimientos morales, parte VI",
  },
  {
    text: "A la larga estamos todos muertos. Los economistas se hacen inútiles si en medio de una tormenta solo saben decir que tras la tempestad llegará la calma.",
    author: "John Maynard Keynes",
    source: "Tract on Monetary Reform, 1923",
  },
  {
    text: "El mercado puede permanecer irracional más tiempo del que tú puedas permanecer solvente. Nunca apuestes solo a que un precio ajustará pronto.",
    author: "John Maynard Keynes",
    source: "Citado en The Economist, 1930",
  },
  {
    text: "No hay almuerzo gratis. Cada beneficio aparentemente sin coste esconde un coste que no has visto todavía; el favor silencioso se paga con una factura inesperada años después.",
    author: "Milton Friedman",
    source: "There's No Such Thing as a Free Lunch, 1975",
  },
  {
    text: "La inflación es siempre y en todo lugar un fenómeno monetario. Si no ahorras en cosas que resisten esa expansión, ves tu dinero hacerse pequeño en silencio.",
    author: "Milton Friedman",
    source: "The Counter-Revolution in Monetary Theory, 1970",
  },
  {
    text: "El camino de las buenas intenciones es el camino del control centralizado. Preserva la libertad económica como preservas la libertad de tu propia agenda.",
    author: "Friedrich Hayek",
    source: "Camino de servidumbre, cap. 7",
  },
  {
    text: "Los ricos tienen muchas pequeñas deudas que cobrar. Los pobres tienen muchas pequeñas deudas que pagar. La diferencia son años de atención a los céntimos.",
    author: "Proverbio chino",
    source: "Recogido en The Richest Man in Babylon",
  },
  {
    text: "El que no cuida sus monedas pequeñas no tendrá monedas grandes que cuidar. El que desprecia el céntimo, no verá nunca el millón.",
    author: "George S. Clason",
    source: "El hombre más rico de Babilonia, cap. 5",
  },
  {
    text: "Cuanto más consiente uno ser gobernado por la oportunidad, más se da cuenta de que la oportunidad es otra cara del trabajo preparado.",
    author: "George S. Clason",
    source: "El hombre más rico de Babilonia, cap. 6",
  },
  {
    text: "El hombre afortunado es el hombre que llegó preparado. La suerte nunca visita dos veces al que perdió la primera por falta de disciplina.",
    author: "George S. Clason",
    source: "El hombre más rico de Babilonia, cap. 7",
  },
  {
    text: "Donde la determinación es, el camino puede hallarse. Un hombre con voluntad encontrará el método; un hombre sin ella encontrará una excusa.",
    author: "George S. Clason",
    source: "El hombre más rico de Babilonia, cap. 11",
  },
  {
    text: "Que tus ingresos excedan tus gastos. Sobre la diferencia se construye todo lo demás. No hay otro principio más antiguo ni más nuevo que ese.",
    author: "George S. Clason",
    source: "El hombre más rico de Babilonia, cap. 3",
  },
  {
    text: "La suerte del que persigue obstinadamente se parece mucho al talento, y el resto del mundo termina agradeciendo los frutos sin entender el esfuerzo.",
    author: "George S. Clason",
    source: "El hombre más rico de Babilonia, cap. 8",
  },
  {
    text: "Se puede tener miedo y actuar con coraje. Se puede tener ansiedad y gestionar bien el dinero. Lo importante es elegir por encima del estado de ánimo.",
    author: "Morgan Housel",
    source: "La psicología del dinero, cap. 16",
  },
  {
    text: "La gestión del dinero tiene poco que ver con lo listo que seas, y mucho con cómo te comportas. El comportamiento es difícil de enseñar, incluso a gente lista.",
    author: "Morgan Housel",
    source: "La psicología del dinero, introducción",
  },
  {
    text: "Menos ego equivale a más riqueza. El ahorro es lo que queda entre tu ingreso y tu ego. Reduce el segundo y sube todo lo demás.",
    author: "Morgan Housel",
    source: "La psicología del dinero, cap. 10",
  },
  {
    text: "Hay cosas en finanzas que nunca cambian. La gente se sigue asustando cuando el mercado cae; sigue celebrando cuando sube. La naturaleza humana es la constante.",
    author: "Morgan Housel",
    source: "Same as Ever, cap. 1",
  },
  {
    text: "El mundo avanza según los riesgos que nadie ve venir, no los que salen en las noticias. El riesgo real es el que, si lo hubieras previsto, habrías hecho algo.",
    author: "Morgan Housel",
    source: "Same as Ever, cap. 3",
  },
  {
    text: "No ganas dinero de las cosas que se resuelven rápido. El tiempo es la materia prima de todo rendimiento interesante, y nadie la puede regalar.",
    author: "Morgan Housel",
    source: "Same as Ever, cap. 5",
  },
  {
    text: "Tu percepción del riesgo depende de tu última experiencia con el riesgo. Quien vivió el crack se vuelve prudente; quien no, se vuelve confiado sin razón.",
    author: "Morgan Housel",
    source: "La psicología del dinero, cap. 1",
  },
  {
    text: "La buena inversión no consiste en tomar buenas decisiones, sino en evitar consistentemente las malas. No destruir es más importante que construir.",
    author: "Morgan Housel",
    source: "La psicología del dinero, cap. 18",
  },
  {
    text: "La cola larga, las improbables, manda. Unos pocos eventos producen la mayoría de resultados: unos pocos años, unas pocas empresas, unas pocas decisiones.",
    author: "Morgan Housel",
    source: "La psicología del dinero, cap. 6",
  },
  {
    text: "Todo tiene un precio. El precio del éxito en inversión es soportar volatilidad, miedo y duda. El que no quiere pagar el precio, no recibe el producto.",
    author: "Morgan Housel",
    source: "La psicología del dinero, cap. 15",
  },
  {
    text: "Tu salud mental es más importante que tu rendimiento del portafolio. Si no duermes por una inversión, tu asignación es mala aunque gane dinero.",
    author: "Morgan Housel",
    source: "Same as Ever, cap. 8",
  },
  {
    text: "La gente no quiere la verdad sobre el dinero. Quiere que se lo confirmen. El asesor que dice verdades duras pierde clientes; el que dice fantasías, los retiene.",
    author: "Morgan Housel",
    source: "La psicología del dinero, cap. 17",
  },
  {
    text: "El poder optativo es el mayor lujo del dinero. Poder dejar un trabajo malo mañana por la mañana es más valor que la mayoría de los bienes que compras.",
    author: "Morgan Housel",
    source: "La psicología del dinero, cap. 7",
  },
  {
    text: "La vida no es un spreadsheet. Las decisiones financieras correctas en papel pueden ser psicológicamente insoportables. Optimiza para que puedas dormir.",
    author: "Morgan Housel",
    source: "La psicología del dinero, cap. 11",
  },
  {
    text: "La historia se repite; no porque los hechos sean iguales, sino porque la naturaleza humana no ha cambiado. La codicia y el miedo siguen siendo los motores.",
    author: "Morgan Housel",
    source: "Same as Ever, cap. 1",
  },
  {
    text: "Algunas cosas nunca cambian. Que la gente sobrestime las probabilidades de los eventos fáciles de recordar es una de ellas, y explica mucho del desastre financiero.",
    author: "Morgan Housel",
    source: "Same as Ever, cap. 2",
  },
  {
    text: "Todo es cíclico. Los periodos buenos siembran los malos porque la gente relaja la guardia; los malos siembran los buenos porque la gente se vuelve prudente.",
    author: "Morgan Housel",
    source: "Same as Ever, cap. 6",
  },
  {
    text: "La cosa sobre la que el dinero tiene menor control es el deseo de tener más dinero. Esa es la trampa del aumento sin techo: ninguna cantidad te libera.",
    author: "Morgan Housel",
    source: "La psicología del dinero, cap. 3",
  },
  {
    text: "Contrata gente más lista que tú. Da igual si es una empresa o tu asesor fiscal. Pagar bien al que sabe más es la inversión de mejor rendimiento.",
    author: "Warren Buffett",
    source: "Junta anual de Berkshire Hathaway, 2002",
  },
  {
    text: "El mercado existe para servirte, no para dirigirte. Si te deja nervioso, deja de mirarlo. Si te da precios absurdos, aprovecha los errores.",
    author: "Benjamin Graham",
    source: "El inversor inteligente, cap. 8",
  },
  {
    text: "Imagina al señor Mercado como un socio que cada día te ofrece comprar o vender tus acciones a un precio. Unos días racional, otros eufórico, otros deprimido.",
    author: "Benjamin Graham",
    source: "El inversor inteligente, cap. 8",
  },
  {
    text: "El margen de seguridad es el concepto central de la inversión. Compra por debajo del valor intrínseco y deja un colchón para los errores que seguro cometerás.",
    author: "Benjamin Graham",
    source: "El inversor inteligente, cap. 20",
  },
  {
    text: "El peor enemigo del inversor es él mismo. Controla tus emociones y ganarás más que persiguiendo las mejores acciones del trimestre.",
    author: "Benjamin Graham",
    source: "El inversor inteligente, prólogo",
  },
  {
    text: "Invertir es más inteligente cuando es más empresarial. Piensa en acciones como trozos de negocio, no como papeles con precio que sube y baja.",
    author: "Benjamin Graham",
    source: "El inversor inteligente, cap. 20",
  },
  {
    text: "El individuo inversor debería actuar siempre como un inversor, no como un especulador. Si quieres especular, hazlo sabiendo que especulas y con dinero que puedes perder.",
    author: "Benjamin Graham",
    source: "El inversor inteligente, cap. 1",
  },
  {
    text: "El valor para el inversor depende mucho más de lo que está dispuesto a pagar que de lo que una empresa está dispuesta a pagar en dividendos.",
    author: "Benjamin Graham",
    source: "Security Analysis, cap. 27",
  },
  {
    text: "Aunque ahora creas que tienes el carácter adecuado, los mercados en caída te pondrán a prueba. Aprende a conocer tus propios nervios antes de invertir fuerte.",
    author: "Benjamin Graham",
    source: "El inversor inteligente, cap. 4",
  },
  {
    text: "Un inversor debería tener el triple de respeto por la pérdida permanente de capital que entusiasmo por una ganancia rápida.",
    author: "Benjamin Graham",
    source: "El inversor inteligente, cap. 1",
  },
  {
    text: "La abundancia de información vuelve al inversor más incapaz de decidir, no menos. Con más datos, menos claridad y más rotación inútil de cartera.",
    author: "Benjamin Graham",
    source: "El inversor inteligente, cap. 8",
  },
  {
    text: "No hay nada más parecido a un hombre que ha perdido la cabeza que un hombre que acaba de ver subir mucho su acción durante meses.",
    author: "Charlie Munger",
    source: "Poor Charlie's Almanack",
  },
  {
    text: "Toma una idea simple y tómatela en serio. La mayoría de fracasos financieros son gente tomándose demasiado en serio ideas complicadas.",
    author: "Charlie Munger",
    source: "Discurso en la Universidad de Harvard, 1995",
  },
  {
    text: "La opinión del experto, sin piel en el juego del experto, casi no vale nada. Pregúntate siempre: si se equivoca, ¿quién paga? Si no es él, descuenta.",
    author: "Charlie Munger",
    source: "Poor Charlie's Almanack",
  },
  {
    text: "No se consigue ser pensador aprendiéndose libros: se consigue comparándolos entre sí, rebatiéndolos, y aplicando sus ideas al mundo real hasta que duelan.",
    author: "Charlie Munger",
    source: "Discurso en la USC Gould School, 2007",
  },
  {
    text: "La gente intenta ser lista. Yo intento no ser idiota. Parece poco ambicioso, pero es mucho más difícil y mucho más rentable de lo que parece.",
    author: "Charlie Munger",
    source: "Reunión anual del Daily Journal, 2017",
  },
  {
    text: "Reconoce la realidad, incluso cuando no te gusta. Especialmente cuando no te gusta. Esa es la única base desde la cual se puede invertir con cabeza.",
    author: "Charlie Munger",
    source: "Poor Charlie's Almanack",
  },
  {
    text: "Evita los ámbitos donde una persona mala pueda arrastrarte. Invertir con gente de dudosa ética siempre termina con gente honesta perdiendo dinero.",
    author: "Charlie Munger",
    source: "Discurso en el USC Law School Commencement, 2007",
  },
  {
    text: "Tres reglas para una vida financiera decente: evita drogas, evita trampas, evita deudas personales. Si haces solo esas tres, estarás mejor que la mayoría.",
    author: "Charlie Munger",
    source: "Reunión anual del Daily Journal, 2020",
  },
  {
    text: "Olvida el éxito y el fracaso; concéntrate en el proceso. Si el proceso es sensato, las estadísticas de los años largos te dan la razón aunque los cortos no.",
    author: "Charlie Munger",
    source: "Poor Charlie's Almanack",
  },
  {
    text: "Preocúpate por tus propios errores y corrígelos. Preocuparte por los errores ajenos es una especie de entretenimiento caro. Deja que cometan los suyos.",
    author: "Charlie Munger",
    source: "Reunión anual del Daily Journal, 2018",
  },
  {
    text: "Creo profundamente en la potencia de la desmotivación negativa: saber lo que no hay que hacer y no hacerlo. Pocos beneficios dan tanto como evitar lo estúpido.",
    author: "Charlie Munger",
    source: "Poor Charlie's Almanack",
  },
  {
    text: "Las personas que entrenan al jefe, tratando de impresionarle, rara vez aprenden. Las que se centran en entender el negocio, sí. Elige de qué lado estás.",
    author: "Charlie Munger",
    source: "Reunión anual del Daily Journal, 2014",
  },
  {
    text: "Me repito a mí mismo: vender o comprar solo por motivo emocional es un impuesto voluntario a los mercados. Y yo no pago impuestos voluntarios.",
    author: "Charlie Munger",
    source: "Poor Charlie's Almanack",
  },
  {
    text: "El capitalismo es el mejor creador de riqueza que el mundo ha conocido. Pero si lo consumes sin entenderlo, te devora más deprisa que cualquier otro sistema.",
    author: "Charlie Munger",
    source: "Reunión anual del Daily Journal, 2019",
  },
  {
    text: "Un plan financiero escrito bate a diez planes brillantes no escritos. El papel obliga a la honestidad; la cabeza olvida lo que duele recordar.",
    author: "Ray Dalio",
    source: "Principios, parte 2",
  },
  {
    text: "La mejor defensa contra la inflación es poseer cosas productivas: empresas, tierras productivas, conocimientos. Efectivo bajo colchón pierde valor cada año.",
    author: "Warren Buffett",
    source: "Carta a accionistas de Berkshire Hathaway, 2011",
  },
  {
    text: "Si has logrado el primer millón ahorrando, los siguientes serán mucho más fáciles porque ya conoces la disciplina y la recompensa no es hipotética.",
    author: "Charlie Munger",
    source: "Reunión anual del Daily Journal, 2014",
  },
  {
    text: "Siempre me sorprende lo poco que la gente invierte en sí misma cuando ese es el activo que más rinde. Un libro de treinta euros puede pagarte dividendos décadas.",
    author: "Warren Buffett",
    source: "Conferencia con estudiantes de Columbia, 2009",
  },
  {
    text: "El mejor momento para plantar un árbol fue hace veinte años. El segundo mejor es hoy. En inversión, ese proverbio se convierte en cuenta bancaria.",
    author: "Proverbio chino",
    source: "Recogido por Warren Buffett, Carta Berkshire 2013",
  },
  {
    text: "El mayor riesgo es no tomar ninguno. En un mundo que cambia rápidamente, la única estrategia que garantiza fallar es no asumir riesgos calculados.",
    author: "Mark Zuckerberg",
    source: "Entrevista con Y Combinator, 2011",
  },
  {
    text: "Los ricos tienen el lujo de pensar en el largo plazo. Las finanzas personales sanas empiezan comprándote ese lujo: el derecho a pensar sin pánico.",
    author: "Morgan Housel",
    source: "La psicología del dinero, cap. 7",
  },
  {
    text: "Nunca subestimes el poder de un pequeño gasto repetido. Un café al día durante cuarenta años, invertido al 7%, habría sido un coche de alta gama al jubilarse.",
    author: "David Bach",
    source: "The Latte Factor, introducción",
  },
  {
    text: "Paga primero tu futuro. Antes del alquiler, antes de la cena, antes del entretenimiento. Solo así construyes patrimonio en lugar de perseguirlo.",
    author: "David Bach",
    source: "El millonario automático, cap. 3",
  },
  {
    text: "El gasto automatizado hacia tu futuro gana al mejor consejo financiero mal aplicado. Un sistema sencillo ejecutado siempre supera al plan perfecto ejecutado a veces.",
    author: "David Bach",
    source: "El millonario automático, cap. 4",
  },
  {
    text: "El camino al dinero no pasa por un golpe de suerte. Pasa por hacer, cada mes durante treinta años, lo que parece ridículamente pequeño para cambiar la vida.",
    author: "David Bach",
    source: "El millonario automático, cap. 1",
  },
  {
    text: "Quien espera a sentirse dispuesto a ahorrar, no ahorrará nunca. El que automatiza el ahorro descubre que nunca echa de menos lo que nunca ve.",
    author: "David Bach",
    source: "El millonario automático, cap. 3",
  },
  {
    text: "El poseedor de riqueza tiene menos libertad que el poseedor de pocas necesidades. Este último se mueve por donde quiere; el primero, por donde su capital le exige.",
    author: "Henry David Thoreau",
    source: "Walden, cap. 1",
  },
  {
    text: "Un hombre es rico en proporción al número de cosas que puede permitirse dejar en paz. La riqueza real no es lo que acumulas, sino lo que puedes ignorar sin perder tranquilidad.",
    author: "Henry David Thoreau",
    source: "Walden, cap. 1",
  },
  {
    text: "La mayoría de los lujos y muchas de las supuestas comodidades de la vida no solo no son indispensables, sino obstáculos positivos para el progreso del hombre.",
    author: "Henry David Thoreau",
    source: "Walden, cap. 1",
  },
  {
    text: "Vivir con sencillez, pensar con profundidad y actuar con nobleza. Esa trinidad, bien entendida, produce más fortuna que cualquier estrategia bursátil.",
    author: "Henry David Thoreau",
    source: "Diario, 1850",
  },
  {
    text: "Cuánto más prescinde uno, más rico se siente. El hábito voluntario de no comprar es, en sí, un aumento de capacidad adquisitiva superior a cualquier subida de sueldo.",
    author: "Henry David Thoreau",
    source: "Walden, cap. 2",
  },
  {
    text: "La codicia es el robo continuo del alma a sí misma. Busca poseer, y pierde las horas en las que podría haber vivido.",
    author: "Epicteto",
    source: "Disertaciones, III.22",
  },
  {
    text: "No te enojes con las cosas, pues a ellas poco les importa. La riqueza perdida no vuelve más indignada que perdida: vuelve solo con trabajo y paciencia.",
    author: "Marco Aurelio",
    source: "Meditaciones, VII.38",
  },
  {
    text: "Quita la opinión y quitas la queja. Quita la queja y quitas el daño. Muchas pérdidas financieras son, sobre todo, interpretaciones nuestras del hecho.",
    author: "Marco Aurelio",
    source: "Meditaciones, IV.7",
  },
  {
    text: "La felicidad no consiste en poseer mucho, sino en necesitar poco. Ese principio, bien aplicado, desarma a buena parte de la industria del consumo.",
    author: "Marco Aurelio",
    source: "Meditaciones, VII.27",
  },
  {
    text: "Nada está más lejos del sabio que la ambición de tener más de lo necesario; y nada está más cerca del necio que esa ambición.",
    author: "Marco Aurelio",
    source: "Meditaciones, X.16",
  },
  {
    text: "Muchos, en su afán de acumular riquezas, han perdido la libertad, la salud y la amistad: tres bienes por los que luego habrían dado toda esa riqueza.",
    author: "Epicteto",
    source: "Disertaciones, III.9",
  },
  {
    text: "No considero pobre al que tiene poco, sino al que codicia más. Bajo esa medida, muchos millonarios son pobres y muchos trabajadores son ricos.",
    author: "Séneca",
    source: "Cartas a Lucilio, carta 2",
  },
  {
    text: "El cuerpo exige poco; la opinión y la costumbre exigen mucho. Reduce lo segundo antes de pensar en cómo conseguir más dinero para pagarlo.",
    author: "Séneca",
    source: "Cartas a Lucilio, carta 4",
  },
  {
    text: "Mientras los hombres aprenden el arte de vivir, se les va la vida. Mientras aprenden a enriquecerse, se les va el alma. Aprende ambas cosas a tiempo.",
    author: "Séneca",
    source: "Sobre la brevedad de la vida, cap. 1",
  },
  {
    text: "El que se contenta con lo que tiene, es el hombre más rico del mundo. Esa frase suena barata, pero cuesta años entenderla de verdad.",
    author: "Lao Tsé",
    source: "Tao Te Ching, cap. 33",
  },
  {
    text: "El sabio no acumula. Cuanto más hace por los demás, más tiene. Cuanto más da, más recibe. Esta dinámica, aunque parezca mística, se verifica en los negocios sanos.",
    author: "Lao Tsé",
    source: "Tao Te Ching, cap. 81",
  },
  {
    text: "La necesidad es un gran maestro; pero la abundancia lo es más. Quien la soporta sin estropearse, es dueño verdaderamente de su alma.",
    author: "Séneca",
    source: "Cartas a Lucilio, carta 45",
  },
  {
    text: "Lo que mucha gente ha tenido, no te falta en especial a ti. Y en todo caso, lo sabio no es tener lo mismo, sino necesitar menos que ellos.",
    author: "Séneca",
    source: "Cartas a Lucilio, carta 15",
  },
  {
    text: "Lo que la fortuna no ha dado, no se quita. Lo que no te dio, no es tuyo, aunque parezca que lo tenías; el sabio distingue entre prestado y propio antes de que se lo recuerden.",
    author: "Séneca",
    source: "Cartas a Lucilio, carta 72",
  },
  {
    text: "Dios da a cada hombre la dosis exacta de necesidades que le conviene. El resto, es capricho propio disfrazado de destino.",
    author: "Séneca",
    source: "Sobre la vida feliz, cap. 15",
  },
  {
    text: "Ninguna suma apagará por completo la sed de quien bebe para saciarse. El apetito crece con lo que recibe; solo muere cuando se le retira el vaso.",
    author: "Séneca",
    source: "Cartas a Lucilio, carta 119",
  },
  {
    text: "La inversión más importante que puedes hacer es entender muy bien tu propia psicología. Sin eso, acabarás regalando todas las demás ventajas a alguien más paciente.",
    author: "Jason Zweig",
    source: "Tu dinero y tu cerebro, introducción",
  },
  {
    text: "Comprar acciones es casi idéntico a comprar empresas. Ese gesto, tomado en serio, cambia para siempre qué acciones miras y cuánto tiempo las conservas.",
    author: "Philip Fisher",
    source: "Acciones ordinarias y beneficios extraordinarios, cap. 1",
  },
  {
    text: "Busca empresas con oportunidad genuina de crecimiento de ingresos durante años y compra cuando tengas confianza. Lo demás es estar en el negocio equivocado.",
    author: "Philip Fisher",
    source: "Acciones ordinarias y beneficios extraordinarios, cap. 3",
  },
  {
    text: "El mayor beneficio de la bolsa viene de poseer empresas excepcionales durante muchísimo tiempo. Cambiar de cartera por entusiasmo es el error más caro.",
    author: "Philip Fisher",
    source: "Acciones ordinarias y beneficios extraordinarios, cap. 6",
  },
  {
    text: "La gestión que paga dividendos altos a costa del crecimiento está entregando al inversor el pasado a cambio de su futuro. A veces tiene sentido; normalmente, no.",
    author: "Philip Fisher",
    source: "Acciones ordinarias y beneficios extraordinarios, cap. 8",
  },
  {
    text: "Sobre expectativas de crecimiento, tras años de conducta decepcionante, suele haber un reajuste brutal del precio. Aprende a reconocer ese riesgo antes del crash.",
    author: "Philip Fisher",
    source: "Acciones ordinarias y beneficios extraordinarios, cap. 10",
  },
  {
    text: "No hay dos activos idénticos. Cada uno tiene su riesgo y su plazo; por eso diversificar no consiste en tener muchos, sino en tener los adecuados.",
    author: "Harry Markowitz",
    source: "Portfolio Selection, 1952",
  },
  {
    text: "La diversificación es el único almuerzo gratis en finanzas. Si la utilizas bien, reduces riesgo sin sacrificar rendimiento esperado a largo plazo.",
    author: "Harry Markowitz",
    source: "Entrevista en NIT, 2008",
  },
  {
    text: "Cuando empieces a invertir, si te equivocas, equivócate pronto. Los errores baratos en cantidad son educación; los errores caros en concentración son ruina.",
    author: "Seth Klarman",
    source: "Margin of Safety, cap. 3",
  },
  {
    text: "La mayoría de la gente quiere que le prometan rentabilidad; lo que deberías querer es que te prometan honestidad sobre el riesgo. Lo primero miente; lo segundo, no.",
    author: "Seth Klarman",
    source: "Margin of Safety, cap. 1",
  },
  {
    text: "Buffett tiene una regla: cuando estás en un hoyo, deja de cavar. En deuda, en inversiones equivocadas, en trabajos que te consumen. Primero parar; luego pensar.",
    author: "Seth Klarman",
    source: "Margin of Safety, cap. 5",
  },
  {
    text: "El valor de una empresa es la suma del dinero que podrá sacar de ella su dueño durante el resto de la vida del negocio, descontado al presente.",
    author: "John Burr Williams",
    source: "The Theory of Investment Value, 1938",
  },
  {
    text: "Las cuatro ruedas del éxito financiero duradero: ingreso, ahorro, inversión y propósito. Si falta una, el coche avanza cojo.",
    author: "Jean Chatzky",
    source: "Money Rules, 2013",
  },
  {
    text: "Ahorrar no es opcional. Es la cuota de entrada a la vida adulta. Lo que nadie te dice hasta que es tarde es que esa cuota solo se paga una vez.",
    author: "Jean Chatzky",
    source: "Make Money, Not Excuses, cap. 2",
  },
  {
    text: "La paz financiera es más valiosa que el éxito financiero. Muchos triunfan y se desmoronan; pocos mantienen una vida serena mientras prosperan.",
    author: "Suze Orman",
    source: "The Road to Wealth, prólogo",
  },
  {
    text: "Primero gente, luego dinero, luego cosas. En ese orden. Quien invierte la pirámide pierde lo más importante para comprar lo menos duradero.",
    author: "Suze Orman",
    source: "The 9 Steps to Financial Freedom, introducción",
  },
  {
    text: "Tu valor personal determina tu valor neto. Una persona con autoestima firme negocia mejor, invierte con cabeza y no gasta para impresionar a nadie.",
    author: "Suze Orman",
    source: "The Courage to Be Rich, cap. 1",
  },
  {
    text: "Trabaja como si no necesitaras dinero. Ahorra como si no tuvieras ingreso. Vive como si tu familia te mirara la cuenta. Esa triada es todo el plan.",
    author: "Adaptado de Mark Twain",
    source: "Charla popular atribuida",
  },
  {
    text: "Olvida lo que creías saber sobre el dinero y empieza observando tu comportamiento durante tres meses. El espejo del extracto bancario dice más que cualquier teoría.",
    author: "Vicki Robin",
    source: "Tu dinero o tu vida, cap. 3",
  },
  {
    text: "El dinero es energía vital. Lo que gastas representa las horas de tu vida. Calcula tu sueldo por hora y mira qué compras: descubrirás decisiones absurdas.",
    author: "Vicki Robin",
    source: "Tu dinero o tu vida, cap. 2",
  },
  {
    text: "Suficiencia es el punto mágico donde cubres tus necesidades, disfrutas de algunos caprichos, y el resto se convierte en ahorro que paga tu libertad futura.",
    author: "Vicki Robin",
    source: "Tu dinero o tu vida, cap. 4",
  },
  {
    text: "Gasta menos de lo que ganas, invierte la diferencia, y evita deudas. Ese es el plan en tres líneas. Todo lo demás es solo ejecución y paciencia.",
    author: "J. L. Collins",
    source: "El camino sencillo hacia la riqueza, cap. 1",
  },
  {
    text: "Ahorrar un 50% de tus ingresos te lleva a la libertad financiera en unos diecisiete años. Ahorrar un 10%, en más de cincuenta. La matemática es brutal.",
    author: "J. L. Collins",
    source: "El camino sencillo hacia la riqueza, cap. 4",
  },
  {
    text: "El dinero puede comprar muchas cosas, pero la cosa más valiosa de todas es la libertad de preocuparte por el dinero.",
    author: "J. L. Collins",
    source: "El camino sencillo hacia la riqueza, introducción",
  },
  {
    text: "Ignora el ruido diario del mercado. Compra un fondo indexado del mercado total y añade cada mes durante cincuenta años. Esa receta bate a la mayoría de gestores.",
    author: "J. L. Collins",
    source: "El camino sencillo hacia la riqueza, cap. 5",
  },
  {
    text: "Los mercados siempre se recuperan. Siempre. La única vez que no lo harán es cuando lleguen los zombis. Y entonces no te preocupará tu cartera.",
    author: "J. L. Collins",
    source: "El camino sencillo hacia la riqueza, cap. 6",
  },
  {
    text: "Una vez que entiendes cómo funciona el dinero, entiendes por qué mucha gente trabaja toda la vida sin alcanzar libertad. La trampa es elegante y voluntaria.",
    author: "J. L. Collins",
    source: "El camino sencillo hacia la riqueza, cap. 2",
  },
  {
    text: "El dinero es mucho más que números en una cuenta. Es libertad, poder, y elección. Cuando lo entiendas así, te relacionarás con él de forma distinta.",
    author: "Tony Robbins",
    source: "Dinero: domina el juego, cap. 1",
  },
  {
    text: "La velocidad con la que tu dinero crece depende más de que evites pérdidas grandes que de que captures ganancias extraordinarias.",
    author: "Tony Robbins",
    source: "Dinero: domina el juego, cap. 4",
  },
  {
    text: "Las comisiones son el enemigo silencioso. Un 2% anual parece poco hasta que te das cuenta de que se come la mitad de tu cartera en treinta años.",
    author: "Tony Robbins",
    source: "Dinero: domina el juego, cap. 2",
  },
  {
    text: "Un plan no funciona si no sobrevives a los momentos en que todo grita que lo abandones. Los cimientos del plan son psicológicos, no matemáticos.",
    author: "Tony Robbins",
    source: "Dinero: domina el juego, cap. 7",
  },
  {
    text: "No esperes a que llegue el dinero para empezar a vivir. Empieza a vivir con sentido ahora, y el dinero llegará como subproducto del valor que crees.",
    author: "Tony Robbins",
    source: "Dinero: domina el juego, cap. 8",
  },
  {
    text: "La gente busca hacer un golpe de suerte, cuando el dinero se hace con sistemas aburridos repetidos año tras año sin titulares ni aplausos.",
    author: "Ramit Sethi",
    source: "I Will Teach You To Be Rich, cap. 1",
  },
  {
    text: "Gasta conscientemente. No significa gastar menos; significa saber exactamente por qué gastas lo que gastas, y estar en paz con cada decisión.",
    author: "Ramit Sethi",
    source: "I Will Teach You To Be Rich, cap. 4",
  },
  {
    text: "La mayoría de expertos en dinero fallan porque dan consejos matemáticamente óptimos a personas que tienen problemas emocionales, no matemáticos.",
    author: "Ramit Sethi",
    source: "I Will Teach You To Be Rich, introducción",
  },
  {
    text: "Los ahorros son lo que trabajan para ti mientras duermes; los gastos, lo que te obligan a dormir poco. Decide cada mes cuál de los dos ganará la noche.",
    author: "Ramit Sethi",
    source: "I Will Teach You To Be Rich, cap. 5",
  },
  {
    text: "La pobreza es casi siempre caras. Lo barato a corto plazo se paga caro a largo. Poder comprar calidad una sola vez es un privilegio que compensa.",
    author: "Terry Pratchett",
    source: "Men at Arms, 1993",
  },
  {
    text: "Cada día vivimos una serie de decisiones sobre dinero; la mayoría automáticas. Cuando empezamos a traerlas a la conciencia, cambia toda la vida económica.",
    author: "Brent Kessel",
    source: "Es tu dinero, cap. 2",
  },
  {
    text: "La identidad financiera se construye más que se hereda. Puedes cambiarla si te observas sin juicio y te recolocas con paciencia donde quieres estar.",
    author: "Brent Kessel",
    source: "Es tu dinero, cap. 7",
  },
  {
    text: "El dinero amplifica la personalidad; no la transforma. La persona miedosa sin dinero se convierte en miedosa con dinero, y la alegre en alegre, con más o menos cifras.",
    author: "Morgan Housel",
    source: "La psicología del dinero, cap. 9",
  },
  {
    text: "Los altos retornos son la prima que el mercado paga por soportar miedo e incertidumbre. Si eliminas el riesgo, eliminas también la recompensa.",
    author: "Morgan Housel",
    source: "La psicología del dinero, cap. 15",
  },
  {
    text: "La inversión definitiva es conocer muy bien a la única persona a la que nunca puedes despedir: tú mismo. Trabaja primero ese activo; el resto se ordena luego.",
    author: "Morgan Housel",
    source: "La psicología del dinero, cap. 16",
  },
  {
    text: "Un margen de error permite soportar lo inesperado. Si tu plan solo funciona con ingresos perfectos y mercados amables, tu plan está esperando a reventar.",
    author: "Morgan Housel",
    source: "La psicología del dinero, cap. 13",
  },
  {
    text: "Has sobrevivido a guerras, pandemias, crisis financieras, inflación descontrolada y todo lo que ha ocurrido. El futuro también traerá shocks; prepara, no predigas.",
    author: "Morgan Housel",
    source: "Same as Ever, cap. 3",
  },
  {
    text: "Las grandes cosas tardan mucho. Cuanto más grande, más tarda. Si quieres rendimientos grandes, instala la paciencia como si fuera una herramienta más de tu cartera.",
    author: "Morgan Housel",
    source: "Same as Ever, cap. 5",
  },
  {
    text: "El expertise financiero se nota más en las cosas que no se hacen que en las que sí. Controlar la urgencia a actuar es medio camino hacia buenas decisiones.",
    author: "Morgan Housel",
    source: "La psicología del dinero, cap. 14",
  },
  {
    text: "En finanzas, pocos conceptos son tan útiles como margen de seguridad. Piensa en números, pero añade siempre un colchón por lo que no has previsto.",
    author: "Morgan Housel",
    source: "La psicología del dinero, cap. 13",
  },
  {
    text: "Las personas con más éxito financiero viven por debajo de sus posibilidades. No porque no puedan disfrutar, sino porque han redefinido lo que es disfrutar.",
    author: "Morgan Housel",
    source: "La psicología del dinero, cap. 8",
  },
  {
    text: "La gente atractiva compra cosas atractivas con cargo a tarjetas atractivas mientras su red patrimonial sigue atrás. No confundas elegancia con patrimonio.",
    author: "Morgan Housel",
    source: "La psicología del dinero, cap. 9",
  },
  {
    text: "Renunciar es infravalorado. Parar una mala inversión, un mal trabajo, un mal hábito financiero, libera capital para construir algo mejor en su lugar.",
    author: "Annie Duke",
    source: "Quit: el poder de saber cuándo retirarse",
  },
  {
    text: "Una buena decisión no siempre da buen resultado. Y un buen resultado no implica buena decisión. Distinguir proceso de resultado es la base de invertir bien.",
    author: "Annie Duke",
    source: "Pensar en apuestas, cap. 2",
  },
  {
    text: "Apostar bien consiste en tomar decisiones con información imperfecta sabiendo que son probabilísticas. En finanzas, fingir certeza cuesta más que reconocer duda.",
    author: "Annie Duke",
    source: "Pensar en apuestas, cap. 1",
  },
  {
    text: "El inversor individual debería actuar consistentemente como inversor, no como especulador. Si no puedes mantener esa disciplina, contrata a quien pueda.",
    author: "Benjamin Graham",
    source: "El inversor inteligente, cap. 1",
  },
  {
    text: "Invertir es sencillo, pero no fácil. Cualquiera puede entender la idea; muy pocos consiguen ejecutarla durante cuatro décadas sin salirse.",
    author: "Warren Buffett",
    source: "Junta anual de Berkshire Hathaway, 2004",
  },
  {
    text: "Ten cuidado cuando el consenso sea eufórico; redobla la cautela cuando el consenso sea desesperado. En ambos extremos, las oportunidades son inversas a la narrativa.",
    author: "Howard Marks",
    source: "Dominando el ciclo del mercado, cap. 3",
  },
  {
    text: "El ciclo es la única constante del mercado. Ni optimista ni pesimista: realista sobre dónde estás en el ciclo y ajustando tu postura en consecuencia.",
    author: "Howard Marks",
    source: "Dominando el ciclo del mercado, introducción",
  },
  {
    text: "No hay que ser genio; basta con ser más estable de cabeza que el resto. En un mercado lleno de nervios, la estabilidad psicológica es un activo raro.",
    author: "Howard Marks",
    source: "Dominando el ciclo del mercado, cap. 1",
  },
  {
    text: "Pensar al contrario no es negar el consenso automáticamente; es preguntar por qué todos creen lo mismo y si esa creencia ya está en el precio.",
    author: "Howard Marks",
    source: "Lo más importante, cap. 11",
  },
  {
    text: "El miedo profesional, la ansiedad por quedarse fuera, es lo que empuja a los gestores a comprar caro y vender barato junto con el resto, en contra de sus clientes.",
    author: "Howard Marks",
    source: "Memo: On the Couch, 2016",
  },
  {
    text: "La humildad de decir 'no sé' es un activo financiero. Muchos gestores se arruinan por miedo a parecer ignorantes ante clientes que solo quieren seguridad.",
    author: "Howard Marks",
    source: "Memo: Uncommon Sense, 2017",
  },
  {
    text: "Un negocio modesto comprado barato suele rentar más que un negocio excepcional comprado caro. El precio de entrada cambia la geometría de todo.",
    author: "Howard Marks",
    source: "Lo más importante, cap. 4",
  },
  {
    text: "El mayor error en inversión es vender algo bueno porque subió. Si la empresa sigue siendo excelente y tu tesis sigue viva, deja correr los beneficios.",
    author: "Peter Lynch",
    source: "Un paso por delante de Wall Street, cap. 15",
  },
  {
    text: "El arma secreta del inversor pequeño es la paciencia. Él puede esperar; Wall Street, con sus trimestres, no. Convierte esa asimetría en capital.",
    author: "Peter Lynch",
    source: "Un paso por delante de Wall Street, cap. 1",
  },
  {
    text: "Mira lo que poseen los que de verdad han creado riqueza durante generaciones. Casi nunca ves brillo; ves aburrimiento, constancia, paciencia y poco gasto visible.",
    author: "Thomas J. Stanley",
    source: "El millonario de al lado, cap. 1",
  },
  {
    text: "Los millonarios verdaderos están más preocupados por la independencia financiera que por el estatus social. Esos dos incentivos dan vidas muy distintas.",
    author: "Thomas J. Stanley",
    source: "El millonario de al lado, cap. 1",
  },
  {
    text: "La mayor parte del dinero que pierdes de viejo se debió a decisiones que tomaste de joven porque tenías prisa. Ralentiza ahora, y no pagarás intereses luego.",
    author: "Adaptado de Warren Buffett",
    source: "Entrevista con estudiantes, 2008",
  },
  {
    text: "Si no tienes por lo menos seis meses de gastos guardados, toda tu carrera la vas a tomar en posición de debilidad. Ese colchón paga dividendos de dignidad.",
    author: "Suze Orman",
    source: "The Money Class, cap. 3",
  },
  {
    text: "Los pequeños hábitos crean grandes resultados. Un 1% más eficiente en cada categoría de gasto al año, repetido durante treinta años, cambia tu vida completa.",
    author: "James Clear",
    source: "Hábitos atómicos, cap. 1",
  },
];
