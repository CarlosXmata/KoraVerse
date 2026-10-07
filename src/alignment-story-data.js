// Personal narrative supplied for this expansion. No inferred biography.
export const KORA_BIRTH_YEAR=null
export const STORY_DATES={arrival:'2025-10-03',encounter:'2025-10-12',encounterApproximate:true,celebration:'2026-10-10'}
const page=(es,en,duration=5500)=>({lines:{es,en},duration})
const scene=(id,chapter,title,enTitle,visual,pages,extra={})=>({id,chapter,title:{es:title,en:enTitle},visual,pages,duration:pages.reduce((n,p)=>n+p.duration,0),transition:'dissolve',...extra})
export const ALIGNMENT_STORY={id:'two-orbits',title:{es:'Revivir mi alineación',en:'Relive my alignment'},perspective:{es:'Una historia desde la mirada de Carlos',en:'A story through Carlos’s eyes'},scenes:[
 scene('before-name',0,'Antes del nombre','Before the name','single-star',[
  page(['Hay personas que no llegan de golpe.','Primero se sienten.','Luego se intuyen.'],['Some people do not arrive all at once.','First, they are felt.','Then, sensed.']),
  page(['Y solo después…','el universo se atreve a ponerles nombre.'],['And only later…','does the universe dare to give them a name.'])
 ],{audioCue:'silence',roseCue:'closed'}),
 scene('new-light',1,'Cuando nació una nueva luz','When a new light was born','small-world',[
  page(['En algún momento después del año 2001,','cuando el siglo todavía estaba aprendiendo a comenzar,','nació una luz nueva.'],['Sometime after the year 2001,','when the century was still learning how to begin,','a new light was born.']),
  page(['No hizo ruido.','No pidió ser admirada.','Simplemente apareció…'],['It made no noise.','It did not ask to be admired.','It simply appeared…']),
  page(['con esa clase de brillo','que algún día iba a cambiar','la órbita de alguien más.'],['with the kind of light','that would one day change','someone else’s orbit.'])
 ],{audioCue:'bell',roseCue:'closed',metadata:{birthYearUnknown:true}}),
 scene('girl-and-rose',2,'La niña y la rosa','The girl and the rose','rose-dome',[
  page(['Algunas almas nacen','como si trajeran jardín adentro.'],['Some souls are born','as though they carry a garden within.']),
  page(['Como si incluso antes de aprender a nombrar el mundo','ya supieran cuidar la ternura,','la belleza','y esas cosas pequeñas que después terminan siendo eternas.'],['As though even before learning to name the world,','they already knew how to care for tenderness,','beauty,','and small things that later become lasting.'],8000),
  page(['Hay flores hermosas en muchos rincones del universo.','Pero, de vez en cuando,','nace una que no se parece a ninguna otra.'],['There are beautiful flowers throughout the universe.','But once in a while,','one is born unlike any other.']),
  page(['No porque sea perfecta.','Sino porque un día,','para alguien,','terminaría siendo única.'],['Not because it is perfect.','But because one day,','for someone,','it would become unique.'])
 ],{audioCue:'warm',roseCue:'closed'}),
 scene('silent-years',3,'Los años en silencio','The silent years','passing-years',[
  page(['El tiempo siguió haciendo lo suyo.','Los años pasaron.','Las estaciones cambiaron.'],['Time kept doing what it does.','The years passed.','The seasons changed.']),
  page(['La vida fue guardando aprendizajes,','risas, cansancios','y pequeños milagros.'],['Life gathered things learned,','laughter, weariness','and small miracles.']),
  page(['Y mientras tanto,','esa estrella siguió creciendo.'],['And meanwhile,','that star kept growing.']),
  page(['Sin saber que, en otro extremo del cielo,','alguien algún día aprendería a reconocerla','incluso antes de comprenderla.'],['Not knowing that, at the other end of the sky,','someone would one day learn to recognize it','even before understanding it.'])
 ],{audioCue:'pad',metadata:{yearsAreDecorative:true}}),
 scene('arrival',4,'Un lugar nuevo','A new place','star-corridor',[
  page(['El 3 de octubre de 2025','entré a un lugar nuevo.'],['On October 3, 2025,','I entered a new place.']),
  page(['No sabía exactamente qué iba a encontrar.','Ni lo que el tiempo estaba preparando','detrás de una rutina cualquiera.'],['I did not know exactly what I would find.','Or what time was preparing','behind an ordinary routine.']),
  page(['A veces el destino no entra con trompetas.','A veces se disfraza de pasillo, escritorio,','jornada normal y un día cualquiera.'],['Sometimes destiny arrives without fanfare.','Sometimes it looks like a corridor, a desk,','an ordinary shift on an ordinary day.']),
  page(['Ese día todavía no tenía su historia.','Tal vez ni siquiera su voz.','Pero su presencia','ya caminaba cerca de mi destino.'],['That day, I did not yet know her story.','Perhaps not even her voice.','But her presence','was already walking close to my path.'],7500)
 ],{dateKey:'arrival',audioCue:'echo',starCue:'distant'}),
 scene('between-days',5,'Entre el 3 y el 12','Between the 3rd and the 12th','signal-trails',[
  page(['Antes de conocer de verdad ciertas presencias,','uno aprende a sentirlas.'],['Before truly knowing certain presences,','we learn to feel them.']),
  page(['Como si el alma tuviera una forma secreta','de adelantarse a los hechos.'],['As though the soul had a secret way','of getting ahead of events.']),
  page(['Como si el universo susurrara:','«Todavía no sabes quién es.','Pero algo en ti','ya está mirando en esa dirección.»'],['As though the universe were whispering:','“You do not yet know who she is.','But something in you','is already looking that way.”'],7500)
 ],{audioCue:'pad'}),
 scene('recognition',6,'Cuando cambió la gravedad','When gravity changed','meeting-orbits',[
  page(['Y entonces llegó octubre.','El día 12, o quizá un poco alrededor de él,','el universo dejó de insinuar','y empezó a pronunciar.'],['And then October arrived.','On the 12th, or perhaps somewhere around it,','the universe stopped hinting','and began to speak.'],7500),
  page(['Ya no era solamente una presencia alrededor.','Era ella.'],['She was no longer just a presence nearby.','It was her.']),
  page(['Hay fechas que no cambian el calendario.','Cambian la gravedad.'],['Some dates do not change the calendar.','They change gravity.']),
  page(['Y octubre de 2025','fue una de esas fechas.'],['And October 2025','was one of those dates.'])
 ],{dateKey:'encounter',audioCue:'harmony',roseCue:'open',starCue:'named'}),
 scene('unique-rose',7,'La rosa única','The unique rose','rose-orbits',[
  page(['Hay encuentros que no se explican con lógica.','Se explican con cuidado.','Con tiempo.'],['Some encounters cannot be explained by logic.','They are explained by care.','By time.']),
  page(['Con esa extraña certeza de que,','entre todas las posibilidades del universo,','algo en ti decidió quedarse mirando una sola flor.'],['By that strange certainty that,','among all the possibilities in the universe,','something in you chose to keep looking at one flower.']),
  page(['No era una rosa más.','Era esa clase de presencia','que vuelve único el tiempo que uno le dedica','y especial el rincón del cielo en que aparece.'],['It was not just another rose.','It was the kind of presence','that makes the time you give it unique','and its corner of the sky special.'],7500)
 ],{audioCue:'warm',roseCue:'open'}),
 scene('celebration',8,'Un día para celebrarla','A day to celebrate her','golden-alignment',[
  page(['Y llegó el día de celebrarla.','No como se celebran los días comunes.'],['And the day came to celebrate her.','Not as ordinary days are celebrated.']),
  page(['Sino como se celebra aquello','que vuelve más hermoso un universo entero.'],['But as we celebrate something','that makes an entire universe more beautiful.']),
  page(['Hay personas cuya existencia','no solamente suma un año.','Suma sentido. Suma luz.','Suma una manera más amable de mirar el mundo.'],['Some people’s existence','adds more than a year.','It adds meaning. It adds light.','A kinder way of seeing the world.'],7500),
  page(['Hoy el universo gira un poco más bonito.'],['Today the universe turns a little more beautifully.']),
  page(['Feliz cumpleaños, Kora.'],['Happy birthday, Kora.'])
 ],{dateKey:'celebration',audioCue:'harmony',roseCue:'constellation'}),
 scene('present',9,'El presente','The present','two-stars',[
  page(['Hoy vuelvo aquí','no para repetir el pasado,','sino para honrar el instante','en que el universo cambió de forma.'],['Today I return here','not to repeat the past,','but to honor the moment','when the universe changed shape.'],7500),
  page(['Porque algunas personas llegan','y simplemente pasan.','Pero otras…'],['Because some people arrive','and simply pass through.','But others…']),
  page(['otras llegan','y se quedan orbitando.'],['others arrive','and stay in orbit.'])
 ],{audioCue:'pad',roseCue:'constellation'}),
 scene('closing',10,'Lo que queda en el cielo','What stays in the sky','quiet-sky',[
  page(['Si alguna vez el cielo preguntara','cuándo comenzó todo,','yo diría:'],['If the sky ever asked','when it all began,','I would say:']),
  page(['quizá el 12 de octubre de 2025.','O quizá antes.','Quizá desde el 3.'],['perhaps October 12, 2025.','Or perhaps before.','Perhaps from the 3rd.']),
  page(['Quizá desde el primer instante','en que el universo decidió','acercar nuestras órbitas.'],['Perhaps from the very first moment','when the universe decided','to bring our orbits closer.']),
  page(['Hay presencias que no se olvidan.','Porque una vez que entran en tu cielo,','ya forman parte de él.'],['Some presences are never forgotten.','Because once they enter your sky,','they become part of it.'])
 ],{audioCue:'ending',roseCue:'constellation'})
]}
export function storyScenes({birthYear=KORA_BIRTH_YEAR,dates=STORY_DATES}={}){
 if(birthYear!==null&&(!Number.isInteger(birthYear)||birthYear<2001||birthYear>new Date().getFullYear()))throw Error('Birth year must be explicitly confirmed')
 return ALIGNMENT_STORY.scenes.map(s=>{
  const copy={...s,pages:s.pages.map(p=>({...p,lines:{es:[...p.lines.es],en:[...p.lines.en]}})),date:s.dateKey?dates[s.dateKey]:null,approximate:s.dateKey==='encounter'&&dates.encounterApproximate}
  if(s.id==='new-light'&&birthYear!==null){copy.pages[0].lines={es:[`En el año ${birthYear},`,'nació una luz nueva.'],en:[`In ${birthYear},`,'a new light was born.']};copy.metadata={birthYearConfirmed:true}}
  // Dates and prose stay coordinated when Carlos confirms a correction.
  const label=(key,language)=>new Intl.DateTimeFormat(language==='es'?'es':'en',{day:'numeric',month:'long',year:'numeric',timeZone:'UTC'}).format(new Date(dates[key]+'T12:00:00Z'))
  if(s.id==='arrival'){copy.pages[0].lines.es[0]=`El ${label('arrival','es')}`;copy.pages[0].lines.en[0]=`On ${label('arrival','en')},`}
  if(s.id==='between-days'){const day=key=>Number(dates[key].slice(-2));copy.title={es:`Entre el ${day('arrival')} y el ${day('encounter')}`,en:`Between ${label('arrival','en')} and ${label('encounter','en')}`}}
  if(s.id==='recognition'){copy.pages[0].lines.es[1]=dates.encounterApproximate?`El ${label('encounter','es')}, o quizá alrededor de él,`:`El ${label('encounter','es')},`;copy.pages[0].lines.en[1]=dates.encounterApproximate?`On ${label('encounter','en')}, or somewhere around it,`:`On ${label('encounter','en')},`}
  if(s.id==='recognition'){const when=new Date(dates.encounter+'T12:00:00Z'),month=language=>new Intl.DateTimeFormat(language,{month:'long',timeZone:'UTC'}).format(when),period=language=>new Intl.DateTimeFormat(language,{month:'long',year:'numeric',timeZone:'UTC'}).format(when);copy.pages[0].lines.es[0]=`Y entonces llegó ${month('es')}.`;copy.pages[0].lines.en[0]=`And then ${month('en')} arrived.`;copy.pages[3].lines.es[0]=`Y ${period('es')}`;copy.pages[3].lines.en[0]=`And ${period('en')}`}
  if(s.id==='closing'){copy.pages[1].lines.es=[`quizá el ${label('encounter','es')}.`,'O quizá antes.',`Quizá desde el ${label('arrival','es')}.`];copy.pages[1].lines.en=[`perhaps ${label('encounter','en')}.`,'Or perhaps before.',`Perhaps from ${label('arrival','en')}.`]}
  return copy
 })
}
export const PROPHECY_SCENE=scene('prophecy',11,'La Constelación del Sí','The constellation of yes','prophecy-rings',[
 page(['Los astrónomos de KORAVERSE','no se ponen completamente de acuerdo…'],['KORAVERSE’s astronomers','do not entirely agree…']),
 page(['pero algunos juran que en 2027','el universo ya estaba ensayando campanas.'],['but some swear that in 2027','the universe was already rehearsing bells.']),
 page(['A veces el universo no revela el futuro.','Solo deja pequeñas pistas','de lo hermoso que todavía quiere escribir.'],['Sometimes the universe does not reveal the future.','It leaves small hints','of the beauty it still wants to write.'])
],{audioCue:'bell',metadata:{fiction:true,unconfirmed:true}})
