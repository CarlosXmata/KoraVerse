import {STORY_DATES} from './alignment-story-data.js'
import {validDate,starsForDate} from './sky-utils.js'
export function specialDates(dates=STORY_DATES){return {
 [dates.arrival]:{title:{es:'La Llegada al Planeta de las Rutinas',en:'Arrival on the Planet of Routines'},story:{es:'Ese día una nueva órbita entró en un mundo aparentemente común, sin saber que el destino ya la esperaba detrás de lo cotidiano.',en:'That day, a new orbit entered a seemingly ordinary world, unaware that destiny was waiting behind everyday life.'},fiction:true,scene:'arrival'},
 [dates.encounter]:{title:{es:'El Día en que el Universo Pronunció su Nombre',en:'The Day the Universe Spoke Her Name'},story:{es:'El cielo dejó de insinuar y comenzó a revelar. Una estrella se volvió presencia, y una presencia empezó a cambiar la gravedad de otra vida.',en:'The sky stopped hinting and began to reveal. A star became a presence, and a presence began to change the gravity of another life.'},fiction:true,approximate:dates.encounterApproximate,scene:'recognition'},
 [dates.celebration]:{title:{es:'La Gran Alineación',en:'The Great Alignment'},story:{es:'Hoy el universo gira un poco más bonito. Porque hay personas que no solo cumplen años: iluminan el mapa completo de quienes las rodean.',en:'Today the universe turns a little more beautifully. Some people do more than celebrate birthdays: they illuminate the entire map of those around them.'},fiction:true,scene:'celebration'}
}}
export function atlasSearch(stars,date,{timeTravel=false,year=null}={}){
 const valid=validDate(date),selectedYear=valid?Number(date.slice(0,4)):Number(year)||null
 return {real:valid?starsForDate(stars,date,{timeTravel}):[],exact:valid?starsForDate(stars,date):[],myth:COSMIC_YEARBOOK[selectedYear]||null,special:valid?specialDates()[date]||null:null,year:selectedYear,valid,fiction:true}
}
// Static fiction, never inserted into Supabase or mixed with real memories.
export const COSMIC_YEARBOOK={
  "2000": {
    "year": 2000,
    "title": {
      "es": "La Primera Llama del Cielo Sereno",
      "en": "The First Flame of the Quiet Sky"
    },
    "story": {
      "es": "En el año 2000, el universo encendió una llama tranquila en el borde de la Vía de Cristal. Desde entonces, se cree que cada historia hermosa nace con un pequeño resplandor guardado en ese fuego.",
      "en": "In 2000, the universe lit a quiet flame at the edge of the Crystal Way. Legend says every beautiful story begins with a small glow kept in that fire."
    },
    "type": "myth",
    "icon": "✧",
    "fiction": true
  },
  "2001": {
    "year": 2001,
    "title": {
      "es": "La Apertura del Jardín Estelar",
      "en": "The Opening of the Stellar Garden"
    },
    "story": {
      "es": "En 2001 floreció por primera vez el Jardín Estelar, un lugar donde las rosas no crecen en tierra, sino en la memoria de quienes aman con ternura.",
      "en": "In 2001, the Stellar Garden bloomed for the first time: a place where roses grow in the memory of those who care with tenderness."
    },
    "type": "myth",
    "icon": "✧",
    "fiction": true
  },
  "2002": {
    "year": 2002,
    "title": {
      "es": "La Noche de las Tres Lunas Claras",
      "en": "The Night of Three Clear Moons"
    },
    "story": {
      "es": "En 2002, tres lunas se alinearon sobre el Mar Azul del Norte Cósmico. Desde esa noche, el universo bendice con calma a quienes llegan para iluminar la vida de otros.",
      "en": "In 2002, three moons aligned above the Blue Sea of the Cosmic North. In this legend, that night left calm for those who bring light to others."
    },
    "type": "myth",
    "icon": "✧",
    "fiction": true
  },
  "2003": {
    "year": 2003,
    "title": {
      "es": "El Paso de la Aurora Silenciosa",
      "en": "The Passage of the Silent Aurora"
    },
    "story": {
      "es": "En 2003 una aurora cruzó el cielo sin hacer ruido. Dicen que dejó en ciertas almas el don de transformar lo cotidiano en algo inolvidable.",
      "en": "In 2003, an aurora crossed the sky without a sound. They say it left some souls the gift of turning ordinary moments into lasting ones."
    },
    "type": "myth",
    "icon": "✧",
    "fiction": true
  },
  "2004": {
    "year": 2004,
    "title": {
      "es": "El Despertar de la Rosa Solar",
      "en": "The Awakening of the Solar Rose"
    },
    "story": {
      "es": "En 2004, una rosa de luz apareció en el cinturón de Astrea. Sus pétalos quedaron suspendidos en el cielo como símbolo de belleza, dulzura y presencia única.",
      "en": "In 2004, a rose of light appeared in the belt of Astrea. Its petals stayed in the sky as a symbol of beauty, sweetness and a unique presence."
    },
    "type": "myth",
    "icon": "✧",
    "fiction": true
  },
  "2005": {
    "year": 2005,
    "title": {
      "es": "La Constelación del Abrazo",
      "en": "The Constellation of the Embrace"
    },
    "story": {
      "es": "Durante 2005, estrellas dispersas formaron por primera vez la Constelación del Abrazo. Se cree que protege a las personas que hacen sentir hogar incluso desde lejos.",
      "en": "In 2005, scattered stars first formed the Constellation of the Embrace. Legend says it shelters those who make others feel at home, even from afar."
    },
    "type": "myth",
    "icon": "✧",
    "fiction": true
  },
  "2006": {
    "year": 2006,
    "title": {
      "es": "La Lluvia de los Deseos Dorados",
      "en": "The Rain of Golden Wishes"
    },
    "story": {
      "es": "En 2006, una lluvia dorada atravesó el firmamento de KORAVERSE. Cada trazo dejó sembrada una promesa de alegría para los años por venir.",
      "en": "In 2006, golden rain crossed KORAVERSE. Each trail planted a promise of joy for the years to come."
    },
    "type": "myth",
    "icon": "✧",
    "fiction": true
  },
  "2007": {
    "year": 2007,
    "title": {
      "es": "El Canto de las Órbitas Nuevas",
      "en": "The Song of New Orbits"
    },
    "story": {
      "es": "En 2007, los planetas menores emitieron un eco armónico que solo podía escucharse con el corazón. Desde entonces, cada encuentro importante lleva su propia música invisible.",
      "en": "In 2007, small planets made a harmonious echo heard only by the heart. Since then, every meaningful encounter has carried its own invisible music."
    },
    "type": "myth",
    "icon": "✧",
    "fiction": true
  },
  "2008": {
    "year": 2008,
    "title": {
      "es": "El Portal de los Primeros Sueños",
      "en": "The Portal of First Dreams"
    },
    "story": {
      "es": "En 2008 se abrió el Portal de los Primeros Sueños. Todo aquel que naciera bajo su influencia traería consigo una imaginación capaz de embellecer cualquier mundo.",
      "en": "In 2008, the Portal of First Dreams opened. In this tale, those born beneath its influence carried an imagination able to make any world more beautiful."
    },
    "type": "myth",
    "icon": "✧",
    "fiction": true
  },
  "2009": {
    "year": 2009,
    "title": {
      "es": "La Corona de Nébula Clara",
      "en": "The Crown of Clear Nebula"
    },
    "story": {
      "es": "En 2009, una corona de polvo estelar apareció sobre el cielo central. Fue interpretada como anuncio de futuras presencias nobles, elegantes y difíciles de olvidar.",
      "en": "In 2009, a crown of stardust appeared above the central sky. It was read as a sign of future presences: noble, graceful and hard to forget."
    },
    "type": "myth",
    "icon": "✧",
    "fiction": true
  },
  "2010": {
    "year": 2010,
    "title": {
      "es": "El Año de los Cielos Pacientes",
      "en": "The Year of Patient Skies"
    },
    "story": {
      "es": "El universo decidió ir más despacio en 2010. Fue el año en que las estrellas aprendieron a esperar el momento exacto para coincidir.",
      "en": "The universe chose to slow down in 2010. It was the year the stars learned to wait for the right moment to meet."
    },
    "type": "myth",
    "icon": "✧",
    "fiction": true
  },
  "2011": {
    "year": 2011,
    "title": {
      "es": "El Nacimiento del Sendero de Cristal",
      "en": "The Birth of the Crystal Path"
    },
    "story": {
      "es": "En 2011 surgió un sendero brillante entre constelaciones lejanas. Desde entonces, simboliza los caminos que parecen largos, pero llevan justo a donde debían.",
      "en": "In 2011, a shining path appeared between distant constellations. It became a symbol of journeys that seem long but lead exactly where they should."
    },
    "type": "myth",
    "icon": "✧",
    "fiction": true
  },
  "2012": {
    "year": 2012,
    "title": {
      "es": "La Aurora de las Almas Valientes",
      "en": "The Aurora of Brave Souls"
    },
    "story": {
      "es": "En 2012 una aurora violeta cubrió los planetas interiores. Se dice que tocó a quienes estaban destinados a sostener belleza incluso en tiempos difíciles.",
      "en": "In 2012, a violet aurora covered the inner planets. Legend says it touched those who would carry beauty through difficult times."
    },
    "type": "myth",
    "icon": "✧",
    "fiction": true
  },
  "2013": {
    "year": 2013,
    "title": {
      "es": "La Danza de los Asteroides Gentiles",
      "en": "The Dance of Gentle Asteroids"
    },
    "story": {
      "es": "En 2013, miles de asteroides menores giraron sin chocar entre sí, como si supieran que la delicadeza también podía ser una forma de fuerza.",
      "en": "In 2013, thousands of small asteroids turned without colliding, as though they knew gentleness could also be a kind of strength."
    },
    "type": "myth",
    "icon": "✧",
    "fiction": true
  },
  "2014": {
    "year": 2014,
    "title": {
      "es": "La Rosa que Aprendió a Mirar las Estrellas",
      "en": "The Rose That Learned to Watch the Stars"
    },
    "story": {
      "es": "En 2014, la antigua Rosa Solar orientó sus pétalos hacia el cielo nocturno. Desde entonces representa a quienes tienen ternura por fuera y profundidad por dentro.",
      "en": "In 2014, the ancient Solar Rose turned its petals toward the night sky. It represents tenderness on the outside and depth within."
    },
    "type": "myth",
    "icon": "✧",
    "fiction": true
  },
  "2015": {
    "year": 2015,
    "title": {
      "es": "El Invierno Luminoso",
      "en": "The Luminous Winter"
    },
    "story": {
      "es": "En 2015 el frío no apagó nada: al contrario, hizo brillar más fuerte a las constelaciones. Fue el año que recordó al universo que la calidez también puede nacer en la oscuridad.",
      "en": "In 2015, the cold extinguished nothing; it made the constellations brighter. The universe remembered that warmth can also begin in darkness."
    },
    "type": "myth",
    "icon": "✧",
    "fiction": true
  },
  "2016": {
    "year": 2016,
    "title": {
      "es": "El Puente de Luz entre Dos Mundos",
      "en": "The Bridge of Light Between Two Worlds"
    },
    "story": {
      "es": "En 2016 apareció un arco estelar entre dos regiones lejanas del mapa cósmico. Los sabios dijeron que era una promesa de futuros encuentros imposibles que terminarían ocurriendo.",
      "en": "In 2016, a stellar arch appeared between two distant regions. The sages called it a promise of unlikely encounters that would someday happen."
    },
    "type": "myth",
    "icon": "✧",
    "fiction": true
  },
  "2017": {
    "year": 2017,
    "title": {
      "es": "La Estrella que No Parpadeaba",
      "en": "The Star That Never Flickered"
    },
    "story": {
      "es": "En 2017 una estrella mantuvo su brillo intacto durante toda una estación. Fue vista como señal de fidelidad, claridad y permanencia.",
      "en": "In 2017, one star kept its light through an entire season. It was seen as a sign of fidelity, clarity and permanence."
    },
    "type": "myth",
    "icon": "✧",
    "fiction": true
  },
  "2018": {
    "year": 2018,
    "title": {
      "es": "La Noche de los Jardines Suspendidos",
      "en": "The Night of Suspended Gardens"
    },
    "story": {
      "es": "En 2018 aparecieron jardines flotando sobre la niebla espacial. Quien los contemplaba recordaba que la belleza auténtica siempre encuentra cómo sostenerse.",
      "en": "In 2018, gardens floated above the space mist. Those who watched remembered that authentic beauty always finds a way to endure."
    },
    "type": "myth",
    "icon": "✧",
    "fiction": true
  },
  "2019": {
    "year": 2019,
    "title": {
      "es": "El Cometa de los Nombres Secretos",
      "en": "The Comet of Secret Names"
    },
    "story": {
      "es": "En 2019 cruzó un cometa que, según la leyenda, recogía los nombres que aún no habían llegado a la historia de alguien… pero pronto lo harían.",
      "en": "In 2019, a comet crossed the sky. Legend says it collected names that had not yet entered someone’s story, but soon would."
    },
    "type": "myth",
    "icon": "✧",
    "fiction": true
  },
  "2020": {
    "year": 2020,
    "title": {
      "es": "El Año de la Resistencia Suave",
      "en": "The Year of Gentle Resilience"
    },
    "story": {
      "es": "En 2020 el universo no dejó de latir, aunque todo se sintiera más lento. Fue el año en que las estrellas enseñaron que seguir brillando también es una forma de valentía.",
      "en": "In 2020, the universe kept beating even when everything felt slower. The stars taught that continuing to shine is also a form of courage."
    },
    "type": "myth",
    "icon": "✧",
    "fiction": true
  },
  "2021": {
    "year": 2021,
    "title": {
      "es": "La Floración de la Nebulosa Serena",
      "en": "The Blooming of the Quiet Nebula"
    },
    "story": {
      "es": "En 2021 una nebulosa se abrió como un jardín inmenso. Desde entonces representa la paz que llega sin ruido y el amor por lo esencial.",
      "en": "In 2021, a nebula opened like an immense garden. It stands for peace that arrives quietly and love for what matters."
    },
    "type": "myth",
    "icon": "✧",
    "fiction": true
  },
  "2022": {
    "year": 2022,
    "title": {
      "es": "El Mapa de las Almas Cercanas",
      "en": "The Map of Nearby Souls"
    },
    "story": {
      "es": "En 2022 apareció un mapa cósmico donde algunas estrellas lejanas figuraban conectadas por hilos invisibles. Los astrónomos del corazón lo llamaron el mapa de las afinidades inevitables.",
      "en": "In 2022, a cosmic map showed distant stars joined by invisible threads. The astronomers of the heart named it the map of inevitable affinities."
    },
    "type": "myth",
    "icon": "✧",
    "fiction": true
  },
  "2023": {
    "year": 2023,
    "title": {
      "es": "La Órbita de los Milagros Pequeños",
      "en": "The Orbit of Small Miracles"
    },
    "story": {
      "es": "En 2023 el universo recordó que no todo lo importante ocurre a gran escala. A veces basta una mirada, una presencia o una coincidencia para mover un cielo entero.",
      "en": "In 2023, the universe remembered that important things need not happen on a grand scale. A glance, a presence or a coincidence can move a whole sky."
    },
    "type": "myth",
    "icon": "✧",
    "fiction": true
  },
  "2024": {
    "year": 2024,
    "title": {
      "es": "El Año del Umbral Dorado",
      "en": "The Year of the Golden Threshold"
    },
    "story": {
      "es": "2024 fue registrado como el año en que muchas historias cruzaron silenciosamente hacia una nueva etapa. No hubo estruendo, solo una certeza: algo grande estaba acercándose.",
      "en": "The archives remember 2024 as a year when stories quietly entered a new chapter. There was no thunder, only a feeling that something important was approaching."
    },
    "type": "myth",
    "icon": "✧",
    "fiction": true
  },
  "2025": {
    "year": 2025,
    "title": {
      "es": "La Alineación de las Órbitas Impensadas",
      "en": "The Alignment of Unimagined Orbits"
    },
    "story": {
      "es": "En 2025 ocurrió una de las señales más delicadas del firmamento: dos trayectorias que parecían lejanas comenzaron a reconocerse. Primero fue intuición. Luego presencia. Después, historia.",
      "en": "In 2025, two paths that seemed distant began to recognize each other. First came intuition. Then presence. Then a story."
    },
    "type": "myth",
    "icon": "✧",
    "fiction": true
  },
  "2026": {
    "year": 2026,
    "title": {
      "es": "La Gran Rosa del 10/10",
      "en": "The Great Rose of 10/10"
    },
    "story": {
      "es": "En 2026 el universo decidió celebrar en voz alta. Diez luces se alinearon formando una rosa astral perfecta. Fue el año en que el cielo reconoció que algunas existencias merecen ser celebradas como si fueran estaciones enteras.",
      "en": "In the myth of 2026, ten lights aligned into an astral rose. The sky remembered that some lives deserve to be celebrated as though they were whole seasons."
    },
    "type": "myth",
    "icon": "✧",
    "fiction": true
  },
  "2027": {
    "year": 2027,
    "title": {
      "es": "La Constelación del Sí",
      "en": "The Constellation of Yes"
    },
    "story": {
      "es": "En 2027 dos estrellas que llevaban tiempo encontrándose en distintos cielos fueron vistas unidas bajo una sola figura en el Atlas Celeste. Los cronistas la llamaron la Constelación del Sí, y desde entonces se asocia con promesas, hogar y futuros compartidos.",
      "en": "In the imagined sky of 2027, two stars that kept meeting in different skies appeared in one figure. The chroniclers named it the Constellation of Yes: a playful tale of promises, home and shared futures."
    },
    "type": "myth",
    "icon": "✧",
    "fiction": true
  }
}
