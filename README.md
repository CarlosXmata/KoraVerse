# KORAVERSE 5 — A Place Between Worlds

Un lugar tranquilo entre mundos para descansar, aprender, crear y encontrarse.

Seis mundos: El Refugio, El Caos, El Observatorio, El Taller, Órbita Compartida y Señales. Conserva los juegos y avatares 4.1 y añade ambiente generativo, Constelaciones, transición de nave, un minuto sin presión y QA autorizado mediante Supabase Auth.

Lee **[README_MIGRACION_5.md](README_MIGRACION_5.md)** para actualizar Supabase/Vercel, activar QA y probar Carlos/Kora. **[VALIDACION.md](VALIDACION.md)** distingue verificaciones locales de pruebas pendientes con tu backend.

```sh
npm install
npm test
npm run build
npm run dev
```

Configura `.env.local` a partir de `.env.example`. Nunca publiques service role ni contraseñas. Vercel: Vite, Node 22/24, `npm ci`, `npm run build`, output `dist`.

Stack: Vite, JavaScript, Supabase Database/Realtime/Presence/Storage/Auth, Vercel y Web Push opcional. Ajedrez local mantiene movimientos legales, jaque/mate, enroque, promoción y captura al paso.
