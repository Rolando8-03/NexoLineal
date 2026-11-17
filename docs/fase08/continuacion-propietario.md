# Qué falta para el cierre físico de fase 08

No se necesita enviar contraseñas, certificados ni archivos privados por chat. El código, los flujos de compilación y las pruebas automatizadas pueden continuar con el acceso existente. Los siguientes puntos requieren un entorno o una acción del propietario.

| Necesidad | Acción concreta | Evidencia de cierre |
|---|---|---|
| Firma Android permanente | Configurar los cuatro secretos descritos en [firma-android.md](firma-android.md) y ejecutar Distribución fase 08 | APK `Propietario`, `owner_signed: true`, verificación de firma y huella del certificado conservada |
| Teléfono Android físico | Tener disponible un teléfono ARM64, indicar modelo y versión de Android y ejecutar los ensayos de [verificacion.md](verificacion.md) | Primer inicio en modo avión, teclado, Atrás, interrupción, reapertura y proyecto portable aprobados en ese teléfono |
| Windows objetivo | Tener disponible un Windows x64 sin Python y un entorno con WebView2 inicialmente ausente | Instalación offline, primer inicio, desinstalación/reinstalación y conservación del proyecto |
| Medidas en equipos objetivo | Ejecutar y registrar las mediciones repetidas del protocolo | Tiempos, memoria y tamaños con modelo/sistema, repeticiones y limitaciones |

El equipo remoto previamente disponible figuró desconectado durante esta fase. No se simuló presencia de un dispositivo físico. La firma Authenticode Windows permanece sin configurar; esto se declara en los manifiestos y no impide construir el instalador de prueba.

No avanzar a fase 09 ni declarar fase 08 al 100 % mientras el registro conserve esos criterios pendientes. Continuar desde B51/B52 (Windows objetivo), B53 (clave del propietario), B54 (teléfono físico) y B56 (medidas objetivo), reutilizando el código y artefactos verificados.
