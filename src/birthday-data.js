// Shared literary content. Nothing in this file is a private Sanctuary text.
export const BIRTHDAY = {
  id:'alignment-2026', protagonist:'kora', date:'2026-10-10', timeZone:'America/Santo_Domingo',
  phases:{'birthday-prelude':['2026-10-08','2026-10-09'],'birthday-alignment':['2026-10-10','2026-10-10'],'birthday-afterglow':['2026-10-11','2026-10-11']},
  starName:'Aurelia', constellation:'rosa-decem', fictional:true,
  name:{es:'La Alineación 10/10',en:'The 10/10 Alignment'},
  prelude:{es:['Parece que el cielo está preparando algo.','Algunas estrellas llevan días moviéndose.','Hay algo distinto en las órbitas.'],en:['The sky seems to be preparing something.','Some stars have been moving for days.','Something has changed in the orbits.']},
  narrative:{es:'Algunas fechas merecen que hasta el universo cambie de lugar.',en:'Some dates deserve even the universe to change its place.'},
  greeting:{es:'Feliz cumpleaños, Kora.',en:'Happy birthday, Kora.'},
  alignmentLine:{es:'Hoy el universo gira un poco más bonito.',en:'Today the universe turns a little more beautifully.'},
  afterglow:{es:'Las órbitas vuelven a casa. La luz se queda.',en:'The orbits return home. The light stays.'},
  starStory:{es:'Aquí el universo se salió un momento de su camino.',en:'Here, the universe stepped out of its path for a moment.'},
  fragment:{es:'Algunas fechas pasan.\nOtras se quedan viviendo en el cielo.',en:'Some dates pass.\nOthers stay living in the sky.'},
  // Milliseconds of visible time. Hidden tabs do not advance this clock.
  sequence:[
    {at:0,stage:'night'},{at:1500,stage:'stars'},{at:3000,stage:'drift'},
    {at:4500,stage:'worlds'},{at:7000,stage:'orbits'},{at:9000,stage:'approach'},
    {at:11000,stage:'aligned'},{at:12500,stage:'silence'},{at:14000,stage:'wave'},
    {at:16000,stage:'rose'},{at:19000,stage:'date'},{at:22000,stage:'line'},
    {at:25500,stage:'greeting'},{at:28000,stage:'wish'},{at:30500,stage:'avatar'},
    {at:35000,stage:'complete'}
  ], reducedDuration:1800, audio:{quietFactor:.15,noteFrequency:523.25,noteDuration:3},
  roses:[
    {id:1,key:'calma',title:'Tu calma',enTitle:'Your calm',text:'Hay una forma tuya de estar que baja el volumen del mundo. No lo hace desaparecer; lo vuelve habitable.',en:'The way you are lowers the volume of the world. It does not make it disappear; it makes it livable.'},
    {id:2,key:'inteligencia',title:'Tu inteligencia',enTitle:'Your intelligence',text:'Ves detalles que otros dejan pasar. A veces basta una pregunta tuya para que todo encuentre otra perspectiva.',en:'You notice what others pass by. Sometimes one question from you gives everything another perspective.'},
    {id:3,key:'sensibilidad',title:'Tu sensibilidad',enTitle:'Your sensitivity',text:'No todo el mundo sabe reconocer lo pequeño. Tú encuentras lo que late incluso cuando nadie lo está mirando.',en:'Not everyone notices the small things. You find what is alive even when no one is watching.'},
    {id:4,key:'principios',title:'Tus principios',enTitle:'Your principles',text:'Hay una brújula dentro de ti. No necesita hacer ruido para recordarte quién quieres ser.',en:'There is a compass inside you. It does not need to make noise to remind you who you want to be.'},
    {id:5,key:'autenticidad',title:'Tu autenticidad',enTitle:'Your authenticity',text:'No hay otra manera de ser tú. Y en un mundo lleno de versiones, eso tiene una belleza difícil de imitar.',en:'There is no other way to be you. In a world full of versions, that has a beauty difficult to imitate.'},
    {id:6,key:'curiosidad',title:'Tu curiosidad',enTitle:'Your curiosity',text:'Todavía haces espacio para una pregunta nueva. Por ahí entran los mundos que aún no conocemos.',en:'You still make room for a new question. That is where the worlds we do not yet know can enter.'},
    {id:7,key:'elegancia',title:'Tu elegancia',enTitle:'Your elegance',text:'No vive solamente en cómo te ves. También está en la delicadeza con la que eliges ciertas palabras.',en:'It does not live only in how you look. It is also in the care with which you choose certain words.'},
    {id:8,key:'escucha',title:'Tu manera de escuchar',enTitle:'The way you listen',text:'Escuchar también puede ser una forma de cuidar. Contigo, una frase puede llegar hasta el final sin sentirse sola.',en:'Listening can be a way of caring. With you, a sentence can reach its end without feeling alone.'},
    {id:9,key:'presencia',title:'Tu presencia',enTitle:'Your presence',text:'No siempre se necesita hacer algo extraordinario. Hay personas cuya llegada ya cambia la luz de un lugar.',en:'Something extraordinary is not always needed. Some people change the light of a place simply by arriving.'},
    {id:10,key:'esencia',title:'Y después estás tú',enTitle:'And then there is you',gold:true,text:'Y después estás tú.\nAlgunas personas son difíciles de resumir incluso después de diez intentos.',en:'And then there is you.\nSome people are difficult to sum up, even after ten attempts.'}
  ]
}
export const UNIVERSE_EVENTS = [BIRTHDAY] // Add another event with its own ID, date, phases and time zone.
export const CONSTELLATIONS = [
  {id:'signals',name:'Constelación de las Señales',en:'Signals',types:['signal','sketch'],anchor:[22,28]},
  {id:'coffee',name:'Constelación del Café',en:'Coffee',types:['coffee'],anchor:[73,26]},
  {id:'ludus',name:'Ludus',en:'Ludus',types:['game','chess','sudoku','duo'],anchor:[31,68]},
  {id:'quietus',name:'Quietus',en:'Quietus',types:['quiet','learning'],anchor:[74,66]},
  {id:'first-encounter',name:'Constelación del Primer Encuentro',en:'First Encounter',types:['visit'],anchor:[48,44]},
  {id:'rosa-decem',name:'Rosa Decem',en:'Rosa Decem',types:['birthday','alignment','roses'],anchor:[51,23]}
]
export const ORIGIN_CHAPTERS=['I. Antes de darme cuenta','II. Las primeras señales','III. Cuando dejó de ser casual','IV. Cuando ya era demasiado tarde','V. Lo que nunca dije']
