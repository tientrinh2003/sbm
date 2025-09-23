# 🔧 Mock Simulation Guide - Test SmartBP Without Hardware

## 📋 Overview

This mock simulation allows you to test the complete SmartBP system **without needing a Raspberry Pi or blood pressure device**. Perfect for development, testing, and demonstration purposes!

## 🚀 Quick Start

### Option 1: Windows (Batch Script)
```bash
# Double-click or run in Command Prompt
start_mock_simulation.bat
```

### Option 2: PowerShell (Cross-platform)
```powershell
# Run in PowerShell (Windows/Mac/Linux)
.\start_mock_simulation.ps1
```

### Option 3: Manual Start
```bash
# Terminal 1: Mock HTTP Server
python mock_raspberry_pi.py

# Terminal 2: Mock BLE Bridge  
python mock_ble_bridge.py

# Terminal 3: Next.js Dev Server
pnpm run dev
```

## 🎯 What You Get

### 1. **Mock HTTP Server** (Port 8000)
- Simulates Raspberry Pi HTTP API
- Handles Bluetooth scanning requests
- Manages device selection
- Returns realistic mock devices

### 2. **Mock BLE Bridge** 
- Simulates blood pressure device connection
- Generates realistic measurement data
- Responds to device configuration changes
- Shows connection status and data flow

### 3. **Your Web Application** (Port 3000)
- Full Next.js development server
- All features work exactly as with real hardware
- Test authentication, dashboards, data visualization

## 📊 Mock Devices Available

The simulation includes these realistic Bluetooth devices:

| Device Name | MAC Address | Type | Signal |
|-------------|-------------|------|--------|
| OMRON BP Monitor | 00:5F:BF:3A:51:BD | Blood Pressure | Strong |
| BP-Doctor Pro | 11:22:33:44:55:66 | Blood Pressure | Excellent |
| Withings BPM | DD:EE:FF:00:11:22 | Blood Pressure | Good |
| Samsung Galaxy | AA:BB:CC:DD:EE:FF | Phone | Fair |
| iPhone 15 | 77:88:99:AA:BB:CC | Phone | Weak |
| Unknown Device | 33:44:55:66:77:88 | Generic | Poor |

## 🧪 Testing Workflow

### Step 1: Start Services
```bash
# All services will start automatically
start_mock_simulation.bat
```

### Step 2: Access Web App
- Open: `http://localhost:3000`
- Login with your credentials
- Navigate to: **Admin > Bluetooth**

### Step 3: Configure Mock Pi
- Set Raspberry Pi IP to: `localhost:8000`
- Click "Scan Devices"
- You'll see the mock devices listed

### Step 4: Select Device
- Choose any blood pressure device (OMRON, BP-Doctor, etc.)
- Click "Select Device"
- Device will be configured on mock Pi

### Step 5: Watch Data Flow
- Check the Mock BLE Bridge terminal window
- You'll see simulated measurement data every 10 seconds
- Data includes realistic BP values, patterns, and variations

## 📈 Mock Data Patterns

The simulation generates realistic data with these patterns:

### Normal Pattern
- Systolic: 110-130 mmHg
- Diastolic: 70-85 mmHg  
- Pulse: 65-75 bpm

### High Pattern
- Systolic: 135-155 mmHg
- Diastolic: 85-105 mmHg
- Pulse: 75-85 bpm

### Hypertension Pattern
- Systolic: 155-175 mmHg
- Diastolic: 95-115 mmHg
- Pulse: 80-90 bpm

### Low Normal Pattern
- Systolic: 100-120 mmHg
- Diastolic: 60-75 mmHg
- Pulse: 60-70 bpm

## 🔍 Debug and Monitor

### Server Status
- Mock Pi Server: `http://localhost:8000`
- Check API endpoints and current device
- View available mock devices

### Logs
All logs are saved in the `logs/` folder:
- `mock_server.log` - HTTP server logs
- `mock_ble.log` - BLE bridge simulation logs  
- `nextjs.log` - Next.js development logs

### Real-time Monitoring
Watch the terminal windows to see:
- HTTP requests from web app
- Bluetooth scan results
- Device selection events
- Simulated measurement data
- Connection status changes

## 🎮 Interactive Features

### Device Switching
- Select different devices in the web app
- Mock BLE bridge automatically "connects" to new device
- Simulates real device switching behavior

### Connection Simulation
- Random connection failures (5% chance)
- Automatic reconnection attempts
- Realistic connection timing

### Data Variation
- Random measurement variations
- Different BP patterns cycle automatically
- Realistic signal strength changes

## 🚀 Advantages of Mock Simulation

### ✅ **No Hardware Required**
- Test full system without Pi or BP device
- Perfect for development and demos
- Works on any computer

### ✅ **Predictable Data**
- Consistent testing environment
- Known data patterns for validation
- Controllable edge cases

### ✅ **Fast Development**
- No waiting for hardware setup
- Instant feedback on changes
- Easy debugging and testing

### ✅ **Complete Feature Testing**
- All web app features work
- Authentication flows
- Data visualization
- Real-time updates
- Error handling

## 🔧 Customization

### Modify Mock Devices
Edit `mock_raspberry_pi.py`:
```python
MOCK_DEVICES = [
    {
        "address": "YOUR:MAC:ADDRESS",
        "name": "Your Device Name", 
        "rssi": -45,
        "connectable": True
    }
    # Add more devices...
]
```

### Change Data Patterns
Edit `mock_ble_bridge.py`:
```python
patterns = [
    {"sys_base": 120, "dia_base": 80, "pulse_base": 72, "label": "Custom"},
    # Add your patterns...
]
```

### Adjust Timing
```python
MEASUREMENT_INTERVAL = 5  # Seconds between measurements
```

## 🎯 When to Use Real Hardware

The mock simulation is perfect for:
- ✅ Development and testing
- ✅ Feature validation  
- ✅ UI/UX testing
- ✅ Demonstrations
- ✅ Learning the system

Use real hardware when you need:
- 🔬 Actual medical device integration
- 📡 Real Bluetooth protocol testing
- 🏥 Clinical validation
- 📊 Real patient data collection

## 🎉 Success Indicators

You'll know the simulation is working when:

1. **Web App**: Bluetooth scanner shows mock devices
2. **Mock Server**: HTTP requests logged in terminal
3. **Mock BLE**: Measurement data generated every 10 seconds  
4. **Config Files**: `mock_device_config.json` updates when you select devices
5. **Real-time**: Changes in web app immediately reflected in mock services

## 🎯 Next Steps

After testing with the mock simulation:
1. **Deploy to Real Pi**: Use the same code on actual Raspberry Pi
2. **Connect Real Device**: Replace mock BLE with actual blood pressure monitor
3. **Production Setup**: Configure with real database and authentication
4. **Scale Up**: Add multiple Pi devices and users

The mock simulation gives you confidence that your system works before investing in hardware! 🚀