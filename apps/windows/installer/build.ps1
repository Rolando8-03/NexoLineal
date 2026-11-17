$ErrorActionPreference = 'Stop'
New-Item -ItemType Directory -Force dist | Out-Null
# El instalador completo permite primer inicio sin descarga de prerrequisitos.
$runtime = Join-Path $pwd 'dist/WebView2-Evergreen-x64.exe'
Invoke-WebRequest 'https://go.microsoft.com/fwlink/?linkid=2124701' -OutFile $runtime
$signature = Get-AuthenticodeSignature $runtime
if ($signature.Status -ne 'Valid' -or $signature.SignerCertificate.Subject -notmatch 'Microsoft Corporation') { throw 'El prerrequisito WebView2 no tiene una firma Microsoft válida.' }
pyinstaller --noconsole --onefile --name NexoLineal --icon assets/icono.ico --add-data 'apps/frontend/dist;ui' --collect-submodules nexolineal --hidden-import apps.windows.main --hidden-import apps.windows.smoke --paths . apps/windows/entrypoint.py
if ($LASTEXITCODE -ne 0) { throw 'Falló PyInstaller' }
python -c "import pefile; assert pefile.PE('dist/NexoLineal.exe').OPTIONAL_HEADER.Subsystem == 2"
if ($LASTEXITCODE -ne 0) { throw 'El EXE no es gráfico' }
$iscc = "${env:ProgramFiles(x86)}\Inno Setup 6\ISCC.exe"
if (-not (Test-Path $iscc)) { throw 'Se necesita Inno Setup 6 para compilar el instalador.' }
& $iscc apps/windows/installer/NexoLineal.iss
if ($LASTEXITCODE -ne 0) { throw 'Falló Inno Setup' }
New-Item -ItemType Directory -Force evidencia-fase08 | Out-Null
Get-ChildItem dist/*.exe | ForEach-Object {
 $sig = Get-AuthenticodeSignature $_.FullName
 [pscustomobject]@{ name=$_.Name; bytes=$_.Length; sha256=(Get-FileHash $_.FullName -Algorithm SHA256).Hash.ToLower(); authenticode=$sig.Status.ToString(); signer=$sig.SignerCertificate.Subject }
} | ConvertTo-Json | Set-Content -Encoding utf8 evidencia-fase08/windows-archivos.json
