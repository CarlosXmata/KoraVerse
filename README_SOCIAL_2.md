# KORAVERSE 5.1 · Signals 2.0

Esta expansión continúa el proyecto existente. Conserva Birthday 10/10, Alignment Story, Atlas Celeste, Cosmic Yearbook, English Lab, Arcade, avatares, Constelaciones y el formato cifrado del diario.

## Qué cambia

- Frases completas de Quiet Library y Garden, con tarjeta y procedencia.
- Invitaciones a Ajedrez, Sudoku, Trivia y Same Brain que crean una sala antes de enviar el mensaje. El botón conecta al invitado y el anfitrión abre el juego correspondiente.
- Escritura junto al avatar, con pulsos limitados y caducidad; se detiene al enviar, cerrar, perder foco u ocultar la página.
- Microsonidos generativos diferenciados, más suaves con el chat abierto. La preferencia «Sonidos de Señales» persiste y respeta sonido global, QA, discreción y espacios tranquilos. Requiere una primera interacción por las reglas de audio del navegador.
- Resonancia discreta cuando el chat está cerrado; notificaciones externas sin texto privado. No interrumpe partidas.
- Una foto por mensaje: preparación local hasta 1800 px, miniatura de 480 px, caption, visor, zoom y enlace para guardar.
- Historial multimedia filtra fotos y dibujos de los mensajes cargados; conserva el límite existente de 100 mensajes visibles. No incorpora paginación ilimitada.
- Veinte preguntas por categoría principal y por partida Solo/Duo, sin repeticiones. Solo muestra porcentaje, clasificación, XP y mejor racha. Duo conserva pregunta, opciones, respuestas y puntuación en el estado del anfitrión.
- Teclado de cuatro cifras opcional para Santuario, con validación del servidor y clave de bóveda independiente. El acceso anterior continúa hasta completar su configuración.

## Instalar en GitHub / Vercel

1. Descomprimir el ZIP y usar `KoraVerse-5` como raíz del repositorio/proyecto.
2. `npm ci`, `npm test`, `npm run build`. Vercel: framework Vite, salida `dist`, Node 20.19 o posterior.
3. Mantener las variables y tablas existentes. Para una instalación nueva, seguir las migraciones anteriores en orden (`schema.sql`, `migration_v5.sql`, `migration_v5_1.sql` según README previo).
4. Ejecutar **supabase/migration_social_v5_1.sql después de migration_v5_1.sql** en Supabase SQL Editor. Es aditiva e idempotente; no elimina mensajes ni modifica sus cuerpos.
5. Mantener `koraverse_messages` en la publicación Realtime existente. Presence, Broadcast `typing`/`chat_message` y Postgres Changes siguen usándose; no hay un backend nuevo.
6. Configurar fotos y notificaciones como se explica abajo. Para el PIN, seguir SANCTUARY_PIN_4_SETUP.md antes de activar el modo.

No se aplicó esta migración a un servicio remoto ni se desplegó esta entrega: no hay credenciales ni un proyecto remoto conectado en esta ejecución.

## Variables

| Variable | Dónde | Uso |
|---|---|---|
| VITE_SUPABASE_URL / VITE_SUPABASE_KEY | cliente | URL y clave pública existentes |
| SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY | servidor | APIs y scripts administrativos existentes |
| VITE_VAPID_PUBLIC_KEY / VAPID_PUBLIC_KEY / VAPID_PRIVATE_KEY | pública / servidor / servidor | Web Push opcional existente |
| KORAVERSE_ORIGIN | servidor, nueva | Origen HTTPS exacto, sin barra final, para `/api/chat-push`; usa SANCTUARY_ORIGIN si no está definida |
| VAPID_CONTACT | servidor, nueva, opcional | Contacto `mailto:` del operador |
| SANCTUARY_PIN_MODE | servidor, nueva | `legacy` por defecto; `four-digit` después de migrar |
| SANCTUARY_VAULT_KEY | servidor, nueva | 32 bytes aleatorios en Base64; conservar y respaldar |
| SANCTUARY_MAINTENANCE | servidor, nueva | `true` durante conversión/reversión del diario; `false` normalmente |

SANCTUARY_OWNER_USER_ID, SANCTUARY_ORIGIN, SANCTUARY_PIN_SALT, SANCTUARY_PIN_HASH y SANCTUARY_SESSION_SECRET se conservan. Nunca añadir `VITE_` a claves privadas, service role, hashes, salts o secretos. `.env.example` contiene únicamente plantillas.

## Storage: fotos privadas

Se crea **koraverse-chat-media**, privado, límite 4 MiB por objeto y MIME WebP/JPEG. No se cambia `koraverse-sketches` ni se mueven sus dibujos históricos.

Crear/verificar una cuenta Supabase Auth para Carlos y otra para Kora. Obtener sus UUID reales en Authentication > Users y registrar los dos miembros desde SQL Editor:

```sql
-- Sustituir cada UUID por el identificador REAL de esa cuenta.
insert into public.koraverse_media_members(user_id,player_key)
values ('UUID_REAL_CARLOS','carlos'),('UUID_REAL_KORA','kora')
on conflict(user_id) do update set player_key=excluded.player_key;
```

Cada cuenta solo consulta su afiliación. Ambos miembros pueden leer las imágenes del bucket; cada uno sube bajo su propia ruta y elimina sus propios objetos. No hay lectura anónima, actualización/upsert ni bucket público. Las políticas anteriores de otros buckets permanecen; revisar que no exista una política personalizada global `using(true)` sobre `storage.objects`, pues las políticas permisivas de PostgreSQL se suman.

