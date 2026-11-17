; Instalación por usuario. Los proyectos viven fuera de {app} y nunca se eliminan.
#ifndef AppVersion
#define AppVersion "0.8.0"
#endif
[Setup]
AppId={{68F502D1-EB6B-46A6-955C-CB87241D5918}
AppName=NexoLineal
AppVersion={#AppVersion}
AppPublisher=Rolando Mayorga
AppPublisherURL=https://github.com/Rolando8-03/NexoLineal
DefaultDirName={localappdata}\Programs\NexoLineal
DefaultGroupName=NexoLineal
PrivilegesRequired=lowest
ArchitecturesAllowed=x64compatible
ArchitecturesInstallIn64BitMode=x64compatible
MinVersion=10.0
OutputDir=..\..\..\dist
OutputBaseFilename=NexoLineal-{#AppVersion}-Windows-x64-Setup
SetupIconFile=..\..\..\assets\icono.ico
UninstallDisplayIcon={app}\NexoLineal.exe
Compression=lzma2
SolidCompression=yes
WizardStyle=modern
CloseApplications=yes
AppMutex=NexoLineal
[Languages]
Name: spanish; MessagesFile: compiler:Languages\Spanish.isl
[Tasks]
Name: desktopicon; Description: Crear un acceso directo en el escritorio; GroupDescription: Accesos directos:; Flags: unchecked
[Files]
Source: ..\..\..\dist\NexoLineal.exe; DestDir: {app}; Flags: ignoreversion
Source: ..\..\..\dist\WebView2-Evergreen-x64.exe; Flags: dontcopy
[Icons]
Name: {group}\NexoLineal; Filename: {app}\NexoLineal.exe
Name: {autodesktop}\NexoLineal; Filename: {app}\NexoLineal.exe; Tasks: desktopicon
[Run]
Filename: {app}\NexoLineal.exe; Description: Abrir NexoLineal; Flags: nowait postinstall skipifsilent
[Code]
function InstalledIn(Root: Integer): Boolean;
var Version: String;
begin
 Result := RegQueryStringValue(Root, 'SOFTWARE\Microsoft\EdgeUpdate\Clients\{F3017226-FE2A-4295-8BDF-00C3A9A7E4C5}', 'pv', Version);
 Result := Result and (Version <> '') and (Version <> '0.0.0.0');
end;
function WebViewInstalled(): Boolean;
begin
 Result := InstalledIn(HKLM32) or InstalledIn(HKLM64) or InstalledIn(HKCU32) or InstalledIn(HKCU64);
end;
function PrepareToInstall(var NeedsRestart: Boolean): String;
var ExitCode: Integer;
begin
 Result := '';
 if not WebViewInstalled() then begin
  ExtractTemporaryFile('WebView2-Evergreen-x64.exe');
  if not Exec(ExpandConstant('{tmp}\WebView2-Evergreen-x64.exe'), '/silent /install', '', SW_HIDE, ewWaitUntilTerminated, ExitCode) then begin
   Result := 'No se pudo iniciar la instalación de Microsoft WebView2.'; exit;
  end;
  if ExitCode = 3010 then NeedsRestart := True;
  if not WebViewInstalled() then Result := 'Microsoft WebView2 no se instaló correctamente. Código: ' + IntToStr(ExitCode) + '. Conservá tus datos y volvé a ejecutar el instalador.';
 end;
end;
