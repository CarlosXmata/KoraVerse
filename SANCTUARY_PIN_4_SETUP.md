# Santuario · llave de cuatro cifras

La experiencia final es mantener pulsada la estrella, ver «Introduce la llave» e introducir cuatro números. El servidor valida automáticamente al cuarto dígito. No se muestran email, contraseña, hash, salt o clave de bóveda en esa pantalla.

El modo anterior continúa por defecto. No basta con cambiar una frase por cuatro cifras: el PIN valida la sesión y una clave aleatoria independiente protege las páginas mediante el cifrado AES-GCM/HKDF existente. El formato de las entradas sigue en versión 1; `key_version` indica qué clave las protege.

## Preparar una vez

1. Respaldar las variables anteriores y las tablas privadas desde Supabase antes de comenzar. Conservar la frase anterior, las credenciales Auth del propietario y SANCTUARY_VAULT_KEY en almacenamiento seguro del operador.
2. Ejecutar `migration_social_v5_1.sql` después de la migración 5.1. No cambiar SANCTUARY_PIN_MODE todavía.
3. En un terminal interactivo de confianza, ejecutar `node scripts/setup-sanctuary-pin4.mjs`. Escribir el PIN sin ponerlo en argumentos. Admite cero inicial. El script imprime salt/hash y, solo si faltan en el entorno, secretos aleatorios de sesión y bóveda. No imprime el PIN.
4. Guardar las variables en Vercel **solo servidor**. Mantener SANCTUARY_ORIGIN como origen HTTPS exacto y SANCTUARY_OWNER_USER_ID como UUID real del propietario. Conservar SANCTUARY_PIN_MODE=legacy hasta completar la conversión. La clave de bóveda debe ser exactamente 32 bytes aleatorios codificados en Base64; el PIN no la sustituye.

El usuario no realiza esta preparación al entrar. El operador la realiza una vez para instalar la expansión.

## Conservar un diario anterior

1. Cerrar todas las ventanas del Santuario. Publicar esta versión con **SANCTUARY_MAINTENANCE=true**: bloquea las APIs privadas y nuevos desbloqueos. Esperar que terminen las solicitudes anteriores antes de ejecutar el script. Esta pausa evita que un cliente antiguo escriba con su clave anterior durante el cambio.
2. En el terminal administrativo, cargar SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, SANCTUARY_OWNER_USER_ID y SANCTUARY_VAULT_KEY sin exponerlas en el historial. El script no carga `.env` automáticamente; con Node compatible se puede usar `node --env-file=RUTA_PRIVADA scripts/migrate-sanctuary-vault.mjs`. Ese archivo privado nunca va en GitHub/ZIP.
3. Ejecutar `node scripts/migrate-sanctuary-vault.mjs`. Solicita la frase anterior una sola vez con entrada oculta. Descifra localmente, vuelve a cifrar con la clave fuerte, comprueba cada contenido y conserva los IDs. No imprime texto ni secretos.
4. La función SQL bloquea escrituras durante la transacción, comprueba cantidad, IDs y ciphertext previo, conserva los originales **cifrados** en `koraverse_sanctuary_key_backup`, actualiza key_version=2 y revoca sesiones. Si algo falla, revierte toda la transacción; no deja una conversión parcial. No ejecutar en paralelo con otra conversión.
5. Solo al terminar: activar SANCTUARY_PIN_MODE=four-digit y SANCTUARY_MAINTENANCE=false y redesplegar. Abrir la estrella e introducir el PIN. Revisar todas las páginas antes de editar nuevas. Una bóveda nueva se crea directamente en versión de clave 2; no necesita conversión.

No se ejecutó este proceso sobre un diario real en esta entrega. Requiere las variables reales y la frase anterior conocida por su propietario.

## Protección y límites

- Cinco intentos por quince minutos por IP y, en modo numérico, también por propietario a través de IP distintas. Los intentos correctos también consumen el contador; esperar si se alcanza el límite. Respuestas genéricas, sin indicar qué cifra falló.
- Sesión de veinte minutos, cookie HttpOnly/Secure/SameSite=Strict, origen comprobado, caducidad/inactividad y bloqueo al ocultar la página.
- El PIN se verifica en servidor mediante scrypt/hash; no está en HTML, bundles, localStorage o SQL. Un cambio de PIN, modo o clave revoca las sesiones por su firma.
- La clave aleatoria se entrega por HTTPS únicamente tras validación y se deriva a una clave no extraíble en memoria. No se persiste en el navegador. El servidor/operador conoce la clave fuerte: este modelo delega confianza al servidor y sacrifica la protección de una frase que solo conocía el propietario a cambio de la UX solicitada.
- La seguridad de acceso sigue limitada por las 10.000 combinaciones del PIN, el control de intentos y el servidor. El diario no se cifra usando esos cuatro números. Proteger las variables y la cuenta del operador, y conservar la clave fuerte: perderla impide recuperar páginas nuevas.

## Cambiar el PIN

Cargar **SANCTUARY_VAULT_KEY y SANCTUARY_SESSION_SECRET actuales** antes de ejecutar `setup-sanctuary-pin4.mjs` nuevamente. Actualizar únicamente SANCTUARY_PIN_SALT y SANCTUARY_PIN_HASH con el nuevo resultado, mantener el modo y redesplegar. No reemplazar la clave de bóveda ni volver a ejecutar la conversión: cambiar el PIN no cambia el cifrado de las páginas.

## Volver al acceso anterior

Si todavía no se convirtió un diario, mantener legacy y las variables antiguas es suficiente. Si se convirtió pero **aún no hubo nuevas escrituras/borrados**, activar mantenimiento, dejar finalizar solicitudes y ejecutar en SQL Editor administrativo:

```sql
select public.koraverse_rollback_vault_key('UUID_REAL_DEL_PROPIETARIO'::uuid);
```

La función exige que todas las entradas sigan idénticas a las recién convertidas. Restaura ciphertext/iv/salt anteriores, key_version=1 y revoca sesiones. Después restaurar salt/hash/secret de sesión anteriores y modo legacy, desactivar mantenimiento y redesplegar. Volver a entrar con Auth y la frase anterior. No borra mensajes ni imágenes.

Si hubo páginas nuevas, editadas o eliminadas, **la función rechaza la reversión** para evitar perderlas. Conservar la clave fuerte y los respaldos; hace falta una conversión inversa supervisada con todas las entradas actuales. No cambiar el modo o reemplazar claves a ciegas ni restaurar una copia antigua sobre datos recientes.

## SANCTUARY_SIMPLE_LOCAL_PIN

Opción documentada, **no implementada ni activada**: el usuario no ha insistido en almacenar un PIN en frontend. Si se implementara, «Esta opción solo oculta visualmente el Santuario. El PIN puede encontrarse inspeccionando el código». No usarla para diarios sensibles. La implementación entregada verifica en servidor.
