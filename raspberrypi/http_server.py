#!/usr/bin/env python3
"""
HTTP Server cho Raspberry Pi để nhận lệnh từ web app
Chạy cùng với ble_bridge.py để quét và kết nối Bluetooth devices
"""

import asyncio
import json
import logging
from datetime import datetime
from http.server import BaseHTTPRequestHandler, HTTPServer
import threading
import time
from urllib.parse import urlparse, parse_qs

# Import các modules cho Bluetooth
from bleak import BleakScanner, BleakError
import queue

# Cấu hình logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

# Global variables để lưu trữ state
current_device_address = None
current_device_name = None
device_queue = queue.Queue()


class BluetoothHandler:
    """Class để xử lý các thao tác Bluetooth"""
    
    @staticmethod
    async def scan_devices(scan_time=10):
        """Quét các thiết bị Bluetooth xung quanh"""
        logger.info(f"Starting Bluetooth scan for {scan_time} seconds...")
        
        try:
            devices = await BleakScanner.discover(timeout=scan_time)
            
            device_list = []
            for device in devices:
                device_info = {
                    "address": device.address,
                    "name": device.name or "Unknown Device",
                    "rssi": device.rssi if hasattr(device, 'rssi') else -100,
                    "connectable": True  # Giả định tất cả đều có thể kết nối
                }
                device_list.append(device_info)
                logger.info(f"Found device: {device_info['name']} ({device_info['address']}) RSSI: {device_info['rssi']}")
            
            logger.info(f"Scan completed. Found {len(device_list)} devices.")
            return device_list
            
        except BleakError as e:
            logger.error(f"Bluetooth scan error: {e}")
            raise
        except Exception as e:
            logger.error(f"Unexpected error during scan: {e}")
            raise


class RequestHandler(BaseHTTPRequestHandler):
    """HTTP Request Handler để xử lý các yêu cầu từ web app"""
    
    def _set_cors_headers(self):
        """Thiết lập CORS headers để cho phép web app truy cập"""
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
            # Trả về trạng thái hiện tại của server
            status = {
                "status": "running",
                "timestamp": datetime.now().isoformat(),
                "current_device": {
                    "address": current_device_address,
                    "name": current_device_name
                }
            }
            self._send_json_response(status)
            
        elif parsed_path.path == '/':
            # Trang chủ đơn giản
            self.send_response(200)
            self.send_header('Content-Type', 'text/html')
            self._set_cors_headers()
            self.end_headers()
            
            html = """
            <!DOCTYPE html>
            <html>
            <head>
                <title>Raspberry Pi Bluetooth Server</title>
            </head>
            <body>
                <h1>🍓 Raspberry Pi Bluetooth Server</h1>
                <p>Server is running on port 8000</p>
                <p>Available endpoints:</p>
                <ul>
                    <li>GET /status - Server status</li>
                    <li>POST /scan-bluetooth - Scan for devices</li>
                    <li>POST /set-device - Set target device</li>
                </ul>
                <p>Current device: <span id="device">None</span></p>
                
                <script>
                    fetch('/status')
                        .then(r => r.json())
                        .then(data => {
                            const device = data.current_device.address || 'None';
                            document.getElementById('device').textContent = device;
                        });
                </script>
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
            
            logger.info(f"POST {parsed_path.path} - Data: {data}")
            
            if parsed_path.path == '/scan-bluetooth':
                self._handle_scan_bluetooth(data)
                
            elif parsed_path.path == '/set-device':
                self._handle_set_device(data)
                
            else:
                self._send_json_response({"error": "Endpoint not found"}, 404)
                
        except Exception as e:
            logger.error(f"Error handling POST request: {e}")
            self._send_json_response({
                "error": "Internal server error",
                "details": str(e)
            }, 500)
    
    def _handle_scan_bluetooth(self, data):
        """Xử lý yêu cầu quét Bluetooth"""
        global device_queue
        
        try:
            scan_time = data.get('scan_time', 10)  # Mặc định quét 10 giây
            
            logger.info(f"Starting Bluetooth scan for {scan_time} seconds...")
            
            # Chạy async scan trong thread riêng
            def run_scan():
                loop = asyncio.new_event_loop()
                asyncio.set_event_loop(loop)
                try:
                    devices = loop.run_until_complete(
                        BluetoothHandler.scan_devices(scan_time)
                    )
                    device_queue.put(("success", devices))
                except Exception as e:
                    device_queue.put(("error", str(e)))
                finally:
                    loop.close()
            
            # Chạy scan trong thread riêng để không block HTTP server
            scan_thread = threading.Thread(target=run_scan)
            scan_thread.start()
            scan_thread.join(timeout=scan_time + 5)  # Timeout thêm 5 giây
            
            # Lấy kết quả từ queue
            try:
                result_type, result_data = device_queue.get_nowait()
                if result_type == "success":
                    self._send_json_response(result_data)
                else:
                    self._send_json_response({
                        "error": "Scan failed",
                        "details": result_data
                    }, 500)
            except queue.Empty:
                self._send_json_response({
                    "error": "Scan timeout",
                    "details": "Bluetooth scan took too long"
                }, 500)
                
        except Exception as e:
            logger.error(f"Scan error: {e}")
            self._send_json_response({
                "error": "Scan failed",
                "details": str(e)
            }, 500)
    
    def _handle_set_device(self, data):
        """Xử lý yêu cầu thiết lập device address"""
        global current_device_address, current_device_name
        
        try:
            device_address = data.get('device_address')
            device_name = data.get('device_name', 'Unknown Device')
            
            if not device_address:
                self._send_json_response({
                    "error": "Missing device_address"
                }, 400)
                return
            
            # Cập nhật device address toàn cục
            current_device_address = device_address
            current_device_name = device_name
            
            # Lưu vào file config để ble_bridge.py có thể đọc
            config = {
                'device_address': device_address,
                'device_name': device_name,
                'updated_at': datetime.now().isoformat()
            }
            
            try:
                with open('device_config.json', 'w') as f:
                    json.dump(config, f, indent=2)
                logger.info(f"💾 Saved device config to file: {device_name} ({device_address})")
            except Exception as e:
                logger.error(f"❌ Failed to save config file: {e}")
            
            logger.info(f"Device set to: {device_name} ({device_address})")
            
            self._send_json_response({
                "success": True,
                "message": f"Device set to {device_address}",
                "device": {
                    "address": device_address,
                    "name": device_name
                },
                "note": "ble_bridge.py will pick up this change automatically"
            })
            
        except Exception as e:
            logger.error(f"Set device error: {e}")
            self._send_json_response({
                "error": "Failed to set device",
                "details": str(e)
            }, 500)
    
    def log_message(self, format, *args):
        """Override để customize log messages"""
        logger.info(f"{self.address_string()} - {format % args}")


def run_server(port=8000):
    """Chạy HTTP server"""
    server_address = ('', port)
    httpd = HTTPServer(server_address, RequestHandler)
    
    logger.info(f"🍓 Raspberry Pi HTTP Server starting on port {port}")
    logger.info(f"Access at: http://localhost:{port}")
    
    try:
        httpd.serve_forever()
    except KeyboardInterrupt:
        logger.info("Server stopped by user")
    finally:
        httpd.server_close()


if __name__ == "__main__":
    # Khởi chạy server
    run_server(8000)