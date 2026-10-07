# Validación · expansión narrativa y Atlas

Fecha: 7 de octubre de 2026.

- `npm test`: 36 pruebas aprobadas, 0 fallos. Incluye las 26 anteriores y 10 nuevas para datos, idiomas, nacimiento indeterminado, fechas corregibles, temporizador, anuario, separación real/mito, profecía, movimiento reducido y preservación de archivos.
- Preservación: 31 archivos originales protegidos comparados mediante SHA-256. Incluye `main.js`, estilos originales, juegos, perfiles/datos, cumpleaños original, audio ambiental, QA, Realtime, seguridad, Santuario, APIs, SQL y Service Worker.
- `npm run build`: Vite final compilado sin errores. Consulte `build-alignment-results.txt` para tamaños exactos.
- Navegador local: llegada, encuentro, rosa, profecía, pausa, selección de capítulo, reinicio, salto del capítulo final y cierre revisados. Retorno al Atlas y restauración de foco/comportamiento de página comprobados.
- Móvil 360×800: texto del encuentro legible sin superposición con controles ni desplazamiento interno. Comprobación adicional en 320×568 sin superposición ni desbordamiento horizontal. Atlas sin desbordamiento horizontal en 360 píxeles. Captura incluida.
- Escritorio: revisión de la rosa y del archivo 2027. No hubo errores o advertencias en la consola de la vista revisada.
- Atlas: fecha 12/10/2025 sin recuerdos reales muestra el mito de 2025 y la coordenada aproximada; seleccionar 2027 conserva la etiqueta de ficción y permite abrir el guiño. Pruebas cubren también 2000–2005, todos los años hasta 2027, día desconocido, resultados exactos y acumulativos.

Dos errores detectados y corregidos durante la revisión: desplazamiento del diálogo al enfocar controles y pantalla final oculta al saltar el último capítulo. La prueba del reproductor cubre el segundo. La pausa deja terminar el fundido de letras para que el texto siga siendo legible.

## Límites y pendientes

Las revisiones de navegador usan la vista local y estrellas simuladas. No equivalen a una sesión real contra el Supabase/Vercel del usuario ni a una prueba con dos navegadores conectados. No se cambiaron ni se volvió a certificar la configuración remota o la entrega Realtime; sus pruebas existentes siguen pasando. El QA de producción conserva su autorización existente y tiene nuevas opciones de narrativa, pero no se probó aquí con una cuenta administradora real.

El sonido se genera con tonos suaves y el motor ambiental existente: necesita un gesto de usuario si el navegador bloquea el audio. No incluye voz narrada ni una pista externa. Pausar o esconder la pestaña detiene el tiempo y silencia las señales de la película. La duración 3:49 es nominal; pausas, pestaña oculta o una tasa extremadamente baja de cuadros pueden prolongarla. No se hizo una auditoría de rendimiento en teléfonos físicos ni una prueba de audio con altavoces reales.

El movimiento reducido se verifica con el reproductor completo en la prueba, conservando los 229 segundos y sin escribir transformaciones de cámara. El acceso a la nueva historia desde Santuario queda pendiente por el alcance indicado por Carlos. Ninguna otra migración es necesaria para esta expansión.

El ZIP se valida con CRC y hashes de los archivos empaquetados. Excluye dependencias, compilados locales y credenciales; incluye el archivo de ejemplo de variables y las migraciones originales. Antes de publicar, configure las variables ya existentes de su instalación conforme a las guías previas.
