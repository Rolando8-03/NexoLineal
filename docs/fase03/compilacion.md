# Compilar y verificar los prototipos

Los comandos de este documento son instrucciones para desarrollo. El usuario final abre una aplicación gráfica.

## Requisitos fijados

| Componente | Versión |
| --- | --- |
| Python del desarrollo | 3.12 |
| Python mínimo del núcleo | 3.10 |
| Node | 22 |
| React y React DOM | 19.3.1 |
| TypeScript | 5.9.3 |
| Vite | 7.3.8 |
| KaTeX | 0.18.2 |
| Pyodide web | 0.26.2 |
| Capacitor core y Android | 7.6.10 |
| Chaquopy | 17.2.0 |
| Python del APK | 3.12 |
| Java | 21 |
| Gradle Wrapper | 8.11.1 |
| Android Gradle Plugin | 8.7.2 |
| Kotlin | 2.0.21 |
| pywebview | 6.2.1 |
| PyInstaller | 6.22.3 |

`package-lock.json` fija también el árbol transitivo npm. El Wrapper comprueba el SHA-256 oficial de la distribución Gradle. Los requisitos nativos están en `apps/windows/requirements.txt` y los archivos Gradle de Android.

La versión de parche exacta de Python y Node proporcionada por Actions queda en los logs de cada ejecución. El núcleo no depende de paquetes matemáticos externos en producción. SymPy y jsonschema son herramientas de verificación.

## Web

Desde la raíz del repositorio, instalar el paquete para ejecutar las verificaciones nativas de referencia.

```sh
python -m pip install -e packages/core
cd apps/frontend
npm ci
npm run build
npm run preview
```

Abrir la dirección indicada por Vite. La compilación predeterminada es web. Para un alojamiento estático se publica el contenido de `apps/frontend/dist`, que incluye Python y las fuentes locales. Se requiere HTTPS o localhost para las funciones del Worker y la comprobación criptográfica. La prueba impide solicitudes a servidores externos durante la ejecución de la página.

Esta fase verifica ejecución con recursos locales servidos. La recarga web sin conexión mediante Service Worker y su política de actualización pertenece al bloque B50.

## Windows

En Windows con WebView2 instalado, preparar el entorno y compilar el mismo frontend para el puente nativo.

```powershell
python -m pip install -e packages/core -r apps/windows/requirements.txt
cd apps/frontend
npm ci
$env:VITE_TARGET = "windows"
npm run build
cd ../..
python -m apps.windows.main
```

Crear el ejecutable gráfico con Python incluido.

```powershell
pyinstaller --noconsole --onefile --name NexoLineal-Prototipo --icon assets/icono.ico --add-data "apps/frontend/dist;ui" --collect-submodules nexolineal --hidden-import apps.windows.main --hidden-import apps.windows.smoke --paths . apps/windows/entrypoint.py
```

El resultado está en `dist/NexoLineal-Prototipo.exe`. El workflow abre la ventana desde fuente y después abre ese ejecutable, ejecuta el puente real y comprueba que su subsistema PE sea gráfico. El instalador con accesos directos, desinstalación y firma corresponde a fase 08.

## Android

Requiere Android SDK con plataforma 35, Java 21 y Python 3.12 para la preparación. La aplicación declara Android mínimo 7.0/API 24 y ABIs arm64-v8a y x86_64.

```sh
python -m pip install -e packages/core
cd apps/frontend
npm ci
VITE_TARGET=android npm run build
cd ../..
python apps/android/prepare.py
apps/android/gradlew -p apps/android assembleDebug assembleDebugAndroidTest
```

En PowerShell, establecer `$env:VITE_TARGET = "android"` antes de `npm run build` y usar `apps/android/gradlew.bat`.

El APK está en `apps/android/app/build/outputs/apk/debug/app-debug.apk`. Incluye Python y el frontend, y usa firma debug para pruebas. En un dispositivo de desarrollo puede instalarse con `adb install -r`. La versión de distribución con firma del propietario y actualizaciones se prepara en fase 08.

## Verificación automatizada

El workflow `Plataformas fase 03` compila los tres destinos, prueba la ventana Windows, ejecuta el APK en un emulador sin Wi-Fi ni datos y verifica la paridad. Produce los artefactos `fase03-web`, `fase03-windows`, `fase03-android` y `fase03-paridad`.

Los artefactos de Actions se conservan durante 30 días. El código y las instrucciones permiten volver a generarlos. El workflow de la línea de partida conserva además los recorridos de la interfaz anterior.

## Actualizaciones de seguridad incorporadas

Las versiones fijadas incluyen las correcciones publicadas en [Capacitor GHSA-rvm3-566m-v7fv](https://github.com/ionic-team/capacitor/security/advisories/GHSA-rvm3-566m-v7fv), [Vite GHSA-p4f5-76q4-ffq7](https://github.com/vitejs/vite/security/advisories/GHSA-p4f5-76q4-ffq7) y [KaTeX GHSA-238p-pmpm-9mq7](https://github.com/KaTeX/KaTeX/security/advisories/GHSA-238p-pmpm-9mq7). CI ejecuta npm audit para comprobar el árbol instalado en el momento de cada compilación.

La referencia de integridad de Gradle se obtiene de [sus checksums oficiales](https://gradle.org/release-checksums/).

Las compilaciones debug de Android pueden usar certificados de prueba distintos entre ejecuciones de CI. Si Android rechaza una actualización por firma incompatible, el prototipo anterior debe desinstalarse antes de instalar el nuevo. La firma permanente y la actualización conservando datos se resuelven en fase 08.
