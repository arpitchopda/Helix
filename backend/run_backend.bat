@echo off
title Healix Backend API (Port 5000)
color 0A
cd /d "%~dp0"
echo ===================================================
echo   Healix Decentralized Backend API Server
echo   Running at: http://localhost:5000
echo ===================================================
echo.
if exist "venv\Scripts\python.exe" (
    venv\Scripts\python.exe app.py
) else (
    python app.py
)
pause
