# Raspberry Pi Setup Instructions

## 1. Install Python Dependencies

```bash
# Update system
sudo apt update && sudo apt upgrade -y

# Install Python pip if not available
sudo apt install python3-pip -y

# Install required Python packages
pip3 install bleak asyncio

# Optional: Install in virtual environment (recommended)
python3 -m venv venv
source venv/bin/activate
pip install bleak asyncio
```

## 2. Enable Bluetooth

```bash
# Enable Bluetooth service
sudo systemctl enable bluetooth
sudo systemctl start bluetooth

# Check Bluetooth status
sudo systemctl status bluetooth

# Make sure Bluetooth is enabled
sudo bluetoothctl
# In bluetoothctl prompt:
# power on
# agent on
# exit
```

## 3. Run the Scripts

### Terminal 1: Start HTTP Server
```bash
cd /path/to/your/project/raspberrypi
python3 http_server.py
```

### Terminal 2: Start BLE Bridge
```bash
cd /path/to/your/project/raspberrypi
python3 ble_bridge.py
```

## 4. Test the Setup

1. Open web browser and go to: `http://YOUR_PI_IP:8000`
2. You should see a simple status page
3. Test endpoints:
   - GET `/status` - Server status
   - POST `/scan-bluetooth` - Scan for devices
   - POST `/set-device` - Set target device

## 5. Web App Configuration

In your web app, set the Raspberry Pi IP address to your Pi's local IP:

```javascript
// Example IP addresses
const raspberryPiIP = '192.168.1.100';  // Replace with your Pi's IP
const raspberryPiIP = '192.168.22.3';   // Your current network IP
```

## 6. Troubleshooting

### Bluetooth Issues
```bash
# Restart Bluetooth service
sudo systemctl restart bluetooth

# Check Bluetooth devices
sudo hcitool lescan

# Check Bluetooth adapter
sudo bluetoothctl show
```

### Permission Issues
```bash
# Add user to bluetooth group
sudo usermod -a -G bluetooth $USER

# Restart session or reboot
sudo reboot
```

### Python Import Errors
```bash
# If bleak import fails, install with sudo
sudo pip3 install bleak

# Or use virtual environment
python3 -m venv venv
source venv/bin/activate
pip install bleak asyncio
```

## 7. Auto-start Services (Optional)

Create systemd services to auto-start the scripts:

### HTTP Server Service
```bash
sudo nano /etc/systemd/system/smartbp-http.service
```

```ini
[Unit]
Description=SmartBP HTTP Server
After=network.target

[Service]
Type=simple
User=pi
WorkingDirectory=/home/pi/smartbp/raspberrypi
ExecStart=/usr/bin/python3 /home/pi/smartbp/raspberrypi/http_server.py
Restart=always

[Install]
WantedBy=multi-user.target
```

### BLE Bridge Service
```bash
sudo nano /etc/systemd/system/smartbp-ble.service
```

```ini
[Unit]
Description=SmartBP BLE Bridge
After=network.target bluetooth.target

[Service]
Type=simple
User=pi
WorkingDirectory=/home/pi/smartbp/raspberrypi
ExecStart=/usr/bin/python3 /home/pi/smartbp/raspberrypi/ble_bridge.py
Restart=always

[Install]
WantedBy=multi-user.target
```

### Enable Services
```bash
sudo systemctl enable smartbp-http.service
sudo systemctl enable smartbp-ble.service
sudo systemctl start smartbp-http.service
sudo systemctl start smartbp-ble.service

# Check status
sudo systemctl status smartbp-http.service
sudo systemctl status smartbp-ble.service
```

## 8. File Structure

Your Raspberry Pi directory should look like:

```
raspberrypi/
├── ble_bridge.py          # Main BLE connection script
├── http_server.py         # HTTP server for web communication
├── device_config.json     # Auto-generated device config
├── requirements.txt       # Python dependencies
└── README.md             # This file
```

## 9. Network Requirements

- Raspberry Pi and your computer must be on the same network
- Pi should have a static IP or you need to update the IP in web app
- Port 8000 should be open (default for HTTP server)
- Bluetooth device should be in pairing/discoverable mode