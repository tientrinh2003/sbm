#!/usr/bin/env python3
"""
Mock Bluetooth Server - Mô phỏng Raspberry Pi để test không cần hardware thật
Chạy trên máy tính để simulate Bluetooth scanning và device management
"""

import json
import time
import random
from http.server import BaseHTTPRequestHandler, HTTPServer
from datetime import datetime
from urllib.parse import urlparse
import threading

# Mock data cho các thiết bị Bluetooth
MOCK_DEVICES = [
    {
        "address": "00:5F:BF:3A:51:BD",
        "name": "OMRON BP Monitor",
        "rssi": -45,
        "connectable": True
    },
    {
        "address": "AA:BB:CC:DD:EE:FF", 
        "name": "Samsung Galaxy",
        "rssi": -65,
        "connectable": True
    },
    {
        "address": "11:22:33:44:55:66",
        "name": "BP-Doctor Pro",
        "rssi": -38,
        "connectable": True
    },
    {
        "address": "77:88:99:AA:BB:CC",
        "name": "iPhone 15",
        "rssi": -72,
        "connectable": False
    },
    {
        "address": "DD:EE:FF:00:11:22",
        "name": "Withings BPM",
        "rssi": -55,
        "connectable": True
    },
    {
        "address": "33:44:55:66:77:88",
        "name": "Unknown Device",
        "rssi": -80,
        "connectable": True
    }
]

# Global state
current_device = {"address": None, "name": None}
is_scanning = False


class MockBluetoothHandler:
    """Mock class để mô phỏng Bluetooth operations"""
    
    @staticmethod
    def scan_devices(scan_time=10):
        """Mô phỏng quét Bluetooth devices"""
        global is_scanning
        is_scanning = True
        
        print(f"🔍 [MOCK] Starting Bluetooth scan for {scan_time} seconds...")
        
        # Simulate scanning time
        time.sleep(min(scan_time, 3))  # Limit to 3 seconds for demo
        
        # Randomize results để realistic hơn
        devices = []
        for device in MOCK_DEVICES:
            # Random chance device được tìm thấy (90% probability)
            if random.random() > 0.1:
                # Thêm random variation vào RSSI
                rssi_variation = random.randint(-10, 10)
                mock_device = device.copy()
                mock_device["rssi"] = device["rssi"] + rssi_variation
                devices.append(mock_device)
        
        # Sort by signal strength (RSSI)
        devices.sort(key=lambda x: x["rssi"], reverse=True)
        
        print(f"✅ [MOCK] Scan completed. Found {len(devices)} devices:")
        for device in devices:
            print(f"   - {device['name']} ({device['address']}) RSSI: {device['rssi']}")
        
        is_scanning = False
        return devices


