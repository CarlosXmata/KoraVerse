# KORAVERSE 4.1 — Premium Polish & Social Expansion

KORAVERSE es un universo privado para dos personas: juegos Solo/Duo, English Lab, puzzles, arcade, Chill Zone, chat, avatares, progreso, señales sociales y experiencias rápidas para desconectarse unos minutos.

## Novedades principales 4.1

- **Responsive real**: monitor, laptop, tablet y móvil con escala tipográfica fluida.
- **Entrada cinematográfica**: galaxia, naves y vacas alienígenas animadas.
- **Avatar Engine 2.0**: avatares originales de cuerpo completo en Cows, Animals, Writers y Screen Archetypes.
- **Living Core**: la esfera central alterna Nivel → Avatar → Estado → XP → Racha.
- **Profile Universe**: avatar grande, métricas, feed de actividad, logros y 8 temas visuales.
- **Idioma**: español por defecto + selector ES/EN para la navegación principal.
- **Chat 2.0**: presencia, typing, señales rápidas, limpiar para mí y soporte de dibujos.
- **Sketch Pad**: dibuja, guarda y envía al chat con “Mira lo que dibujé”.
- **Chess Duo Lab**: ajedrez sincronizado con reglas reales y modo **Guíame** para aprender mientras se juega.
- **Modo Discreto**: `Ctrl + Espacio` pausa el universo y muestra una vista neutra.

## Chess Duo Lab

El motor local `src/chess-engine.js` implementa:

- movimientos legales;
- jaque y jaque mate;
- tablas por ahogado / regla de 50 movimientos / material insuficiente básico;
- enroque;
- promoción;
- captura al paso.

El modo **Guíame** es pedagógico, no un motor competitivo: ilumina movimientos legales, explica las piezas y propone candidatos simples basados en capturas, jaques, centro y desarrollo.

## Stack

- Vite
- Supabase Database + Realtime + Presence + Storage
- Vercel
- Web Push opcional
- Motor de ajedrez local, sin dependencia externa

## Actualizar desde 4.0

1. Ejecuta `supabase/migration_v4_1.sql` en Supabase SQL Editor.
2. Reemplaza el contenido del repositorio con esta versión.
3. Haz commit a `main`.
4. Vercel desplegará automáticamente.

Consulta `README_PRIMERO_4_1.md` para el paso a paso.

## Variables Vercel

Obligatorias:

- `VITE_SUPABASE_URL`
- `VITE_SUPABASE_KEY`

Opcionales para push con la app cerrada:

- `VITE_VAPID_PUBLIC_KEY`
- variables server-side VAPID/service role ya descritas en la versión 4.0.

## Privacidad

KORAVERSE 4.1 mantiene el modelo actual sin Supabase Auth. Es apropiado como proyecto privado por enlace, pero no debe utilizarse para información sensible. `Limpiar chat` limpia la vista local del jugador; no borra el historial del otro usuario ni elimina filas de la base de datos.
