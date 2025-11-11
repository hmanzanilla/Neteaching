@echo off
title Iniciando servidores...
echo =============================
echo Activando Node.js 18 con NVM
echo =============================
nvm use 18

echo =============================
echo Iniciando backend...
echo =============================
start cmd /k "cd /d C:\Users\berna\Downloads\escuela_virtual_2 && node server_1.3.5.js"

timeout /t 2 >nul

echo =============================
echo Iniciando frontend...
echo =============================
start cmd /k "cd /d C:\Users\berna\Downloads\escuela_virtual_2\client && npm start"

exit