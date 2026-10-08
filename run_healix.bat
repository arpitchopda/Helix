@echo off
setlocal
title Healix Federated Healthcare Platform Launcher
color 0B

echo ===============================================================================
echo                HEALIX FEDERATED HEALTHCARE AI PLATFORM
echo         Decentralized Multi-Hospital Machine Learning with FedAvg and SHAP
echo ===============================================================================
echo.

set "ROOT_DIR=%~dp0"
cd /d "%ROOT_DIR%"

echo [*] Checking prerequisites...

:: 1. Check Python
where python >nul 2>nul
if %errorlevel% neq 0 (
    color 0C
    echo [ERROR] Python not found in system PATH.
    echo Please install Python from https://www.python.org/
    echo.
    pause
    exit /b 1
)
echo [OK] Python is installed.

:: 2. Check Node.js and npm
where npm >nul 2>nul
if %errorlevel% neq 0 (
    color 0C
    echo [ERROR] Node.js or npm not found in system PATH.
    echo Please install Node.js from https://nodejs.org/
    echo.
    pause
    exit /b 1
)
echo [OK] Node.js and npm are installed.

:: 3. Launch Backend API in dedicated window
echo.
echo [*] Starting Backend Server (Flask on Port 5000)...
start "Healix Backend" "%ROOT_DIR%backend\run_backend.bat"

:: Small wait for backend initialization
ping 127.0.0.1 -n 3 >nul

:: 4. Launch Frontend UI in dedicated window
echo [*] Starting Frontend Server (Vite on Port 5173)...
start "Healix Frontend" "%ROOT_DIR%frontend\run_frontend.bat"

:: Small wait for Vite
ping 127.0.0.1 -n 3 >nul

:: 5. Open browser
echo [*] Opening Healix in your web browser...
start http://localhost:5173

echo.
echo ===============================================================================
echo                   HEALIX PLATFORM IS NOW ONLINE!
echo ===============================================================================
echo.
echo   - Web Interface URL:    http://localhost:5173
echo   - Backend API URL:      http://localhost:5000
echo   - API Health Check:     http://localhost:5000/health
echo.
echo  -----------------------------------------------------------------------------
echo   SAMPLE LOGIN CREDENTIALS:
echo   - Hospital Node A:      hospital_a  /  hospital123
echo   - Hospital Node B:      hospital_b  /  hospital123
echo   - Hospital Node C:      hospital_c  /  hospital123
echo   - Central Coordinator:  admin       /  admin123
echo  -----------------------------------------------------------------------------
echo.
echo  [NOTE] Keep the two background terminal windows open while using the app.
echo.
echo Press any key to close this launcher window...
pause >nul
