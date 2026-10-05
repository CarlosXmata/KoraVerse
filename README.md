# KORAVERSE 3.0 — Duo Universe

Una evolución completa del KORAVERSE original: juegos Solo y Duo, XP persistente, podio, English Lab, Sudoku, Case Invaders, KORA SIGNAL, PWA y mundos visuales.

## Qué incluye esta versión

### Command Center
- Entrada por perfil: Kora / Carlos / otro.
- Nivel personal, XP, racha y progreso por categoría.
- Podio de experiencia.
- Duo XP compartido.
- Quick Play de 5 minutos.
- Invitación KORA SIGNAL.

### Solo Mode
- **English Lab**: ruta A1 → A2 → B1 con temas fundamentales.
- **Sudoku**.
- **Case Invaders**: juego Canvas con nave y casos.
- **Memory Reactor**.
- **30 Second Chaos**.
- **The Garden**.
- **Star Drift**.
- **Coffee Break**.

### Duo Realm
- Salas privadas con código.
- Presence + Broadcast de Supabase Realtime.
- Trivia Realm.
- Same Brain / Sync Mode evolucionado.
- Mission Control.
- Sudoku Duo compartido.
- Classic Case Arena.
- Boss final Lic. Urgentísimo.
- The Garden como recompensa.
- Case Invaders Duo Raid.
- Nueva sala / nuevo código.

### English Lab
El currículo incluido trabaja temas concretos y estables:

- Verb to be.
- Personal pronouns.
- Present Simple.
- Do / Does.
- There is / There are.
- Can / Can't.
- Past Simple.
- Future: will / going to.
- Comparatives.
- Frequency.
- Everyday conversation.
- English at work.

Los ejercicios incorporados sirven de base. Además, la app consulta `koraverse_english_content` de Supabase. Puedes añadir ejercicios nuevos a esa tabla y aparecerán en la aplicación sin volver a desplegar el front-end.

---

# Actualizar desde KORAVERSE 2.x

## A. Supabase

No crees un proyecto nuevo.

En tu proyecto actual:

1. `SQL Editor`
2. `New query`
3. pega `supabase/schema.sql`
4. pulsa `Run`

No borra tus tablas ajenas. Solo crea las tablas `koraverse_*` si no existen.

## B. GitHub

La opción recomendada es reemplazar los archivos del repositorio actual con esta versión.

Estructura esperada:

```text
KoraVerse/
├── api/
│   ├── kora-signal.js
│   └── push-subscribe.js
├── public/
│   ├── icon.svg
│   ├── manifest.webmanifest
│   └── sw.js
├── src/
│   ├── data.js
│   ├── main.js
│   └── style.css
├── supabase/
│   └── schema.sql
├── .env.example
├── .gitignore
├── .nvmrc
├── index.html
├── package.json
├── README.md
├── README_PRIMERO.md
└── vercel.json
```

Una vez hagas commit a `main`, Vercel debe iniciar un deployment automáticamente.

## C. Variables de Vercel

Las dos variables que ya utilizabas siguen siendo suficientes para el juego normal:

```text
VITE_SUPABASE_URL=https://xxxxxxxx.supabase.co
VITE_SUPABASE_KEY=sb_publishable_xxxxxxxxx
```

No pongas claves `service_role` en variables que comiencen con `VITE_`.

---

# XP y perfiles

Los perfiles se identifican por `player_key`:

- `Kora` → `kora`
- `Carlos` → `carlos`

Por eso, si Kora entra desde otro dispositivo y selecciona **Kora**, recuperará el mismo XP guardado en Supabase.

No hay autenticación ni contraseña en esta versión: es un universo privado por enlace, no un sistema de cuentas seguro. No uses estas tablas para información sensible.

XP se almacena en:

- `koraverse_profiles`
- `koraverse_activity`
- `koraverse_duo`

---

# KORA SIGNAL

## Modo estándar — ya funciona

Al pulsar `Invitar a Kora` o `Invitar a Carlos`:

1. se envía un Broadcast de Supabase Realtime;
2. si el otro tiene KORAVERSE abierto, recibe la señal al instante;
3. si permitió notificaciones, el Service Worker muestra una notificación mientras la app/navegador está disponible;
4. también se guarda una señal en `koraverse_signals`, por lo que puede verse al entrar luego.

## Push notifications avanzadas — incluso con KORAVERSE cerrado

El proyecto ya incluye los endpoints:

- `/api/push-subscribe`
- `/api/kora-signal`

Para activarlos necesitas VAPID + una Service Role Key **solo en el servidor**.

### 1. Generar VAPID keys

En una PC con Node puedes ejecutar:

```bash
npx web-push generate-vapid-keys
```

Obtendrás una Public Key y Private Key.

### 2. Añadir variables en Vercel

Añade:

```text
VITE_VAPID_PUBLIC_KEY=<PUBLIC KEY>
VAPID_PUBLIC_KEY=<PUBLIC KEY>
VAPID_PRIVATE_KEY=<PRIVATE KEY>
SUPABASE_SERVICE_ROLE_KEY=<SERVICE ROLE KEY DE SUPABASE>
```

Importante:

- `VITE_VAPID_PUBLIC_KEY` puede ir al navegador.
- `VAPID_PRIVATE_KEY` NO.
- `SUPABASE_SERVICE_ROLE_KEY` NO.
- Nunca pongas las dos últimas con prefijo `VITE_`.

### 3. Redeploy

Después de crear variables nuevas, haz un Redeploy.

### 4. Activar alertas en cada dispositivo

En English Lab hay un botón `Activar alertas`; puedes moverlo luego a Settings si quieres. Cada jugador debe conceder permiso una vez en su propio navegador/dispositivo.

---

# English Lab actualizado sin redeploy

Puedes insertar contenido nuevo en `koraverse_english_content`.

Ejemplo conceptual:

```sql
insert into public.koraverse_english_content
(lesson_id, level, topic, kind, prompt, options, answer, explanation)
values
(
  'a1-present',
  'A1',
  'Present Simple',
  'mcq',
  'He ___ to work at 8.',
  '["go", "goes", "going", "went"]'::jsonb,
  '1'::jsonb,
  'Con he/she/it, el verbo normalmente lleva -s.'
);
```

La siguiente vez que el navegador consulte el contenido, ese ejercicio entra al pool de la unidad correspondiente.

---

# Desarrollo local

```bash
npm install
npm run dev
```

Build:

```bash
npm run build
```

Vercel debe usar:

```text
Framework: Vite
Build Command: npm run build
Output Directory: dist
```

---

# Notas de diseño

KORAVERSE 3.0 prioriza:

- animaciones CSS ligeras;
- Canvas solo en Case Invaders;
- diseño responsive;
- sonidos generados con Web Audio sin archivos externos;
- Realtime para acciones rápidas;
- base de datos para progreso persistente;
- funcionamiento degradado local si aún no ejecutaste el SQL.