class MockRequestHandler(BaseHTTPRequestHandler):
    """HTTP Request Handler cho mock server"""
    
    def _set_cors_headers(self):
        """Thiết lập CORS headers"""
        self.send_header('Access-Control-Allow-Origin', '*')
        self.send_header('Access-Control-Allow-Methods', 'GET, POST, OPTIONS')
        self.send_header('Access-Control-Allow-Headers', 'Content-Type')
    
    def _send_json_response(self, data, status_code=200):
        """Gửi JSON response"""
        self.send_response(status_code)
        self.send_header('Content-Type', 'application/json')
        self._set_cors_headers()
        self.end_headers()
        
        response = json.dumps(data, indent=2)
        self.wfile.write(response.encode('utf-8'))
    
    def do_OPTIONS(self):
        """Xử lý preflight CORS requests"""
        self.send_response(200)
        self._set_cors_headers()
        self.end_headers()
    
    def do_GET(self):
        """Xử lý GET requests"""
        parsed_path = urlparse(self.path)
        
        if parsed_path.path == '/status':
            status = {
                "status": "running",
                "mode": "MOCK_SIMULATION",
                "timestamp": datetime.now().isoformat(),
                "current_device": current_device,
                "is_scanning": is_scanning,
                "mock_info": {
                    "message": "This is a mock server simulating Raspberry Pi",
                    "available_devices": len(MOCK_DEVICES),
                    "note": "No real Bluetooth hardware required"
                }
            }
            self._send_json_response(status)
            
        elif parsed_path.path == '/':
            # Mock server homepage
            self.send_response(200)
            self.send_header('Content-Type', 'text/html')
            self._set_cors_headers()
            self.end_headers()
            
            html = f"""
            <!DOCTYPE html>
            <html>
            <head>
                <title>Mock Raspberry Pi Server</title>
                <style>
                    body {{ font-family: Arial, sans-serif; margin: 40px; }}
                    .status {{ background: #e8f5e8; padding: 20px; border-radius: 8px; }}
                    .device {{ background: #f0f8ff; padding: 10px; margin: 10px 0; border-radius: 4px; }}
                </style>
            </head>
            <body>
                <h1>🔧 Mock Raspberry Pi Bluetooth Server</h1>
                <div class="status">
                    <h2>Server Status</h2>
                    <p><strong>Mode:</strong> SIMULATION (No real hardware required)</p>
                    <p><strong>Port:</strong> 8000</p>
                    <p><strong>Current Device:</strong> {current_device.get('name', 'None')} ({current_device.get('address', 'None')})</p>
                    <p><strong>Scanning:</strong> {'Yes' if is_scanning else 'No'}</p>
                </div>
                
                <h2>Available Mock Devices</h2>
                <div>
                    {''.join([f'<div class="device"><strong>{d["name"]}</strong><br>Address: {d["address"]}<br>RSSI: {d["rssi"]} dBm</div>' for d in MOCK_DEVICES])}
                </div>
                
                <h2>API Endpoints</h2>
                <ul>
                    <li>GET /status - Server status</li>
                    <li>POST /scan-bluetooth - Scan for mock devices</li>
                    <li>POST /set-device - Set target device</li>
                </ul>
                
                <p><em>This mock server simulates a Raspberry Pi for development/testing purposes.</em></p>
            </body>
            </html>
            """
            self.wfile.write(html.encode('utf-8'))
            
        else:
            self._send_json_response({"error": "Endpoint not found"}, 404)
    
    def do_POST(self):
        """Xử lý POST requests"""
        parsed_path = urlparse(self.path)
        
        try:
            # Đọc request body
            content_length = int(self.headers.get('Content-Length', 0))
            body = self.rfile.read(content_length)
            
            if content_length > 0:
                try:
                    data = json.loads(body.decode('utf-8'))
                except json.JSONDecodeError:
                    data = {}
            else:
                data = {}
            
            print(f"📥 [MOCK] POST {parsed_path.path} - Data: {data}")
            
            if parsed_path.path == '/scan-bluetooth':
                self._handle_scan_bluetooth(data)
                
            elif parsed_path.path == '/set-device':
                self._handle_set_device(data)
                
            else:
                self._send_json_response({"error": "Endpoint not found"}, 404)
                
        except Exception as e:
            print(f"❌ [MOCK] Error handling POST request: {e}")
            self._send_json_response({
                "error": "Internal server error",
                "details": str(e)
            }, 500)
    
    def _handle_scan_bluetooth(self, data):
        """Xử lý mock Bluetooth scan"""
        try:
            scan_time = data.get('scan_time', 10)
            
            print(f"🔍 [MOCK] Scanning for {scan_time} seconds...")
            
            # Simulate scan trong thread riêng
            def run_mock_scan():
                devices = MockBluetoothHandler.scan_devices(scan_time)
                return devices
            
            devices = run_mock_scan()
            
            self._send_json_response(devices)
            print(f"✅ [MOCK] Returned {len(devices)} devices to client")
            
        except Exception as e:
            print(f"❌ [MOCK] Scan error: {e}")
            self._send_json_response({
                "error": "Mock scan failed",
                "details": str(e)
            }, 500)
    
    def _handle_set_device(self, data):
        """Xử lý mock set device"""
        global current_device
        
        try:
            device_address = data.get('device_address')
            device_name = data.get('device_name', 'Unknown Device')
            
            if not device_address:
                self._send_json_response({
                    "error": "Missing device_address"
                }, 400)
                return
            
            # Update mock current device
            current_device = {
                "address": device_address,
                "name": device_name
            }
            
            # Simulate saving to config file
            mock_config = {
                'device_address': device_address,
                'device_name': device_name,
                'updated_at': datetime.now().isoformat(),
                'mode': 'MOCK_SIMULATION'
            }
            
            try:
                with open('mock_device_config.json', 'w') as f:
                    json.dump(mock_config, f, indent=2)
                print(f"💾 [MOCK] Saved mock config: {device_name} ({device_address})")
            except Exception as e:
                print(f"⚠️ [MOCK] Could not save config file: {e}")
            
            print(f"✅ [MOCK] Device set to: {device_name} ({device_address})")
            
            self._send_json_response({
                "success": True,
                "message": f"Mock device set to {device_address}",
                "device": {
                    "address": device_address,
                    "name": device_name
                },
                "mock_info": {
                    "message": "This is a simulation - no real Bluetooth connection",
                    "config_saved": True,
                    "note": "In real setup, ble_bridge.py would connect to this device"
                }
            })
            
        except Exception as e:
            print(f"❌ [MOCK] Set device error: {e}")
            self._send_json_response({
                "error": "Failed to set mock device",
                "details": str(e)
            }, 500)
    
    def log_message(self, format, *args):
        """Custom log messages"""
        print(f"🌐 [MOCK SERVER] {self.address_string()} - {format % args}")


def run_mock_server(port=8000):
    """Chạy mock server"""
    server_address = ('', port)
    httpd = HTTPServer(server_address, MockRequestHandler)
    
    print("🔧" + "=" * 60)
    print("🔧 MOCK RASPBERRY PI BLUETOOTH SERVER")
    print("🔧" + "=" * 60)
    print(f"🔧 Server running on: http://localhost:{port}")
    print(f"🔧 Mode: SIMULATION (No hardware required)")
    print(f"🔧 Mock devices available: {len(MOCK_DEVICES)}")
    print("🔧" + "=" * 60)
    print("🔧 This server simulates a Raspberry Pi for testing.")
    print("🔧 Your web app will work exactly the same as with real Pi!")
    print("🔧" + "=" * 60)
    print()
    
    try:
        httpd.serve_forever()
    except KeyboardInterrupt:
        print("\n🔧 [MOCK] Server stopped by user")
    finally:
        httpd.server_close()
        print("🔧 [MOCK] Server closed")


if __name__ == "__main__":
    run_mock_server(8000)