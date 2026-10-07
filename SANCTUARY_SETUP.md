# Configurar El Santuario

## Identidad y variables exactas

Elegir «Carlos» en V5 no acredita una identidad: el sistema social original usa nombres compartidos. El Santuario exige además una cuenta Supabase Auth concreta y una llave privada. QA y Santuario son accesos independientes; ser administrador QA no abre el diario.

| Variable | Dónde | Uso |
|---|---|---|
| VITE_SUPABASE_URL | Cliente y servidor | URL del proyecto Supabase |
| VITE_SUPABASE_KEY | Cliente | Clave anon / pública existente |
| VITE_VAPID_PUBLIC_KEY | Cliente, opcional | Suscripción Web Push |
| SUPABASE_URL | Servidor, opcional | URL; si falta usa VITE_SUPABASE_URL |
| SUPABASE_SERVICE_ROLE_KEY | Solo servidor | Acceso de las APIs a las tablas privadas y eventos |
| VAPID_PUBLIC_KEY | Servidor, opcional | Envío Push |
| VAPID_PRIVATE_KEY | Solo servidor, opcional | Firma Push |
| SANCTUARY_OWNER_USER_ID | Solo servidor | UUID de la cuenta Auth de Carlos |
| SANCTUARY_ORIGIN | Solo servidor | Origen HTTPS exacto, sin barra final ni ruta |
| SANCTUARY_PIN_SALT | Solo servidor | 32 bytes aleatorios en hexadecimal |
| SANCTUARY_PIN_HASH | Solo servidor | Hash scrypt de 64 bytes en hexadecimal |
| SANCTUARY_SESSION_SECRET | Solo servidor | Secreto aleatorio de 32 bytes en base64 |

No pongas secretos en variables `VITE_`, GitHub, el ZIP, un archivo JavaScript ni una captura pública. La plantilla contiene valores vacíos, no credenciales.

## Preparación

1. Aplica las migraciones V5 y V5.1 en ese orden. Las cuatro tablas del Santuario tienen RLS, sin políticas públicas y sin permisos anon/authenticated. Las APIs usan service_role.
2. Crea o identifica la cuenta Auth de Carlos en Supabase y copia su UUID a `SANCTUARY_OWNER_USER_ID`. Usa su correo y contraseña existente al abrir la puerta. No hace falta añadirla a `koraverse_admins` para el Santuario.
3. En una terminal interactiva ejecuta `node scripts/create-sanctuary-key.mjs`. Escribe una frase privada de al menos 8 caracteres; no se muestra ni se pasa como argumento. Copia únicamente SALT, HASH y SESSION_SECRET a Vercel. El generador no guarda la llave en disco.
4. Configura `SANCTUARY_ORIGIN`, por ejemplo `https://koraverse.example.com`, y despliega. Un dominio de preview distinto requiere su propia configuración de origen y variables. El acceso falla de forma cerrada si falta configuración.
5. En el inicio de Carlos, mantén presionada cuatro segundos la estrella decorativa a la derecha. Soltar antes cancela. También funciona con Espacio o Enter mantenidos. La pantalla dormida conserva una estrella para volver a la puerta. La API seguirá exigiendo la identidad autorizada aunque otra persona descubra el gesto.

## Protección implementada

La llave se verifica en el servidor con scrypt (N=32768, r=8, p=1) y comparación de tiempo constante. Primero se verifica la cuenta Auth autorizada. Un contador atómico limita los intentos a cinco por 15 minutos por origen de red e identidad. La sesión firmada HMAC dura 20 minutos, también se registra en la base de datos y puede revocarse al cerrar. Cookie `__Host-koraverse-sanctuary`: HttpOnly, Secure, SameSite=Strict, Path=/. Las mutaciones exigen el origen exacto; no hay CORS abierto. Cambiar el hash invalida sesiones anteriores.

El navegador deriva una raíz no exportable mediante PBKDF2-SHA256, 600000 iteraciones y sal de bóveda de 32 bytes. Cada página usa HKDF, AES-GCM, sal propia de 16 bytes e IV de 12 bytes; la identidad y el UUID de la página forman los datos autenticados. Título, cuerpo, fecha, etiquetas, sección, orden y estado de una carta viajan cifrados. El servidor solo recibe UUID, propietario, versión, sal, IV, ciphertext y fechas técnicas de creación/actualización. Las claves derivadas no se envían al servidor ni se guardan en localStorage.

Al cerrar, tras cinco minutos sin actividad, al ocultar la pestaña o al caducar la sesión, se retiran el contenido y las referencias a la clave. Esto reduce la exposición; JavaScript no puede garantizar un borrado físico inmediato de memoria. El navegador necesita HTTPS y WebCrypto.

Referencias de diseño: [WebCrypto deriveKey](https://developer.mozilla.org/en-US/docs/Web/API/SubtleCrypto/deriveKey), [Node crypto](https://nodejs.org/api/crypto.html), [sesiones OWASP](https://cheatsheetseries.owasp.org/cheatsheets/Session_Management_Cheat_Sheet.html) y [CSRF OWASP](https://cheatsheetseries.owasp.org/cheatsheets/Cross-Site_Request_Forgery_Prevention_Cheat_Sheet.html).

## Uso y recuperación

Diario permite crear, editar, buscar por título/fecha/etiqueta y retirar páginas. Origin prepara una sola vez cinco capítulos iniciales; se pueden ampliar y ordenar. Cartas guarda los estados Borrador, No enviar, Tal vez algún día y Terminada; no incluye envío. Confesiones es otra sección cifrada. Las búsquedas se hacen sobre texto descifrado en memoria.

Conserva la llave y una copia protegida de los datos cifrados. **Cambiar la llave cambia la clave de descifrado:** el paquete no incluye rotación con recifrado ni recuperación de una llave olvidada. Para seguir leyendo el diario actual, conserva la llave y la sal de bóveda. Rotar solamente SESSION_SECRET cierra sesiones y no afecta al cifrado. No cambies la sal de bóveda de una instalación con páginas.

Los controles Normal / Pausa / Descansando, modos estacionales y efectos se guardan en la tabla global. Otros navegadores consultan el estado cada 30 segundos; el cambio no es instantáneo. En pausa se congelan los efectos y el tiempo de juegos locales; las salas Duo remotas conservan su protocolo anterior. «Restaurar Classic y despertar» fuerza Classic; elige Automático para volver al calendario.

El Santuario es cifrado del lado del cliente, no una defensa frente a un despliegue malicioso que altere JavaScript ni frente a alguien que controle el navegador desbloqueado. El canal social heredado y las APIs de hitos compartidos conservan el modelo de confianza Carlos/Kora de V5; no deben usarse para datos privados. Las pruebas locales no sustituyen una revisión de seguridad del despliegue real.
