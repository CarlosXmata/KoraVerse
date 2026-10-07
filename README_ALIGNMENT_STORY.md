# KORAVERSE 5.1 · Revivir mi alineación

Esta expansión añade una historia desde la mirada de Carlos y un archivo mítico al Atlas. Se abre desde «Revivir mi alineación» en cumpleaños, desde Atlas y desde las vistas del QA existente. La celebración original 10/10 tiene su propio botón y conserva su primera llegada automática.

La película completa dura 3:49 a velocidad normal: once capítulos, un espacio continuo, órbitas separadas, rosa, pequeño planeta, corredor abstracto, años decorativos y constelación. El texto aparece en fragmentos de una a cuatro líneas lógicas; en móvil pueden envolver. Ofrece pausa, salto al capítulo siguiente, selección de capítulo, reinicio, cierre, sonido opcional y regreso al mismo Atlas. Escape cierra y Espacio pausa fuera de botones/selectores. El foco se mantiene en el diálogo y se restaura al salir. El movimiento reducido mantiene toda la narración y detiene cámara, órbitas y partículas.

## Alcance acordado

Seguridad, Santuario, Machine Room, APIs, SQL, Service Worker y Realtime no se modificaron. El acceso a la nueva historia desde Santuario queda pendiente por la prioridad expresa de Carlos. Su acceso existente a la celebración original sigue funcionando. Esta expansión no requiere otra migración: se incluyen `supabase/migration_v5.sql` y `supabase/migration_v5_1.sql` originales para instalaciones que todavía las necesiten.

La nueva película y el archivo mítico no guardan progreso, XP, logros ni estrellas. En QA tampoco se guardan. El botón de sonido utiliza la preferencia ambiental existente; el resto de los controles solo afecta a esta reproducción.

## Textos personales y traducción

Los textos españoles proporcionados se conservaron y se dividieron en fragmentos para su lectura. Se añadieron traducciones al inglés, títulos de controles y etiquetas de ficción. Las frases de fechas se generan a partir de la configuración: muestran la fecha completa del encuentro y de la llegada en el cierre, para que una corrección futura llegue también a la prosa. Esa es la adaptación editorial; no se reemplazó la historia por otro relato. El anuario español conserva los 28 títulos y relatos proporcionados.

## Editar la historia

`src/alignment-story-data.js` contiene `ALIGNMENT_STORY.scenes`. Cada capítulo tiene `id`, `chapter`, `title`, `visual`, `pages`, `duration`, `transition` y sus señales de audio/rosa/estrella. Cada página contiene `lines.es`, `lines.en` y `duration` en milisegundos. El reproductor suma estas duraciones: conserve el total entre 120000 y 240000 para mantener el objetivo de 2–4 minutos. Actualice ambos idiomas cuando cambie un fragmento. Las metáforas gráficas son SVG/CSS originales, sin personajes, citas o ilustraciones de terceros.

## Año de nacimiento

`KORA_BIRTH_YEAR = null` es la configuración de producción. No se calcula la edad ni se infiere un año. La película usa el texto indeterminado proporcionado. Solo después de que Kora/Carlos confirme el año, cambie esa constante por un número, por ejemplo `2002` si ese fuera el dato confirmado. El capítulo de nacimiento sustituirá su primer fragmento por el año confirmado. No introduzca una fecha completa inventada. El validador acepta enteros desde 2001 hasta el año actual.

El QA tiene simulación explícita con un campo de año; no modifica esta constante ni guarda el dato. La vista local usa 2002 solo como ejemplo ficticio de prueba.

## Corregir fechas

Edite `STORY_DATES` al principio del mismo archivo:

```js
export const STORY_DATES = {
  arrival: '2025-10-03',
  encounter: '2025-10-12',
  encounterApproximate: true,
  celebration: '2026-10-10'
}
```

Use fechas ISO válidas. `arrival` es la entrada de Carlos a la empresa. `encounter` es el recuerdo aproximado de haberla reconocido: conserve `encounterApproximate: true` hasta confirmar una fecha exacta. Las etiquetas, el título del intervalo, la prosa de llegada/encuentro/cierre y las coordenadas especiales del Atlas toman estos valores. Revise manualmente el relato si la corrección cambia su significado o abarca meses distintos. Los tres textos poéticos de esas coordenadas están en `specialDates()` de `src/cosmic-yearbook.js`.

## Archivo mítico

`COSMIC_YEARBOOK` en `src/cosmic-yearbook.js` reúne los años 2000–2027. Son ficción de KORAVERSE, no astronomía ni biografía confirmada. La búsqueda de una fecha presenta primero los recuerdos reales del día; debajo muestra el relato del año y, cuando corresponde, la coordenada poética. Viaje temporal sigue mostrando solo recuerdos reales que existían hasta ese día. Elegir solo un año permite explorar su mito y pide elegir un día para los recuerdos reales.

2027 contiene «La Constelación del Sí», un guiño con estado «profecía no confirmada», y una breve reproducción independiente. La estrella hueca y tenue ✧ abre el archivo; nunca se incorpora a las estrellas guardadas ✦.

## Ejecutar y desplegar

Use Node 20.19 o posterior: `npm ci`, `npm test`, `npm run build`. En Vercel conserve el proyecto Vite, salida `dist` y las variables existentes documentadas en `.env.example` y en las guías previas. No hace falta introducir nuevas variables para la narrativa. Este ZIP entrega código listo para subir; no publica ni cambia el proyecto remoto.

Para la revisión local use `npm run dev` y abra `/preview.html`. Esa vista contiene datos simulados, capítulos de la historia, nacimiento indeterminado/simulado y movimiento reducido. `preview.html` no se compila como entrada de producción. En producción los controles adicionales aparecen en el QA autorizado ya existente.

Consulte `VALIDACION_ALIGNMENT_STORY.md` para pruebas y límites y `ARCHIVOS_ALIGNMENT_STORY.md` para la lista de archivos.
