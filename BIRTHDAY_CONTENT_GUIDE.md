# Editar el cielo del cumpleaños

Todo el contenido literario compartido del evento está en `src/birthday-data.js`. No pongas allí textos del Santuario: este archivo forma parte del código público del navegador.

`BIRTHDAY` reúne ID, protagonista, fecha, zona horaria, ventanas Prelude / Alignment / Afterglow, mensajes ES/EN, las diez rosas, nombre Aurelia, historia y fragmento, las 16 etapas con sus tiempos y parámetros de audio. El canon 10/10 es ficción de KORAVERSE, no una afirmación astronómica.

Edita cada par `es` / `en` y los campos `text` / `en` de las rosas. Conserva los IDs 1–10 y sus claves para no perder aperturas guardadas. La rosa 10 usa `gold:true`. El sonido se genera con Web Audio y solo se escucha si la persona activó el ambiente; no se fuerza autoplay.

La secuencia avanza por tiempo visible: noche, estrellas, deriva, mundos, órbitas, aproximación, alineación, silencio, onda, rosa, fecha, frase, felicitación, deseo, avatar y llegada. La duración completa es 35 segundos; movimiento reducido usa una felicitación breve de 1,8 segundos. Puedes ajustar tiempos manteniendo orden ascendente y la última etapa `complete`.

`CONSTELLATIONS` define nombres ES/EN, tipos y centros del mapa. Las líneas aparecen cuando hay al menos dos estrellas. Si cambias definiciones, actualiza también las semillas SQL para instalaciones nuevas y aplica una actualización explícita de filas existentes: la migración idempotente no sobreescribe personalizaciones con `ON CONFLICT DO NOTHING`.

Para un evento futuro, añade una configuración con ID único a `UNIVERSE_EVENTS`, fecha, zona y ventanas. El motor acepta eventos futuros; la experiencia y la API de cumpleaños actuales usan `BIRTHDAY`. Para una segunda celebración completa, selecciona la configuración correspondiente en esos módulos y conserva IDs de eventos anteriores. No reutilices `alignment-2026` para otra fecha.

La película completada se registra en `koraverse_events`. Aurelia se crea con una clave única por participante y la fecha 2026-10-10. Las diez rosas añaden otro recuerdo Rosa Decem. Repetir una película o una vista QA no crea registros. Buscar una fecha vacía en el Atlas muestra silencio; no inventa un evento. El viaje temporal muestra únicamente estrellas cuya fecha es anterior o igual a la seleccionada.

Antes de publicar textos nuevos: `npm test`, `npm run build`; usa QA autorizado o `/preview.html` en desarrollo para revisar móvil y escritorio. Las vistas globales manuales del Santuario deben mantener activada «Vista previa» antes del 10/10 y regresar a Automático antes de la llegada real.
