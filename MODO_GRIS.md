# El color de cada órbita

Tras cinco días completos sin visitar un perfil (120 horas), su universo pasa a gris. Entrar, cambiar de mundo o recargar no recupera el color: hace falta ganar nueva EXP personal y que esa EXP se guarde. Una sola actividad que otorgue EXP basta; no se descuenta progreso ni se bloquea el acceso.

## Activación

1. En Supabase, ejecutar `supabase/migration_color_rest.sql` después de las migraciones existentes, incluida `migration_social_v5_1.sql`.
2. Subir este repositorio a GitHub y desplegarlo en Vercel con las variables de servidor actuales. No hay claves nuevas.
3. En el Santuario de Carlos, abrir los controles del universo y buscar **El color de cada órbita**. Carlos y Kora tienen botones separados **Activar gris** y **Quitar simulación**; pueden activarse ambos.

La simulación se guarda por perfil y se ve también en otros navegadores. El perfil abierto refresca el estado aproximadamente cada veinte segundos mientras la página está visible, y al regresar a la pestaña. Al ganar nueva EXP, también se elimina la simulación. Quitarla manualmente no elimina un descanso real ya registrado por inactividad.

## Comportamiento

- La última visita se registra en el servidor, por perfil; una pestaña oculta no mantiene la actividad. Un perfil abierto y visible sí cuenta como visita.
- La migración inicial toma la última actividad existente. Un perfil que ya lleve cinco días ausente puede aparecer gris al volver después de instalarla.
- El estado gris queda guardado aunque se recargue o se abra otro navegador.
- La EXP obtenida en QA no cambia el estado real.
- Activar la simulación no altera EXP, recuerdos ni la última visita. La fecha de visita cambia únicamente cuando ese perfil está usando la aplicación.
- Las fotos conservan su bucket privado, URLs firmadas y envío sin login adicional. Se conserva la corrección de los temporizadores de escritura.

## Verificación

La migración se ejecutó dos veces en PostgreSQL local mediante PGlite y se probaron el límite exacto de cinco días, visitas repetidas, EXP nueva, ambos perfiles, permisos y simulación reversible. Las pruebas de servidor comprueban que los controles requieren una sesión vigente del Santuario y aceptan únicamente `carlos` o `kora` y valores booleanos.

La muestra visual local `gray-preview.html` no accede al servidor ni cambia perfiles; sirve para revisar el aspecto gris y su recuperación. No forma parte del bundle de producción.

Validación final: 63 pruebas aprobadas, compilación de producción aprobada y revisión del bundle sin clave de servicio ni login independiente de fotografías. Los registros están en `validation/social2/`.

No se instaló esta migración en tu Supabase ni se desplegó este ZIP en Vercel durante esta entrega. La prueba real entre tus navegadores queda pendiente de aplicar la migración y desplegar.
