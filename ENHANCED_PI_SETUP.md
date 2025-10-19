# Enhanced Pi5 Installation and Deployment Guide

## 🚀 **STEP 1: Deploy Enhanced Pi Application**

### Replace Basic Application with Enhanced Version
```bash
# Navigate to Pi directory
cd ~/smartbp/raspberrypi

# Backup existing basic version
mv smartbp_pi5_main.py smartbp_pi5_main_backup.py

# Transfer enhanced version (use your preferred method)
# Method 1: From SBM project
cp /path/to/sbm/raspberrypi/smartbp_pi5_enhanced.py ~/smartbp/raspberrypi/

# Method 2: Create new file and copy content
nano smartbp_pi5_enhanced.py
# Paste the enhanced code content

# Set as main application
ln -sf smartbp_pi5_enhanced.py smartbp_pi5_main.py
```

### Update Dependencies
```bash
# Install additional dependencies for enhanced features
pip install asyncio websockets bleak

# Verify all dependencies are available
python3 -c "
import fastapi, uvicorn, cv2, numpy, requests, json
import tensorflow as tf, asyncio, websockets, bleak
print('✅ All enhanced dependencies available')
"
```

## 🌐 **STEP 2: Update Web Components**

### Enhanced Components Created:
- `EnhancedBluetoothManager.tsx` - New advanced Bluetooth manager with device discovery
- Updated `app/patient/monitoring/page.tsx` - Enhanced with new workflow

### Key Features:
1. **Device Discovery**: Automatic Bluetooth device scanning and selection
2. **Live Camera Stream**: Real-time video feed during measurement
3. **WebSocket Integration**: Real-time communication between Pi and web
4. **Measurement Confirmation**: Review and edit results before saving
5. **Session Tracking**: Complete measurement session management

## 🔧 **STEP 3: Pi Configuration**

### 1. Start Enhanced Pi Application
```bash
# Stop existing service if running
sudo systemctl stop smartbp

# Start enhanced application
cd ~/smartbp/raspberrypi
python3 smartbp_pi5_enhanced.py
```

### 2. Verify Enhanced API Endpoints
```bash
# Test enhanced endpoints
curl http://192.168.22.70:8000/api/status
curl -X POST http://192.168.22.70:8000/api/bluetooth/discover
curl http://192.168.22.70:8000/api/camera/stream
```

### 3. WebSocket Connection Test
```bash
# Test WebSocket connection
python3 -c "
import asyncio
import websockets

async def test_ws():
    try:
        uri = 'ws://192.168.22.70:8000/api/ws'
        async with websockets.connect(uri) as websocket:
            print('✅ WebSocket connection successful')
    except Exception as e:
        print(f'❌ WebSocket error: {e}')

asyncio.run(test_ws())
"
```

## 🩺 **STEP 4: Enhanced Workflow Testing**

### New User Experience:
1. **Select PI_AUTOMATED Mode**: Choose "🤖 AI Enhanced (Recommended)"
2. **Device Discovery**: Click "🔍 Quét thiết bị" to scan for Bluetooth devices
3. **Device Selection**: Choose OMRON device from discovered list
4. **Start Measurement**: Click "🩺 Bắt đầu đo huyết áp"
5. **Live Monitoring**: Watch live camera stream during measurement
6. **Confirmation**: Review and edit results in popup dialog
7. **Save**: Confirm to save to database

### Test Each Step:
```bash
# 1. Test device discovery
curl -X POST http://192.168.22.70:8000/api/bluetooth/discover

# 2. Test device connection (replace with actual device address)
curl -X POST http://192.168.22.70:8000/api/bluetooth/connect \
  -H "Content-Type: application/json" \
  -d '{"device_address":"XX:XX:XX:XX:XX:XX","device_name":"OMRON Device"}'

# 3. Test measurement start
curl -X POST http://192.168.22.70:8000/api/measurement/start \
  -H "Content-Type: application/json" \
  -d '{"device_address":"XX:XX:XX:XX:XX:XX","device_name":"OMRON Device","user_id":"test","ai_enabled":true}'
```

## 🔄 **STEP 5: Service Configuration**

### Update systemd service for enhanced application:
```bash
sudo nano /etc/systemd/system/smartbp.service
```

Update the service file:
```ini
[Unit]
Description=SmartBP Enhanced Pi5 Service
After=network.target

[Service]
Type=simple
User=tien
WorkingDirectory=/home/tien/smartbp/raspberrypi
ExecStart=/usr/bin/python3 smartbp_pi5_enhanced.py
Restart=always
RestartSec=10
Environment=PYTHONPATH=/home/tien/smartbp/raspberrypi

[Install]
WantedBy=multi-user.target
```

```bash
# Reload and restart service
sudo systemctl daemon-reload
sudo systemctl enable smartbp
sudo systemctl start smartbp
sudo systemctl status smartbp
```

## 📊 **STEP 6: Monitoring and Logs**

### Check Enhanced Application Logs:
```bash
# Service logs
sudo journalctl -u smartbp -f

# Application logs
tail -f ~/smartbp/raspberrypi/smartbp.log

# Real-time monitoring
watch -n 1 "curl -s http://192.168.22.70:8000/api/status | jq"
```

## 🔧 **STEP 7: Troubleshooting Enhanced Features**

### Common Issues:

#### 1. WebSocket Connection Failed
```bash
# Check if WebSocket is running
netstat -tlnp | grep 8000
# Restart application
sudo systemctl restart smartbp
```

#### 2. Bluetooth Discovery Not Working
```bash
# Check Bluetooth permissions
sudo usermod -a -G bluetooth tien
sudo systemctl restart bluetooth

# Test Bluetooth manually
bluetoothctl
scan on
devices
```

#### 3. Camera Stream Not Loading
```bash
# Check camera access
ls -l /dev/video*
# Test camera manually
python3 -c "import cv2; cap = cv2.VideoCapture(0); print('Camera OK' if cap.isOpened() else 'Camera Error')"
```

#### 4. Device Discovery Empty
```bash
# Enable Bluetooth and make devices discoverable
sudo hciconfig hci0 up
sudo hciconfig hci0 piscan

# Check for nearby devices
sudo hcitool scan
```

## ✅ **STEP 8: Verification Checklist**

- [ ] Enhanced Pi application running on port 8000
- [ ] WebSocket connection working
- [ ] Bluetooth device discovery functional
- [ ] Camera streaming working
- [ ] Web interface updated with EnhancedBluetoothManager
- [ ] Measurement confirmation dialog working
- [ ] Database saving with AI data
- [ ] Service configured for auto-start

## 🎯 **Expected Enhanced Workflow**

1. **User opens monitoring page** → Select "AI Enhanced" mode
2. **Click scan devices** → Pi scans for Bluetooth devices → Shows list on web
3. **Select OMRON device** → Pi connects to device → Shows connection status
4. **Click start measurement** → Camera starts streaming live → Measurement begins
5. **During measurement** → Real-time video feedback → Audio/visual analysis
6. **Measurement complete** → Camera stops → Confirmation popup with editable values
7. **User confirms/edits** → Data saved to database with AI analysis → Session complete

This enhanced workflow provides a much better user experience with visual feedback, device selection, and confirmation steps!