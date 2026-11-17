# Firma Android bajo control del propietario

El workflow `Distribución fase 08` produce un release no depurable. Si faltan los cuatro secretos, lo firma con una clave efímera de CI, lo prueba y lo etiqueta **SOLO-VERIFICACION-CI**. Ese APK no es la versión permanente del propietario y no sirve como cadena estable de actualizaciones. La clave efímera se elimina al terminar el job.

Para la distribución permanente, crear o recuperar una clave del propietario en un equipo de confianza, fuera del checkout. El alias, las dos contraseñas y el archivo deben tener una copia de recuperación separada. Perder la clave impide actualizar instalaciones firmadas con ella. No enviar claves ni contraseñas por el chat ni agregarlas al repositorio.

Si no existe una clave anterior, ejecutar en ese equipo, con un JDK instalado (solo el desarrollador necesita estas herramientas):

```powershell
New-Item -ItemType Directory -Force "$env:USERPROFILE\NexoLineal-claves"
keytool -genkeypair -keystore "$env:USERPROFILE\NexoLineal-claves\nexolineal-release.jks" -alias nexolineal -keyalg RSA -keysize 3072 -validity 10000
```

`keytool` solicita las contraseñas de forma interactiva. Guardar el archivo en copia de seguridad antes de publicar. Si ya existe una clave de una distribución anterior, usar esa misma clave.

En Settings → Secrets and variables → Actions → New repository secret, configurar:

| Secreto | Contenido |
|---|---|
| NEXO_KEYSTORE_BASE64 | Archivo JKS codificado en base64 |
| NEXO_KEY_ALIAS | Alias elegido, por ejemplo `nexolineal` |
| NEXO_STORE_PASSWORD | Contraseña del almacén |
| NEXO_KEY_PASSWORD | Contraseña de la clave |

Para copiar el JKS codificado al portapapeles local sin imprimirlo en un registro:

```powershell
[Convert]::ToBase64String([IO.File]::ReadAllBytes("$env:USERPROFILE\NexoLineal-claves\nexolineal-release.jks")) | Set-Clipboard
```

Pegar únicamente en el campo del secreto correspondiente. Limpiar el portapapeles después con `Set-Clipboard -Value ''`. Estos pasos los realiza el propietario; no se automatiza la introducción de credenciales en su navegador.

Volver a ejecutar el workflow desde la rama verificada. El artefacto debe llamarse `Android-Propietario`; comprobar `owner_signed: true`, el resultado de `apksigner verify --verbose --print-certs` y conservar la huella del certificado junto con la copia del JKS. Nunca publicar la contraseña, el JKS ni su base64 como evidencia.

Un APK debug o CI instalado con otra firma no admite actualización directa con esta clave. Exportar el proyecto desde la aplicación antes de desinstalar esa versión de prueba. Restaurar el JSON después de instalar la versión del propietario. Android elimina los datos privados al desinstalar; esta limitación difiere de la conservación de datos del instalador Windows.

Fuentes: [firma de aplicaciones Android](https://developer.android.com/studio/publish/app-signing.html) y [compilaciones release](https://developer.android.com/build/build-for-release).
