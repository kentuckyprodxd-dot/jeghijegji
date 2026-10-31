@echo off
chcp 65001 >nul
title Quiz live TikTok
cd /d "%~dp0"
where node >nul 2>nul
if errorlevel 1 (
  echo.
  echo  Lipseste Node.js. Instaleaza-l de pe https://nodejs.org ^(butonul LTS^), apoi porneste din nou fisierul asta.
  echo.
  start https://nodejs.org
  pause
  exit /b
)
if not exist node_modules (
  echo Instalez ce trebuie ^(doar prima data, dureaza un minut^)...
  call npm install --no-fund --no-audit
)
node server.mjs %*
pause
