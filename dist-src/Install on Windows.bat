@echo off
setlocal EnableExtensions
title Grid Blocks installer
rem Grid Blocks - installs the After Effects panel (Windows, After Effects 2022 / v22 and newer)
set "SRC=%~dp0GridBlocks"
set "DEST=%APPDATA%\Adobe\CEP\extensions\GridBlocks"
if not exist "%SRC%\CSXS\manifest.xml" (
  echo The GridBlocks folder wasn't found next to this installer.
  echo Right-click the zip, choose "Extract All...", then run the installer from the extracted folder.
  pause
  exit /b 1
)
echo Installing Grid Blocks for After Effects 2022 and newer...
if exist "%DEST%" rmdir /s /q "%DEST%"
robocopy "%SRC%" "%DEST%" /E /NFL /NDL /NJH /NJS /NP >nul
if errorlevel 8 (
  echo Copy failed - is After Effects open? Close it and try again.
  pause
  exit /b 1
)
rem unsigned panels need debug mode on (CEP 9-13 covers After Effects 2019-2026)
for %%v in (9 10 11 12 13) do reg add "HKCU\Software\Adobe\CSXS.%%v" /v PlayerDebugMode /t REG_SZ /d 1 /f >nul
rem brand fonts for this user (no admin needed)
set "FD=%LOCALAPPDATA%\Microsoft\Windows\Fonts"
if not exist "%FD%" mkdir "%FD%"
for %%f in ("%~dp0Fonts\*.otf") do (
  if not exist "%FD%\%%~nxf" copy /y "%%f" "%FD%\" >nul
  reg add "HKCU\Software\Microsoft\Windows NT\CurrentVersion\Fonts" /v "%%~nf (OpenType)" /t REG_SZ /d "%FD%\%%~nxf" /f >nul
)
for %%f in ("%~dp0Fonts\*.ttf") do (
  if not exist "%FD%\%%~nxf" copy /y "%%f" "%FD%\" >nul
  reg add "HKCU\Software\Microsoft\Windows NT\CurrentVersion\Fonts" /v "%%~nf (TrueType)" /t REG_SZ /d "%FD%\%%~nxf" /f >nul
)
rem clear the panel cache so After Effects loads this version
if exist "%TEMP%\cep_cache" rmdir /s /q "%TEMP%\cep_cache"
echo.
echo Installed to: %DEST%
echo Restart After Effects, then open Window ^> Extensions ^> Grid Blocks
pause
