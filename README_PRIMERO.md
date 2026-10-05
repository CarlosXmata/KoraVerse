# KORAVERSE 3.0 — QUÉ HACER PRIMERO

Esta versión reemplaza el front-end anterior, pero reutiliza el mismo proyecto de Supabase y el mismo proyecto de Vercel.

## 1) Ejecuta el SQL

1. Abre tu proyecto **KORAVERSE** en Supabase.
2. Ve a **SQL Editor**.
3. Crea una consulta nueva.
4. Copia TODO el archivo `supabase/schema.sql`.
5. Ejecuta **Run**.

Esto crea perfiles, XP, podio, rachas, progreso de inglés, KORA SIGNAL y almacenamiento de contenido.

## 2) Sube KORAVERSE 3.0 a GitHub

Reemplaza el contenido de tu repositorio actual con el contenido de esta carpeta.

Tus variables actuales siguen funcionando:

- `VITE_SUPABASE_URL`
- `VITE_SUPABASE_KEY`

Vercel volverá a desplegar automáticamente cuando hagas commit en `main`.

## 3) Prueba en este orden

1. Abre la web y entra como Carlos.
2. Juega un English Quest y confirma que sube XP.
3. Abre la web en incógnito/móvil y entra como Kora.
4. Confirma que el podio tiene XP separado.
5. Prueba Sudoku Solo y Case Invaders.
6. Crea una sala Duo y entra con ambos dispositivos.
7. Prueba Trivia, Same Brain, Sudoku Duo y Case Arena.
8. Pulsa `Invitar a Kora/Carlos` con la otra web abierta.

## 4) KORA SIGNAL

Sin configuración adicional funciona así:

- notificación instantánea si KORAVERSE está abierto en el otro dispositivo;
- notificación del navegador si el permiso está concedido y la web está abierta/en segundo plano;
- señal pendiente guardada en Supabase para verla en el próximo ingreso.

Para **Push real incluso con la web cerrada**, revisa `README.md > Push notifications avanzadas`.