Ruta completa: `<player_key>/<yyyy>/<mm>/<uuid>.webp`; miniatura: `<uuid>-thumb.webp`. Se almacena path, thumbnail_path, bucket, dimensiones, MIME y nombre original en metadata. Nunca Base64 ni URL firmada en los nuevos mensajes de foto. Las URL se firman durante 15 minutos y se renuevan al renderizar cuando la caché cumple 14 minutos.

Elegir Carlos/Kora en el chat abierto no demuestra identidad. **Ver/subir fotos exige entrar una vez con la cuenta autorizada de ese perfil**, usando una sesión separada de QA/Santuario. El texto sigue funcionando como antes. Texto, caption, nombre de archivo y metadata siguen sujetos al modelo relativamente abierto del chat existente; este cambio protege el archivo de imagen, no convierte todo el chat en privado. Una URL ya firmada sigue siendo utilizable por quien la tenga hasta expirar.

### Probar fotos

En dos navegadores, elegir perfiles distintos y autorizar cada cuenta para fotos. Adjuntar JPEG/PNG/WebP, comprobar preview y enviar con caption. Verificar recepción, miniatura, apertura, zoom, cierre, historial multimedia y nueva carga al refrescar. Probar PNG grande, error de subida, cancelación y HEIC: solo se admite si el navegador lo decodifica; de lo contrario aparece una explicación. Límite de entrada 20 MiB; se redimensiona y vuelve a codificar mediante canvas, eliminando metadata ajena a los píxeles. Si el selector móvil ofrece cámara se puede usar; no se solicita cámara automáticamente.

Sin sesión autorizada, la imagen se sustituye por «Fotografía privada · entra para verla». La sesión se puede cerrar desde Preferencias. El enlace para guardar usa el comportamiento normal del navegador; algunos navegadores abren una URL de otro origen para guardarla.

## Probar invitaciones y trivia

En Carlos, pulsar Ajedrez/Sudoku/Trivia. Debe aparecer código real de seis caracteres en la tarjeta. En Kora, pulsar ENTRAR A LA PARTIDA: no copiar códigos. También probar `/?room=ABC123&game=chess` sustituyendo el código por una sala real. El anfitrión debe estar conectado: las salas actuales son Presence/Broadcast, no registros persistentes de una partida en servidor. Si no responde al pedir estado durante unos ocho segundos, aparece «Esa órbita ya se cerró» y «Crear una nueva». Un fallo de conexión muestra la pantalla de entrada/reconexión existente.

La tarjeta cambia localmente al entrar; no hay recibos persistentes de aceptación. El anfitrión conserva el estado de su sala en su navegador. Un invitado puede recuperar la ronda vigente mientras el anfitrión esté disponible. Si ambos abandonan, no se promete continuidad de una sala independiente del anfitrión.

En Solo, completar 20 preguntas en cada categoría y Mix. Revisar explicación y resumen. En Duo, responder con ambos perfiles, retrasar uno, repetir clic y reconectar un invitado: la ronda no avanza hasta que ambos respondan. Máximo Solo con 20 aciertos: 100 XP; Duo entrega 4 XP por respuesta correcta y mantiene el progreso compartido existente sin premios por respuestas duplicadas.

## Probar notificaciones

Activar alertas desde un gesto del usuario en HTTPS/PWA compatible. Con la otra pestaña oculta, enviar texto, foto, frase e invitación. El cuerpo externo debe ser genérico; al tocarlo abre Señales o la sala válida. Con el chat abierto, escuchar el tono más suave; probar sonido global OFF, Sonidos de Señales OFF, discreción, espacios tranquilos, mensaje propio y duplicado: no deben sonar.

El Service Worker recibe las señales de una pestaña viva. Para notificar con la PWA cerrada, configurar VAPID y las suscripciones existentes. `/api/chat-push` solo acepta un ID de mensaje recién persistido, consulta el mensaje en servidor y registra un recibo único. Es un envío opcional best effort; un error no invalida un mensaje guardado. Los permisos, entrega de push y sonido del sistema operativo dependen del navegador/plataforma. No se puede ejecutar Web Audio dentro del Service Worker.

## QA y recuperación

QA mantiene su autorización administrativa. Añade previews de texto, escritura, foto, frase, invitaciones, sala cerrada y Trivia 20; no envía mensajes reales, no sube imágenes, no otorga progreso persistente y no reproduce sonidos. La prueba de sonido en QA informa esta restricción.

Durante `npm run dev`, `/social-preview.html` permite revisar renderers, visor y teclado con datos aislados. El PIN **0451** de esa muestra es exclusivamente de prueba y no sirve en la aplicación. Esta entrada de desarrollo no forma parte del build de producción ni abre un diario.

Para revertir solo Signals, redesplegar el ZIP anterior; no borrar bucket, mensajes, miembros ni imágenes. Las tablas nuevas pueden permanecer. Los clientes anteriores mostrarán los nuevos mensajes mediante su renderer anterior con menor detalle. Revertir el PIN requiere el procedimiento independiente de SANCTUARY_PIN_4_SETUP.md.

Las decisiones de Storage siguen las guías oficiales de [control de acceso](https://supabase.com/docs/guides/storage/security/access-control) y [URL firmadas](https://supabase.com/docs/reference/javascript/storage-from-createsignedurl).
