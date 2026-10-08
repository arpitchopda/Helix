@echo off
title Healix Frontend UI (Port 5173)
color 0B
cd /d "%~dp0"
echo ===================================================
echo   Healix Healthcare Web Application
echo   Running at: http://localhost:5173
echo ===================================================
echo.
npm run dev
pause
