# Signals 2.0 · fotografías sin login

Carlos y Kora seleccionan su perfil habitual, pulsan +, eligen una foto y la envían. No hay cuenta de fotos, email, contraseña, sesión Auth separada ni diálogo «Fotos entre órbitas». Las fotos del historial se cargan automáticamente.

## Instalar

Desplegar esta revisión completa en Vercel. Mantener **SUPABASE_SERVICE_ROLE_KEY únicamente como variable server-only**, junto con SUPABASE_URL (o la VITE_SUPABASE_URL existente). Configurar KORAVERSE_ORIGIN con el origen HTTPS exacto sin barra final; si falta se usa SANCTUARY_ORIGIN. No añadir `VITE_` a la clave privada.

Si Signals 2.0 ya está instalado, **no hace falta SQL nuevo ni crear cuentas/miembros para fotos**. El bucket `koraverse-chat-media` sigue `public=false`, con los límites y tipos establecidos por migration_social_v5_1.sql. No se borran imágenes, historial ni tablas. Las políticas/miembros anteriores permanecen, pero el flujo entregado no los utiliza. Si aún falta el bucket, ejecutar la migración social existente después de migration_v5_1.sql.

Las APIs comprueban que el bucket sea privado y rechazan operar si aparece público. No lo convierten silenciosamente ni usan `getPublicUrl`.

## Recorrido

- `/api/chat-media-upload`: POST binario de **un archivo por solicitud**, Content-Type `application/octet-stream`, headers `x-player-key` y `x-media-path`. El servidor verifica origen, perfil exacto `carlos`/`kora`, ruta y prefijo propio, tamaño máximo 4 MiB, firma WebP/JPEG y extensión correspondiente. Sube usando service role con `upsert:false`. La foto y la miniatura se envían por separado.
- `/api/chat-media-sign`: POST JSON `{player_key,path}`. Solo firma rutas válidas que pertenezcan a una foto persistida en koraverse_messages y coincidan exactamente con su `path`/`thumbnail_path`. Ambos perfiles pueden ver fotos del otro. URL de 300 segundos, caché cliente de 240 segundos y solicitudes concurrentes deduplicadas.
- `/api/chat-media-delete`: POST JSON `{player_key,path,cleanup_ticket}`. Limpieza de una subida fallida: exige un comprobante HMAC de quince minutos emitido al subir, ligado al perfil/ruta. Elimina original y miniatura juntos y rechaza borrar fotos ya asociadas a mensajes guardados. El comprobante solo vive en memoria, nunca en metadata del mensaje.

El compositor conserva preparación local de 1800 px, miniatura de 480 px, entrada de 20 MiB, WebP/JPEG, orientación, caption y metadata. Un fallo de miniatura limpia el original; un fallo al persistir el mensaje limpia ambos. Si también falla la red durante la limpieza pueden quedar objetos huérfanos; no se marca un mensaje como enviado ni se borra una foto persistida.

La galería, lightbox, zoom y descarga siguen iguales. El placeholder ahora dice «Cargando fotografía…»; si falla la firma, permite tocar para reintentar. QA no sube ni firma fotos reales. El resto de Auth para QA/Santuario permanece intacto.

## Alcance de acceso

El **bucket** es privado y la clave service role nunca va al frontend. Las APIs comparten el modelo abierto Carlos/Kora solicitado: `player_key` valida un valor permitido, **no demuestra identidad**. Quien acceda a la aplicación puede seleccionar uno de esos perfiles; la comprobación de origen evita solicitudes de otra web desde un navegador, pero no constituye autenticación. Esta revisión elimina deliberadamente el requisito de identidad de fotos. Una URL firmada funciona hasta expirar para quien la tenga.

No se cambió texto, typing, sonido, frases, Duo, trivia, Santuario ni sus datos. No se añadieron nuevas variables privadas obligatorias.

## Pruebas y comprobación real

`npm test`: **59/59** aprobadas. `npm run build`: aprobado. Pruebas del cliente y handlers reales con adaptador Storage: Carlos → Kora, Kora → Carlos, nueva instancia tras recarga, caché, metadata, limpieza, rechazo de rutas/perfiles/orígenes, archivos grandes/falsos, bucket público y tickets inválidos/expirados. Se escanea el bundle de producción para descartar la variable y un secreto de prueba inyectado solo en el entorno servidor durante la compilación.

Después de desplegar, abrir dos navegadores con perfiles distintos. Enviar una foto en cada sentido, esperar recepción automática, recargar ambos, abrir miniatura/archivo completo y revisar en Supabase que el bucket continúe privado. También rechazar un archivo demasiado grande y comprobar que no aparece ningún login de fotos. Sin credenciales remotas conectadas, esta ejecución valida el recorrido local con Storage simulado; no afirma una subida real a tu proyecto.

La elección de POST binario y separación de archivos sigue el [runtime Node de Vercel](https://vercel.com/docs/functions/runtimes/node-js) y su [límite de payload](https://vercel.com/docs/errors/function_payload_too_large). El servidor utiliza las operaciones de [Supabase Storage](https://supabase.com/docs/reference/javascript/storage-from-upload).
