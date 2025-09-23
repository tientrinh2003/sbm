#!/usr/bin/env pwsh
# PowerShell script to start mock simulation (cross-platform)

Write-Host "================================================================" -ForegroundColor Cyan
Write-Host "                SMARTBP MOCK SIMULATION SETUP" -ForegroundColor Cyan  
Write-Host "================================================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "This will start mock servers to simulate Raspberry Pi functionality" -ForegroundColor Green
Write-Host "No real hardware required!" -ForegroundColor Green
Write-Host ""
Write-Host "Services that will start:" -ForegroundColor Yellow
Write-Host "1. Mock HTTP Server (Port 8000) - Simulates Pi HTTP API" -ForegroundColor White
Write-Host "2. Mock BLE Bridge - Simulates blood pressure device data" -ForegroundColor White  
Write-Host "3. Next.js Dev Server (Port 3000) - Your web application" -ForegroundColor White
Write-Host ""
Write-Host "================================================================" -ForegroundColor Cyan
Write-Host ""

# Create logs directory if it doesn't exist
if (!(Test-Path "logs")) {
    New-Item -ItemType Directory -Path "logs" | Out-Null
}

# Function to start process in new window
function Start-ServiceInNewWindow {
    param(
        [string]$Title,
        [string]$Command,
        [string]$LogFile
    )
    
    Write-Host "[Starting] $Title..." -ForegroundColor Yellow
    
    if ($IsWindows) {
        Start-Process -FilePath "cmd" -ArgumentList "/k", "$Command > logs\$LogFile 2>&1" -WindowStyle Normal
    } elseif ($IsMacOS) {
        # macOS Terminal
        $script = "cd '$PWD'; $Command > logs/$LogFile 2>&1; read -p 'Press enter to close...'"
        Start-Process -FilePath "osascript" -ArgumentList "-e", "tell app 'Terminal' to do script `"$script`""
    } else {
        # Linux
        $script = "cd '$PWD'; $Command > logs/$LogFile 2>&1; read -p 'Press enter to close...'"
        Start-Process -FilePath "gnome-terminal" -ArgumentList "--", "bash", "-c", $script
    }
    
    Start-Sleep -Seconds 2
}

# Start services
Write-Host "[1/3] Starting Mock HTTP Server..." -ForegroundColor Green
Start-ServiceInNewWindow -Title "Mock Pi Server" -Command "python3 mock_raspberry_pi.py" -LogFile "mock_server.log"

Write-Host "[2/3] Starting Mock BLE Bridge..." -ForegroundColor Green  
Start-ServiceInNewWindow -Title "Mock BLE Bridge" -Command "python3 mock_ble_bridge.py" -LogFile "mock_ble.log"

Write-Host "[3/3] Starting Next.js Development Server..." -ForegroundColor Green
Start-ServiceInNewWindow -Title "Next.js Dev" -Command "pnpm run dev" -LogFile "nextjs.log"

# Wait for services to start
Write-Host "Waiting for services to initialize..." -ForegroundColor Yellow
Start-Sleep -Seconds 5

Write-Host ""
Write-Host "================================================================" -ForegroundColor Green
Write-Host "                     ALL SERVICES STARTED!" -ForegroundColor Green
Write-Host "================================================================" -ForegroundColor Green
Write-Host ""
Write-Host "🌐 Web App:           http://localhost:3000" -ForegroundColor White
Write-Host "🔧 Mock Pi Server:    http://localhost:8000" -ForegroundColor White
Write-Host "📊 Bluetooth Scanner: http://localhost:3000/admin/bluetooth" -ForegroundColor White
Write-Host ""
Write-Host "Use Raspberry Pi IP: localhost:8000 (or 127.0.0.1:8000)" -ForegroundColor Yellow
Write-Host ""
Write-Host "Logs are saved in the 'logs' folder" -ForegroundColor Gray
Write-Host ""
Write-Host "================================================================" -ForegroundColor Green

# Instructions
Write-Host ""
Write-Host "NEXT STEPS:" -ForegroundColor Cyan
Write-Host "1. Open your browser and go to: http://localhost:3000" -ForegroundColor White
Write-Host "2. Navigate to: Admin > Bluetooth Scanner" -ForegroundColor White  
Write-Host "3. Set Raspberry Pi IP to: localhost:8000" -ForegroundColor White
Write-Host "4. Click 'Scan Devices' to see mock devices" -ForegroundColor White
Write-Host "5. Select a blood pressure device from the list" -ForegroundColor White
Write-Host "6. Watch the Mock BLE Bridge window for simulated data" -ForegroundColor White
Write-Host ""
Write-Host "Press Ctrl+C to stop this script (services will continue running)" -ForegroundColor Yellow

# Keep script running
try {
    while ($true) {
        Start-Sleep -Seconds 1
    }
}
catch {
    Write-Host ""
    Write-Host "Script stopped. Services are still running in separate windows." -ForegroundColor Yellow
    Write-Host "Close individual service windows to stop them." -ForegroundColor Yellow
}