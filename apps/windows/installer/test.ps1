$ErrorActionPreference = 'Stop'
$root = $pwd.Path
$installer = (Get-Item 'dist/NexoLineal-*-Setup.exe').FullName
$installDir = Join-Path $env:LOCALAPPDATA 'Programs/NexoLineal'
$store = Join-Path $env:LOCALAPPDATA 'NexoLineal'
New-Item -ItemType Directory -Force $store | Out-Null
$env:NEXO_STATE_FILE = Join-Path $store 'workspace-v1.json'
$env:NEXO_FIXTURES = Join-Path $root 'tests/fixtures/platform_contracts.json'
$env:NEXO_EVIDENCE = Join-Path $root 'evidencia-fase08/windows-instalada.json'
$log = Join-Path $root 'evidencia-fase08/instalacion.log'
$p = Start-Process $installer -ArgumentList '/VERYSILENT','/SUPPRESSMSGBOXES','/NORESTART',"/LOG=$log" -Wait -PassThru
if ($p.ExitCode -notin @(0,3010)) { throw "Falló instalación: $($p.ExitCode)" }
$exe = Join-Path $installDir 'NexoLineal.exe'
if (-not (Test-Path $exe)) { throw 'No se instaló el EXE' }
# Sacar Python, pip, npm y el checkout del entorno del proceso de usuario.
$previousPath=$env:PATH
$env:PATH="$env:SystemRoot\System32;$env:SystemRoot"
Remove-Item Env:PYTHONHOME,Env:PYTHONPATH -ErrorAction SilentlyContinue
function Test-Installed([string[]]$arguments) {
 $process=Start-Process $exe -ArgumentList $arguments -WorkingDirectory $env:TEMP -PassThru
 if (-not $process.WaitForExit(180000)) { Stop-Process -Id $process.Id -Force; throw 'Inicio instalado excedió 180 s' }
 if ($process.ExitCode -ne 0) { Get-Content "$env:NEXO_EVIDENCE.error.log" -ErrorAction SilentlyContinue; throw 'Falló aplicación instalada' }
}
Test-Installed @('--self-test')
$db = Join-Path $store 'workspace-v1.sqlite3'
if (-not (Test-Path $db)) { throw 'No existe la base SQLite' }
$before = (Get-FileHash $db).Hash
$uninstaller=Join-Path $installDir 'unins000.exe'
$p=Start-Process $uninstaller -ArgumentList '/VERYSILENT','/SUPPRESSMSGBOXES','/NORESTART' -Wait -PassThru
if ($p.ExitCode -ne 0 -or (Test-Path $exe)) { throw 'Falló desinstalación' }
if ((Get-FileHash $db).Hash -ne $before) { throw 'La desinstalación alteró el proyecto' }
$p=Start-Process $installer -ArgumentList '/VERYSILENT','/SUPPRESSMSGBOXES','/NORESTART' -Wait -PassThru
if ($p.ExitCode -notin @(0,3010)) { throw 'Falló reinstalación' }
$env:NEXO_EVIDENCE=Join-Path $root 'evidencia-fase08/windows-reinstalada.json'
Test-Installed @('--self-test','--restore-test')
$env:PATH=$previousPath
$reports=@('windows-instalada','windows-reinstalada') | ForEach-Object { Get-Content "evidencia-fase08/$_.json" -Raw | ConvertFrom-Json }
if ($reports.approved -contains $false) { throw 'Autoprueba instalada rechazada' }
@{approved=$true;system=[System.Environment]::OSVersion.VersionString;python_on_path=$false;physical_clean_pc=$false;data_retained=$true;webview_missing_branch_tested=$false;notes='Runner Windows con herramientas instaladas; proceso aislado de Python por PATH. No equivale a un PC físico limpio. WebView2 ya presente.'} | ConvertTo-Json | Set-Content -Encoding utf8 evidencia-fase08/windows-instalacion.json
