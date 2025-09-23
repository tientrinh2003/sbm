@echo off
echo ================================================================
echo                SMARTBP MOCK SIMULATION SETUP
echo ================================================================
echo.
echo This will start mock servers to simulate Raspberry Pi functionality
echo No real hardware required!
echo.
echo Services that will start:
echo 1. Mock HTTP Server (Port 8000) - Simulates Pi HTTP API
echo 2. Mock BLE Bridge - Simulates blood pressure device data
echo 3. Next.js Dev Server (Port 3000) - Your web application
echo.
echo ================================================================
echo.

:: Create logs directory if it doesn't exist
if not exist "logs" mkdir logs

:: Start Mock HTTP Server
echo [1/3] Starting Mock HTTP Server...
start "Mock Pi Server" cmd /k "python mock_raspberry_pi.py > logs\mock_server.log 2>&1 || (echo Error starting mock server & pause)"

:: Wait 2 seconds for server to start
timeout /t 2 /nobreak >nul

:: Start Mock BLE Bridge  
echo [2/3] Starting Mock BLE Bridge...
start "Mock BLE Bridge" cmd /k "python mock_ble_bridge.py > logs\mock_ble.log 2>&1 || (echo Error starting mock BLE bridge & pause)"

:: Wait 2 seconds
timeout /t 2 /nobreak >nul

:: Start Next.js development server
@REM echo [3/3] Starting Next.js Development Server...
@REM start "Next.js Dev" cmd /k "pnpm run dev || (echo Error starting Next.js & pause)"

:: Wait 3 seconds for all services to start
timeout /t 3 /nobreak >nul

echo.
echo ================================================================
echo                     ALL SERVICES STARTED!
echo ================================================================
echo.
echo 🌐 Web App:           http://localhost:3000
echo 🔧 Mock Pi Server:    http://localhost:8000  
echo 📊 Bluetooth Scanner: http://localhost:3000/admin/bluetooth
echo.
echo Use Raspberry Pi IP: localhost:8000 (or 127.0.0.1:8000)
echo.
echo Logs are saved in the 'logs' folder
echo Close this window to stop all services
echo.
echo ================================================================

:: Keep this window open and wait for user to close
echo Press any key to stop all services...
pause >nul

:: Kill all related processes when user closes
taskkill /f /im python.exe >nul 2>&1
taskkill /f /im node.exe >nul 2>&1

echo All services stopped.
pause