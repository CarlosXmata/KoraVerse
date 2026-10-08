# Corrección de Illegal invocation en Signals

El error mostrado en `stop()` corresponde al temporizador de TypingPulse. Guardar `setTimeout`/`clearTimeout` directamente como propiedades y ejecutarlas mediante `this.schedule()`/`this.cancel()` les pasaba la instancia como receptor. En navegadores que exigen el objeto global, eso provoca TypeError: Illegal invocation.

Se cambiaron los valores por defecto por funciones que invocan explícitamente `globalThis.setTimeout` y `globalThis.clearTimeout`. Se conserva la inyección de temporizadores de prueba, el ritmo de eventos typing y todos los recorridos de fotos sin login.

Prueba nueva: simula la exigencia de receptor global para ambos temporizadores, incluyendo stop antes de escribir, input, stop repetido y expiración. La implementación anterior falla esa comprobación; la corregida pasa.

Verificación adicional en navegador Chromium con la aplicación local: escribir, pulsar enviar, cerrar mientras se escribe, reabrir y vaciar el campo. Sin errores en la consola. Sin Supabase local, enviar muestra el aviso previsto de conexión y conserva el texto; no se enviaron mensajes reales. Captura: validation/social2/timer-browser-check.jpg.

`npm test`: 59 pruebas aprobadas. `npm run build`: aprobado. El bundle mantiene la verificación de ausencia de service role y login de fotos.

Para instalar: usar el nuevo ZIP completo o reemplazar únicamente `src/signals-utils.js` en la versión Fotos Sin Login y desplegar de nuevo. No requiere SQL, cambios de variables ni migración de datos. La entrega anterior queda conservada en outputs/social2-no-login.
