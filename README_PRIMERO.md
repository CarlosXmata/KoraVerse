# KORAVERSE 4.0 — Antes de subir a GitHub

Esta versión es una actualización directa de KORAVERSE 3.0. Conserva los juegos existentes y añade el **Premium Social Core**.

## 1. Ejecuta primero la migración de Supabase

En Supabase abre **SQL Editor → New Query** y ejecuta completo:

`supabase/migration_v4.sql`

Esta migración:
- agrega `trivia_xp`, `avatar_id`, `status_message` y `last_seen` a los perfiles;
- crea `koraverse_messages` para chat e invitaciones persistentes.

Debe terminar con `Success. No rows returned`.

## 2. Sube el contenido del ZIP a la raíz del repo KoraVerse

Reemplaza los archivos existentes manteniendo esta estructura:

- `index.html`
- `package.json`
- `vercel.json`
- `src/`
- `public/`
- `api/`
- `supabase/`

No subas la carpeta contenedora ni el ZIP como un archivo único.

## 3. Vercel

Las variables existentes siguen siendo válidas:

- `VITE_SUPABASE_URL`
- `VITE_SUPABASE_KEY`

No necesitas crear otro proyecto Vercel. El commit a `main` debe generar el deployment automáticamente.

## 4. Qué probar después del deployment

1. Entra como Carlos y desde otro navegador/móvil como Kora.
2. Confirma que el indicador junto al nombre del otro pase a **online**.
3. Abre el botón de chat 💬 en ambos equipos y envía mensajes.
4. Entra a **Avatar Studio** y selecciona una vaquita/animal.
5. Vuelve al Command Center y observa cómo la esfera central alterna entre **nivel → avatar → estado**.
6. Abre **Trivia Universe** y juega una ronda Solo.
7. En Chill → Coffee Break pulsa **Vamos por un café** y confirma que la invitación aparece en el chat de la otra persona.
8. Prueba Duo Realm para verificar que los modos previos continúan funcionando.

## Nota de privacidad

KORAVERSE sigue usando perfiles por enlace y no Supabase Auth. El chat es adecuado para este proyecto privado/experimental, pero no debe tratarse como mensajería cifrada o de alta privacidad. Para privacidad fuerte, una fase futura debe añadir autenticación real y políticas RLS por usuario.
