# Validación · Signals 2.0

Fecha: 8 de octubre de 2026. Proyecto: KORAVERSE 5.1 actual ampliado, JavaScript vanilla/Vite/Supabase. No se reemplazó el repositorio anterior ni sus migraciones.

## Revisión actual: fotos sin login

Se eliminó la sesión Auth de fotos. Las tres APIs del servidor se prueban con el cliente ChatMedia en Carlos → Kora y Kora → Carlos, incluyendo carga automática tras recarga. Se comprueban bucket privado, perfiles/rutas/origen, límites, firma de 300 segundos y limpieza protegida. FOTOS_SIN_LOGIN.md detalla el cambio. Las capturas visuales siguientes pertenecen a la revisión anterior y se conservan como evidencia histórica; no representan una nueva comprobación contra Supabase remoto.

## Resultado local

**npm test: 58 pruebas, 58 aprobadas, 0 fallos. npm run build: aprobado.** Logs íntegros en `validation/social2/npm-test.log` y `npm-build.log`.

Build: Vite 7.3.6, 77 módulos; JS principal 494.36 kB (153.42 kB gzip), CSS 125.98 kB (28.11 kB gzip). Node de validación: 24.19.0. Se usó npm mediante el runtime disponible; los comandos ejecutados son los definidos en package.json. No se incluyen node_modules, dist ni secretos en el ZIP.

## Cobertura comprobada

| Área | Evidencia |
|---|---|
| Escritura | Pulsos limitados, refresco/caducidad y active=false; no almacenamiento |
| Sonidos | Contexto reutilizado, tonos diferenciados, menor volumen abierto; receptor real ignora mensajes propios/duplicados/QA/mute/discreción |
| Chat | Persistir antes de Broadcast, no mostrar si falla DB, deduplicación client_id/id; compatibilidad con texto/dibujos anteriores |
| Frases/invitaciones | Texto real escapado, CTA y código válido; tarjeta de sala cerrada/entrada local, deep links restringidos |
| Fotos | Metadata sin Base64/URL firmada, límites y rutas, QA no sube; preparación con canvas probada en navegador |
| Storage | SQL ejecutado dos veces en PostgreSQL local PGlite; anon sin lectura, miembros leen, insert solo ruta propia y delete solo propietario |
| Trivia | 20 únicas en cada banco, 5/10/5 dificultades; Mix sin repetición; 20 rondas Duo, mismas opciones, bloqueo hasta ambos, respuestas repetidas/ajenas rechazadas, estado serializable |
| Push | Mensaje persistido consultado en servidor, un recibo por ID, payload genérico y clic con ruta validada/foco de PWA |
| PIN/diario | Cuatro cifras con cero inicial, envío automático, error genérico, límite/origen/marcador de migración; cookie segura; rotación invalida sesión; mantenimiento bloquea API |
| Conversión | Descifrar/re-cifrar conserva contenido; frase errónea/PIN como clave no descifran; SQL revierte fallos/concurrencia y rollback rechaza nuevas ediciones |
| Regresión | Pruebas de narrativa/cinemática, Atlas, cumpleaños, rosas, constelaciones, presencia, cifrado y ajedrez; hashes de archivos fuera del alcance social |

La integración del receptor usa adaptadores controlados para Supabase. La prueba SQL ejecuta SQL real con esquemas Auth/Storage de prueba, no un servicio Supabase desplegado.

## Revisión visual en navegador

- Aplicación principal sin Supabase configurado: navegar El Caos → Trivia Solo → Mix, responder veinte preguntas distintas y terminar con **5/20, 25%, 25 XP y mejor racha 2**. Se eligió la primera opción para comprobar el recorrido; el resultado no pretende evaluar conocimientos.
- Renderers aislados: frase, foto simulada, invitación, visor fullscreen con zoom y enlace para guardar, teclado PIN y error genérico. El PIN correcto de la muestra abre solo una pantalla simulada.
- Móvil 320 × 568: ancho del documento 320; panel de x=8 a x=312, y=8 a y=560; campo de escritura termina en y=548.8. Sin desbordamiento horizontal.
- Móvil 360 × 800: documento 360; panel x=8 a x=352, y=8 a y=792; campo termina en y=780.8. Compositor visible y área de mensajes desplazable.
- Preparación real con canvas de JPEG sintético **3200 × 2000 → 1800 × 1125, ~12 KB WebP**. La imagen se cargó en la muestra local y no se subió a Storage.

Capturas en `validation/social2/`: desktop-photo.jpg, chat-320.jpg, mobile-photo-360.jpg, mobile-lightbox-360.jpg, pin-360.jpg, pin-error-360.jpg, solo-result-20.jpg y prepared-photo-desktop.jpg. `browser-checks.json` contiene medidas y alcance. Algunas capturas anteriores del proyecto se conservan como evidencia histórica de sus entregas, no como pruebas nuevas de Signals.

## Pendiente en la instalación real

No hay credenciales reales/proyecto Supabase conectado. Por tanto **no se certifican todavía** subida/lectura de fotos remotas, entrega de chat/push en dos navegadores, permisos del dispositivo, recuperación de una sala real ni conversión del diario del propietario. No se aplicó SQL remoto, no se eligió/cambió un PIN real y no se desplegó en Vercel.

Seguir README_SOCIAL_2.md para probar esos recorridos después de configurar las cuentas, políticas, Realtime y variables. Seguir SANCTUARY_PIN_4_SETUP.md para mantenimiento, conversión y reversión. El código y la migración están preparados y validados localmente; esas comprobaciones de instalación siguen siendo necesarias.

## Paquete y recuperación

`ARCHIVOS_SOCIAL_2.md` lista exactamente archivos anteriores modificados y añadidos respecto al punto de partida. `MANIFEST_SOCIAL_2.json` registra SHA-256 de los archivos del paquete (excepto el propio manifiesto). Se comprueba la integridad CRC y el contenido del ZIP. La entrega anterior permanece sin sobrescribir.

Desplegar la versión anterior revierte el frontend social conservando mensajes/bucket. El diario exige rollback protegido antes de nuevas escrituras o conversión inversa supervisada; no cambiar la clave fuerte ni restaurar páginas antiguas sobre nuevas.
