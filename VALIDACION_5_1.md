# Validación KORAVERSE 5.1

Fecha de trabajo: 7 de octubre de 2026. Base: ZIP KORAVERSE 5 conservado sin modificar; copia independiente para la expansión. Se inventariaron los 52 archivos de la base con hashes antes de editar.

## Resultados locales

- Instalación reproducible desde package-lock: completada. Auditoría al instalar: 0 vulnerabilidades notificadas. PGlite es una dependencia de desarrollo para probar SQL, no se incluye en el navegador.
- Compilación Vite de producción: completada. JavaScript aproximadamente 414 kB / 124 kB gzip; CSS aproximadamente 108 kB / 24 kB gzip. No se añadió un servidor de WebSockets.
- Pruebas automatizadas Node: 26 pruebas previstas en la entrega, ejecutadas con el código final; ver registro `test-results.txt`.
- SQL V5.1 ejecutado **dos veces** en PostgreSQL local PGlite. Se conserva la fila V5 original, su fecha se convierte a Santo Domingo, no se duplican estrellas ni definiciones, las diez rosas se agregan sin duplicar y los permisos públicos del Santuario fallan.
- UI local: inicio Classic y Atlas real con memoria local; laboratorio de desarrollo con diez rosas, décima dorada, Aurelia, búsqueda sin eventos, película completa y pantalla dormida/despertar.
- Atlas inspeccionado a 360×800, 768×1024 y 1920×1080: sin desbordamiento horizontal en las vistas revisadas. Lectura de estrella pasa debajo del mapa en móvil.
- Libro privado revisado con datos ficticios y backend simulado en memoria: editar/guardar y preparación de cinco capítulos Origin. No se introdujeron credenciales ni palabras privadas reales.

## Qué comprueban las pruebas

Fechas limítrofes de Santo Domingo y fases; override, restauración, reloj del servidor y configuración futura; 16 etapas, película pausada en oculto y final único, versión breve; apertura única de rosas, rechazo al fallar el guardado y QA sin escritura; estados de avatar y objetos vectoriales; búsquedas exactas/acumulativas y calendario válido; clasificación/destinos de señales; llave válida/incorrecta, identidad incorrecta, límite de intentos, origen inválido, sesión firmada alterada/caducada/revocada; cifrado y descifrado de título/texto/etiquetas, clave equivocada y datos autenticados; permisos SQL, control persistente y despertar; protección de notificaciones externas; pruebas anteriores de ajedrez, chat persistente/deduplicado, Presence y aislamiento QA.

## Límites de la validación

No había credenciales Supabase, Vercel ni VAPID. No se ejecutó la migración sobre tu base real, no se publicó el proyecto y no se verificó entrega entre dos navegadores contra un Realtime remoto. El navegador local revisó las nuevas interfaces; los endpoints se probaron mediante adaptadores simulados y las políticas mediante PostgreSQL local. PGlite no reproduce la infraestructura Auth, Storage y publicación Realtime de Supabase: el bloque de publicación se ejecutó sin una publicación presente. Ese paso debe verificarse en Supabase.

El registro del cumpleaños guarda progreso y estrella en una sola transacción PostgreSQL; las claves únicas evitan duplicados al reintentar. Las APIs compartidas conservan la identidad por nombre de V5. El diario sí exige Auth de Carlos más llave. Esto no es una auditoría externa de seguridad.

## Ajustes al brief

- Santuario requiere cuenta Auth además de llave, porque el perfil Carlos heredado no acredita identidad.
- Classic mantiene sus estilos y funciones originales, con dos accesos aditivos: Atlas y estrella privada. Para recuperar el artefacto exacto anterior, usa el ZIP V5 conservado.
- Control global se consulta cada 30 segundos. La publicación SQL queda preparada; no se añadió otra conexión de Realtime. Las salas Duo mantienen el protocolo V5 y deben verificarse con ambos clientes al pausar.
- Textos compartidos se editan en `birthday-data.js`; no se añadió editor remoto de contenido literario dentro del Santuario.
- El motor admite eventos futuros; una segunda celebración completa requiere seleccionar su configuración en experiencia y API, además de añadirla al calendario.
- Origin prepara los capítulos por acción explícita; no inserta un manuscrito vacío antes de desbloquear el diario.
- No se proporciona recuperación ni rotación con recifrado para una llave privada perdida.

## Pendientes manuales del despliegue

Aplicar SQL en orden; configurar las variables listadas en `SANCTUARY_SETUP.md`; preparar cuenta Auth autorizada y llave; desplegar frontend + APIs HTTPS; validar los dos navegadores, Push, sesión real y Storage; repetir el evento en preview sin progreso y volver a Automático. Los archivos de documentación explican los riesgos y la restauración.

El ZIP contiene fuente, migraciones, configuración, lockfile, pruebas y guías. Excluye node_modules, dist, .git y credenciales. Su contenido y hashes se verifican al empaquetar; el resultado queda en `PACKAGE_VALIDATION_5_1.json` y `SHA256SUMS_5_1.txt`.
