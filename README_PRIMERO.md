# KORAVERSE 4.1 — ACTUALIZACIÓN RÁPIDA

Esta versión se instala **encima de KORAVERSE 4.0**. No borres tus datos.

## 1. Supabase

Abre **SQL Editor → New query** y ejecuta completo:

`supabase/migration_v4_1.sql`

Debe terminar con `Success. No rows returned` o un mensaje equivalente.

La migración:
- agrega tema e idioma al perfil;
- crea el bucket `koraverse-sketches` para los dibujos del chat;
- no borra XP, mensajes, perfiles ni progreso anterior.

## 2. GitHub

Reemplaza el contenido de tu repo `KoraVerse` por este proyecto y haz commit en `main`.

No subas `.env` ni claves reales. `.env.example` sí puede publicarse.

## 3. Vercel

Las variables existentes siguen funcionando:

- `VITE_SUPABASE_URL`
- `VITE_SUPABASE_KEY`

Vercel detectará el commit y desplegará automáticamente.

## 4. Qué probar

1. Portada galáctica y selección de jugador.
2. Avatar Studio: los personajes deben verse grandes y de cuerpo completo.
3. Perfil → cambia el tema y recarga: debe conservarse.
4. Chat → escribe desde dos dispositivos, verifica online/typing y `Limpiar chat`.
5. Sketch Pad → dibuja y usa **“Mira lo que dibujé”**.
6. Duo Realm → **Chess Duo Lab**.
7. En el perfil Kora, `Guíame` está activado por defecto en ajedrez; puede apagarse.
8. `Ctrl + Espacio` activa/desactiva Modo Discreto.
9. Revisa desktop y móvil.

## Chess Duo Lab

El tablero usa un motor de reglas local incluido en `src/chess-engine.js` (sin dependencia externa):
- turnos;
- movimientos legales;
- jaque / jaque mate;
- tablas;
- enroque;
- promoción;
- captura al paso.

`Guíame` muestra movimientos legales y recomendaciones pedagógicas. No usa un motor competitivo externo: las sugerencias son ayudas simples para aprender, no análisis de gran maestro.
