# KORAVERSE 5.1 — The Living Sky

Expansión sobre KORAVERSE 5. Se mantienen Vite, JavaScript, Supabase, Realtime, Storage, Auth, Web Push, Service Worker y Web Audio. No se añadió otro servidor de sockets ni un framework de interfaz.

## Qué incorpora

- Motor de fechas en America/Santo_Domingo: Prelude el 8–9 de octubre de 2026, Alignment el 10 y Afterglow el 11. Classic fuera del evento; controles manuales y restauración.
- Llegada cinematográfica de 16 etapas, versión breve con movimiento reducido, reloj pausado en pestañas ocultas y recibo persistente al completarse.
- Diez rosas con textos ES/EN, apertura guardada, décima rosa dorada y recuerdo final. Avatares con gorritos vectoriales y objetos de lectura, café y ajedrez.
- Atlas Celeste con recuerdos de V5, Aurelia, constelaciones, búsqueda exacta por fecha, viaje acumulativo, cronología y repetición de la alineación.
- Vaca-Señal y KORA-Señal: reacciones discretas y destinos para mensajes, dibujos e invitaciones. Las notificaciones externas muestran texto genérico.
- Santuario privado: cuenta autorizada de Carlos + llave, sesión protegida, diario cifrado, Origin, cartas sin envío, confesiones y control del universo.
- QA autorizado conserva sus pruebas anteriores y añade modos, avatar, rosas, Atlas y señales simuladas.

## Actualizar una instalación

1. Conserva el ZIP V5 y una copia de seguridad de Supabase antes de migrar.
2. Si ya ejecutaste las migraciones de V5, ejecuta únicamente `supabase/migration_v5_1.sql` en el SQL Editor. Es aditiva e idempotente. No borra perfiles, XP, mensajes, avatares ni recuerdos.
3. Para una instalación nueva, sigue primero `README_MIGRACION_5.md` y luego aplica V5.1. No ejecutes los archivos base antiguos a ciegas sobre producción.
4. Configura las variables de `.env.example` según `SANCTUARY_SETUP.md`. Los nombres con `VITE_` son públicos; los demás son exclusivamente del servidor.
5. Sube el contenido de la carpeta raíz del ZIP a GitHub. En Vercel: framework Vite, instalar `npm ci`, compilar `npm run build`, salida `dist`, Node 22. Las cinco funciones de `api/` deben desplegarse junto al frontend; un hosting puramente estático no ofrece el Santuario.
6. Vuelve a desplegar después de cambiar variables. Prueba desde el dominio HTTPS que coincide exactamente con `SANCTUARY_ORIGIN`.

## Antes del 10/10

En QA autorizado, usa Prelude / Alignment / Afterglow, Diez rosas o Atlas de prueba. No crean progreso remoto. En el Santuario puedes seleccionar Alignment con **Vista previa** activada y guardar el estado; recuerda regresar a Automático para la fecha real. El botón «Ver la llegada de Kora» repite la película sin guardar.

Para revisar solo el aspecto en tu equipo: `npm ci`, `npm run dev`, abrir `/preview.html`. Este laboratorio contiene datos ficticios, no autentica al Santuario y no forma parte de `dist`. El backend de Vercel no se ejecuta con Vite; para probar APIs reales usa un despliegue HTTPS o Vercel dev con variables configuradas. La cookie Secure necesita un contexto compatible.

## Classic y restauración

Los estilos originales `style.css` y `v5.css`, el catálogo de avatares, los juegos y el motor de ajedrez permanecen en la base. Classic desactiva la transformación estacional; conserva el acceso nuevo al Atlas y la estrella privada de Carlos. Para recuperar exactamente el artefacto anterior, vuelve a desplegar el ZIP V5 conservado. Las tablas nuevas pueden permanecer sin modificar las antiguas. No es necesario borrarlas para hacer rollback.

## Comprobaciones después de desplegar

Abre Carlos y Kora en dos navegadores; comprueba Presence, texto persistente, invitaciones a café y ajedrez, y una sala Duo. Prueba QA con una cuenta autorizada. Abre el Santuario con Carlos; comprueba llave incorrecta, guardar/cerrar/reabrir una página, búsqueda, sesión caducada, pausa, pantalla dormida y despertar. Simula el cumpleaños sin guardar y restaura Automático. Confirma que ninguna respuesta pública contiene textos del diario.

Los detalles de pruebas ejecutadas y límites reales están en `VALIDACION_5_1.md`. No se aplicó esta migración a tu Supabase ni se publicó este paquete en Vercel desde esta ejecución.
