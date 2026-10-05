# KORAVERSE 5 — A Place Between Worlds

Construida sobre el ZIP 4.1, conservando su motor de ajedrez, avatares, English, Trivia, Sudoku y juegos Solo/Duo. V5 añade seis mundos, navegación con nave, entrada basada en necesidades, música generativa original, escenas habitadas, Constelaciones, un minuto sin puntuación y QA separado.

## Actualizar 4.x → 5

1. Conserva un respaldo del repositorio y de Supabase. La migración es aditiva: no borra mensajes, perfiles ni progreso.
2. Desde 4.1, ejecuta `supabase/migration_v5.sql` en SQL Editor. Desde 4.0 ejecuta primero `migration_v4_1.sql`. Instalación nueva: `schema.sql`, `migration_v4.sql`, `migration_v4_1.sql` y `migration_v5.sql`, en ese orden.
3. Copia el **contenido** de `KoraVerse-5` del ZIP a la raíz del repositorio. `package.json`, `index.html` y `vercel.json` deben quedar en la raíz.
4. Mantén en Vercel `VITE_SUPABASE_URL` y `VITE_SUPABASE_KEY` (clave pública anon, nunca service role). Node 22/24. Framework: Vite. Instalación: `npm ci`. Build: `npm run build`. Output: `dist`.
5. Haz commit y despliega. Recarga las pestañas antiguas para que ambas personas utilicen V5.

Desarrollo: copia `.env.example` a `.env.local`, completa las dos variables públicas, ejecuta `npm install`, `npm run dev`. Verificación: `npm test`, `npm run build`. El ZIP incluye lockfile y excluye credenciales, node_modules y archivos de entorno privados.

## Presence y Señales

Cada pestaña tiene un `session_id` distinto y usa `koraverse:presence`. Publica jugador, avatar, mundo, estado, última interacción y heartbeat. Una tabla ofrece respaldo; las sesiones vencen tras 65 segundos sin heartbeat. Las pestañas en segundo plano se muestran Idle; al cerrar, puede tardar ese intervalo en aparecer Offline.

El chat guarda primero el mensaje y confirma envío cuando Supabase devuelve la fila. El receptor escucha `postgres_changes` INSERT; Broadcast acelera la entrega. `client_id` evita duplicados. Al reconectar recupera el historial; consulta de respaldo cada 25 segundos. Si falla el guardado, el texto permanece en el campo. Limpiar chat oculta mensajes para ese jugador en ese navegador sin borrar filas ni el historial de la otra persona.

La migración registra `koraverse_messages` en `supabase_realtime`. Si personalizaste permisos de Realtime, verifica que los canales públicos y Presence estén permitidos. Referencias: [Presence](https://supabase.com/docs/guides/realtime/presence), [Postgres Changes](https://supabase.com/docs/guides/realtime/postgres-changes).

### Prueba real después del despliegue

1. Chrome como Carlos y Edge como Kora con el mismo Supabase.
2. Comprueba la otra luz, cambia de mundo y verifica su estado.
3. Envía “Hola” en ambas direcciones: entrega inmediata una sola vez.
4. Recarga: historial persistente. Desconecta y reconecta: recuperación de mensajes enviados durante la ausencia.
5. Envía dibujo, invita a café y acepta: estrellas correspondientes en el perfil.
6. Abre una sala Duo desde el enlace y prueba Trivia, Sudoku, Chess + Guíame.
7. Sin interacción más de 90 segundos: Idle. Cierra todas las pestañas de esa persona: Offline en aproximadamente 65 segundos como máximo.

**Esta entrega no ejecuta tu migración ni prueba tu Supabase remoto:** el ZIP original no incluía su configuración. `VALIDACION.md` documenta los resultados locales; no certifican la conexión de producción.

## Activar tu laboratorio QA / Admin

No existe usuario ni contraseña secretos en el frontend. Supabase Auth y la tabla protegida `koraverse_admins` autorizan el acceso.

1. Supabase → Authentication → Users: crea tu cuenta con email/contraseña. Copia el UUID.
2. SQL Editor, sustituyendo el UUID:

```sql
insert into public.koraverse_admins(user_id)
values ('UUID-DE-TU-CUENTA-AUTH')
on conflict do nothing;
```

3. En KORAVERSE, entra como Carlos/Kora → ⚙ Preferencias → QA / Admin → Abrir laboratorio. Usa esa cuenta.
4. Simula XP/nivel, prueba todos los avatares/mundos y Online/Idle/Offline. Chess permite ambos colores; Trivia/Same Brain simulan la segunda respuesta. Son simulaciones locales, no pruebas de red.
5. “Salir y restaurar” recupera el perfil anterior. Recompensas, mensajes, invitaciones push y dibujos de QA no se publican ni guardan progreso. Recargar también sale de QA. Entrar abandona la sala Duo real; vuelve a entrar con su código después.

Para revocar acceso elimina la membresía de ese UUID desde SQL Editor. Clientes anon/authenticated no pueden asignarse el rol. La cuenta Auth no obtiene administración general del backend: QA es una vista previa aislada.

## Preferencias y alcance

- Español predeterminado; ES/EN cambia navegación, entrada, mundos y textos V5. Actividades originales conservan sus textos/lecciones: no se afirma traducción completa de cada minijuego.
- Música Web Audio original, sin pistas externas. Volumen/mute persistentes; tras recargar el navegador requiere una interacción. Se pausa fuera de foco y en modo discreto.
- Calidad Calma/Equilibrada/Completa, `prefers-reduced-motion`, nave más corta en móvil y omitida al reducir movimiento.
- Ctrl + Espacio o Preferencias: modo discreto. Pausa ambiente/sonido. Las salas Duo siguen recibiendo estado del compañero.
- Constelaciones conservan hitos con respaldo local y sincronización aditiva; mantienen XP/logros existentes. El módulo de un minuto no da XP ni logros por quedarse.
- Se conserva el modelo 4.x por nombre y tablas de juego accesibles al rol anon. **Carlos/Kora no son identidades autenticadas ni una barrera de privacidad.** Admin sí está protegido por Auth/RLS. Evita datos sensibles bajo este modelo.
- Web Push opcional: VAPID y service role solo en servidor Vercel. Los endpoints conservan el comportamiento 4.1; no autentican jugadores.

Módulos conservados: Garden, Coffee Break, Star Drift, Rain Room, Mood, Reading Corner, Case Invaders, Memory, Caos, Case Arena/Lic. Urgentísimo, English, Sudoku, Trivia Solo/Duo, Chess + Guíame, Sketch, Same Brain y Mission Control. Pixel Together/Word Games no existían como juegos independientes en el ZIP; el Taller usa Sketch y el Observatorio conserva los ejercicios de palabras de English.
