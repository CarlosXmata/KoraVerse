# KORAVERSE 4.0 — Premium Social Core

KORAVERSE es un pequeño universo compartido para dos personas: juegos Solo/Duo, English Lab, puzzles, arcade, zonas relajantes, progresión, avatares, chat y presencia en tiempo real.

## Highlights 4.0

- **Living Core:** el planeta central rota entre nivel, avatar y estado social.
- **Avatar Studio:** vaquitas, animales, escritores y arquetipos originales desbloqueables con XP.
- **Social Presence:** muestra al otro jugador online/offline y la zona en la que está.
- **Realtime Chat:** mensajes persistentes + Broadcast para entrega instantánea.
- **Coffee Signals:** invitaciones desde Chill Zone como “Vamos por un café”.
- **Trivia Universe:** Game of Thrones, Marvel, Series, Cine y Mix en Solo; Trivia bloqueada en Duo.
- **Chill 4.0:** Garden, Star Drift, Coffee Break, Rain Room, Mood Orbit y Quiet Library.

## Stack

- Vite
- Supabase Database
- Supabase Realtime Broadcast + Presence
- Vercel
- Web Push opcional

## Actualizar desde 3.0

Ejecuta `supabase/migration_v4.sql` y luego reemplaza el contenido del repositorio con esta versión.

Consulta `README_PRIMERO.md` para el paso a paso.

## Privacidad

El prototipo no usa Supabase Auth; los perfiles se identifican por claves simples (`carlos`, `kora`, etc.). No debe considerarse un sistema de mensajería cifrado o destinado a información sensible.
