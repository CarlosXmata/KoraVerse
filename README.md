# KORAVERSE Duo Realtime

Versión multijugador para **2 personas** del KORAVERSE original.

- Publicable en Vercel.
- Sin base de datos ni SQL.
- Usa **Supabase Realtime Broadcast + Presence**.
- Funciona desde la misma red o desde redes distintas.
- Sala de 6 caracteres + enlace de invitación.
- Trivias con respuestas ocultas hasta que ambos contestan.
- Sync Mode real.
- Misiones con validación desde la pantalla del cómplice.
- Case Arena cooperativo.
- Boss con HP compartido.
- Garden desbloqueable.
- Reconexión del anfitrión mediante estado guardado en su navegador.

## 1. Crear Supabase

1. Entra a https://supabase.com y crea un proyecto.
2. Abre **Connect** o **Project Settings > API**.
3. Copia:
   - Project URL
   - Publishable key (`sb_publishable_...`).
4. En **Realtime Settings**, mantén habilitado el acceso a canales públicos.

No necesitas crear tablas, ejecutar SQL ni habilitar Postgres Changes.

## 2. Configuración local

Copia `.env.example` como `.env.local` y reemplaza los valores:

```env
VITE_SUPABASE_URL=https://TU-PROYECTO.supabase.co
VITE_SUPABASE_KEY=sb_publishable_TU_CLAVE
```

Luego:

```bash
npm install
npm run dev
```

Vite mostrará una URL local, normalmente `http://localhost:5173`.

## 3. Publicar en Vercel

### Opción recomendada: GitHub + Vercel

1. Sube esta carpeta a un repositorio de GitHub.
2. En Vercel selecciona **Add New > Project** e importa el repositorio.
3. Framework Preset: **Vite**.
4. Agrega estas variables de entorno:
   - `VITE_SUPABASE_URL`
   - `VITE_SUPABASE_KEY`
5. Build Command: `npm run build`.
6. Output Directory: `dist`.
7. Pulsa **Deploy**.

### Opción CLI

```bash
npm install
npm run build
npx vercel
```

Después configura las dos variables de entorno en el proyecto de Vercel y vuelve a desplegar.

## 4. Cómo jugar

### Carlos / anfitrión

1. Abre la URL publicada.
2. Escribe tu nombre.
3. Pulsa **Crear partida**.
4. Copia el enlace de invitación.
5. Envíalo a la otra persona.
6. Cuando aparezcan 2 jugadores conectados, pulsa **Entrar al KORAVERSE**.

### Segundo jugador

1. Abre el enlace recibido.
2. Escribe su nombre.
3. Pulsa **Entrar**.
4. Queda conectado a la misma sala.

## 5. Arquitectura

```text
Vercel
  └─ Vite app
      ├─ Navegador A
      ├─ Navegador B
      └─ Supabase Realtime
           ├─ Presence: quién está conectado
           └─ Broadcast: respuestas, estado, golpes y validaciones
```

El anfitrión funciona como autoridad de la partida y distribuye el estado a la segunda pantalla. El estado maestro se guarda además en `localStorage` del navegador anfitrión para recuperarlo tras una recarga accidental.

## 6. Privacidad de la sala

Esta versión utiliza canales Realtime públicos protegidos únicamente por un código de sala aleatorio de 6 caracteres. Es apropiado para este juego casual y no almacena información sensible.

No uses este mecanismo para información corporativa confidencial, credenciales o datos personales sensibles. Si más adelante quieres salas con autenticación real, se puede migrar a canales privados con Supabase Auth y políticas RLS.

## 7. Archivos principales

- `src/main.js`: multijugador, salas, sincronización y lógica del juego.
- `src/data.js`: preguntas, misiones y frases.
- `src/style.css`: diseño visual del KORAVERSE.
- `vercel.json`: fallback SPA para Vercel.
- `.env.example`: variables requeridas.
- `KORAVERSE-original.html`: copia de tu versión original como respaldo.

## 8. Nota sobre reconexión

- Si el **segundo jugador** recarga, solicita nuevamente el estado al anfitrión.
- Si el **anfitrión** recarga, restaura el último estado guardado localmente y vuelve a publicarlo.
- Si el anfitrión cierra la sala definitivamente, el segundo jugador debe esperar a que vuelva a conectarse.

KORAVERSE deployed with Vercel.
