# Validación — KORAVERSE 5

Fecha: 5 de octubre de 2026. Base: `KoraVerse-main.zip`, versión 4.1.

## Verificaciones realizadas

- Instalación con `npm install`: 40 paquetes; auditoría reportó 0 vulnerabilidades. Node 24.19.0. Se generó `package-lock.json`.
- `npm test`: **10 pruebas aprobadas**, ninguna fallida.
- `npm run build`: **aprobado** con Vite 7.3.6; 52 módulos transformados.
- Build final: JS 364.55 kB (106.70 kB gzip); CSS 89.46 kB (20.15 kB gzip). Sin errores de compilación.
- Sintaxis de `src/main.js`: verificada.
- Revisión visual/funcional en navegador local: entrada, home, seis mundos, perfil/Constelaciones, Sudoku, Sketch, preferencias, audio/mute, modo discreto, acceso QA sin configuración y fallo de envío de chat conservando el texto.
- Viewports revisados: móvil 320×740 y 360×800; tablet 768×1024; escritorio aproximadamente 1920×1234; ultrawide 2560×1440. No se detectó desbordamiento horizontal en las vistas revisadas. Se corrigió la navegación móvil para permitir textos mayores sin ocupar la pantalla.
- Los seis mundos se abrieron en tablet con encabezado correcto y consola sin errores/advertencias.

## Pruebas automatizadas

1. Apertura de ajedrez: 20 movimientos legales; mate del loco termina la partida.
2. Enroque mueve torre y rey.
3. Captura al paso y promoción.
4. QA autorizado aísla XP, perfil, mensajes, push, dibujos y acceso a salas reales; restaura perfil/avatar al salir.
5. Cuenta Auth sin rol administrativo no activa QA.
6. Mensaje rechazado por DB no se muestra como enviado ni se difunde.
7. Guardado confirmado antes del Broadcast; INSERT repetido no duplica mensaje.
8. Broadcast + INSERT producen una sola fila ordenada.
9. `client_id` conserva una sola versión confirmada.
10. Presence elige sesión activa entre varias pestañas y vence sesiones antiguas.

Las pruebas de QA/chat usan un backend simulado en memoria para verificar la lógica y los efectos secundarios. No utilizan cuentas ni datos reales.

## Requiere el Supabase del propietario

No se proporcionaron URL/clave del proyecto, cuenta Auth administrativa ni acceso SQL. Por tanto, no se ejecutó la migración remota ni se realizó la prueba real Chrome Carlos + Edge Kora. Tampoco se probaron Web Push, carga remota a Storage o sincronización Duo contra el backend real. No se afirma que una compilación local garantice esas integraciones.

La guía `README_MIGRACION_5.md` incluye variables, orden SQL, alta de administrador y pasos de verificación posterior al despliegue. El esquema conserva las políticas anónimas de juego 4.x; el rol QA está protegido por Auth/RLS. La migración fue revisada en código y no ejecutada contra PostgreSQL en esta sesión.

## Alcance de la entrega

Código fuente y recursos originales más cambios V5, lockfile, pruebas, migración aditiva y guía. Sin node_modules, dist ni secretos. La compilación se valida antes de empaquetar; Vercel genera su propio dist a partir del código y sus variables.
