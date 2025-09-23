#!/usr/bin/env python3
"""
Mock BLE Bridge - Mô phỏng kết nối và nhận dữ liệu từ thiết bị Blood Pressure
Tạo dữ liệu giả để test hệ thống mà không cần thiết bị thật
"""

import asyncio
import json
import os
import random
import time
from datetime import datetime
import threading

# Mock configuration
MOCK_CONFIG_FILE = "mock_device_config.json"
DEFAULT_DEVICE_ADDRESS = "00:5F:BF:3A:51:BD"
DEFAULT_DEVICE_NAME = "Mock OMRON Device"
MEASUREMENT_INTERVAL = 10  # Giây giữa các lần đo

# Global state
current_device = {"address": DEFAULT_DEVICE_ADDRESS, "name": DEFAULT_DEVICE_NAME}
is_connected = False
measurement_count = 0


def load_mock_device_config():
    """Đọc cấu hình device từ mock config file"""
    global current_device
    
    try:
        if os.path.exists(MOCK_CONFIG_FILE):
            with open(MOCK_CONFIG_FILE, 'r') as f:
                config = json.load(f)
                device_address = config.get('device_address', DEFAULT_DEVICE_ADDRESS)
                device_name = config.get('device_name', DEFAULT_DEVICE_NAME)
                
                # Update current device if changed
                if (device_address != current_device["address"] or 
                    device_name != current_device["name"]):
                    print(f"🔄 [MOCK] Device config changed:")
                    print(f"    Old: {current_device['name']} ({current_device['address']})")
                    print(f"    New: {device_name} ({device_address})")
                    
                    current_device = {"address": device_address, "name": device_name}
                    return True  # Config changed
                
                return False  # No change
    except Exception as e:
        print(f"❌ [MOCK] Error loading config: {e}")
    
    return False


def generate_realistic_bp_data():
    """Tạo dữ liệu huyết áp realistic"""
    global measurement_count
    measurement_count += 1
    
    # Simulate different BP patterns
    patterns = [
        {"sys_base": 120, "dia_base": 80, "pulse_base": 72, "label": "Normal"},
        {"sys_base": 140, "dia_base": 90, "pulse_base": 78, "label": "High"},
        {"sys_base": 110, "dia_base": 70, "pulse_base": 68, "label": "Low Normal"},
        {"sys_base": 160, "dia_base": 100, "pulse_base": 85, "label": "Hypertension"},
    ]
    
    # Choose pattern based on measurement count for variety
    pattern = patterns[measurement_count % len(patterns)]
    
    # Add realistic variations
    sys_variation = random.randint(-10, 15)
    dia_variation = random.randint(-5, 10)
    pulse_variation = random.randint(-8, 12)
    
    sys_val = max(90, min(200, pattern["sys_base"] + sys_variation))
    dia_val = max(60, min(120, pattern["dia_base"] + dia_variation))
    pulse_val = max(50, min(120, pattern["pulse_base"] + pulse_variation))
    
    # Generate mock raw data (hex simulation)
    mock_hex_data = f"0x{random.randint(100000, 999999):06x}"
    
    timestamp = datetime.now()
    
    return {
        "sys": sys_val,
        "dia": dia_val, 
        "pulse": pulse_val,
        "timestamp": timestamp.isoformat(),
        "method": "BLUETOOTH",
        "device_address": current_device["address"],
        "device_name": current_device["name"],
        "pattern": pattern["label"],
        "measurement_id": measurement_count,
        "mock_hex_data": mock_hex_data
    }


def simulate_ble_notification(measurement_data):
    """Mô phỏng BLE notification callback"""
    print("\n" + "🔵" * 20)
    print(f"📊 [MOCK BLE] NEW MEASUREMENT RECEIVED")
    print(f"    Timestamp: {datetime.now().strftime('%H:%M:%S')}")
    print(f"    Device: {current_device['name']}")
    print(f"    Address: {current_device['address']}")
    print(f"    Mock Data: {measurement_data['mock_hex_data']}")
    print("🔵" * 20)
    
    print(f"📈 PARSED VALUES:")
    print(f"    • Systolic (SYS): {measurement_data['sys']} mmHg")
    print(f"    • Diastolic (DIA): {measurement_data['dia']} mmHg") 
    print(f"    • Pulse Rate: {measurement_data['pulse']} bpm")
    print(f"    • Pattern: {measurement_data['pattern']}")
    print(f"    • Measurement #: {measurement_data['measurement_id']}")
    
    # Determine BP category
    sys_val = measurement_data['sys']
    dia_val = measurement_data['dia']
    
    if sys_val < 120 and dia_val < 80:
        category = "NORMAL 🟢"
    elif sys_val < 130 and dia_val < 80:
        category = "ELEVATED 🟡"
    elif sys_val < 140 or dia_val < 90:
        category = "HIGH STAGE 1 🟠"
    else:
        category = "HIGH STAGE 2 🔴"
    
    print(f"    • Category: {category}")
    
    # TODO: Here you would send to your web API
    print(f"📤 [TODO] Send to API: POST /api/measurements/create")
    print(f"    Data: {json.dumps(measurement_data, indent=2)}")
    
    print("🔵" * 20 + "\n")


async def mock_connection_loop():
    """Mô phỏng vòng lặp kết nối BLE"""
    global is_connected
    
    print("🔵 [MOCK BLE] Starting connection simulation...")
    
    while True:
        try:
            # Check for config changes
            config_changed = load_mock_device_config()
            if config_changed:
                if is_connected:
                    print("🔄 [MOCK BLE] Disconnecting from old device...")
                    is_connected = False
                    await asyncio.sleep(2)
            
            # Simulate connection attempt
            if not is_connected:
                print(f"🔍 [MOCK BLE] Attempting to connect to: {current_device['name']}")
                print(f"    Address: {current_device['address']}")
                
                # Simulate connection delay
                await asyncio.sleep(3)
                
                # Simulate successful connection (95% success rate)
                if random.random() > 0.05:
                    is_connected = True
                    print(f"✅ [MOCK BLE] Successfully connected!")
                    print(f"    Listening for blood pressure measurements...")
                    print(f"    Next measurement in {MEASUREMENT_INTERVAL} seconds")
                else:
                    print(f"❌ [MOCK BLE] Connection failed, retrying in 5 seconds...")
                    await asyncio.sleep(5)
                    continue
            
            # Simulate receiving measurements while connected
            if is_connected:
                # Wait for measurement interval
                await asyncio.sleep(MEASUREMENT_INTERVAL)
                
                # Generate and process mock measurement
                measurement_data = generate_realistic_bp_data()
                simulate_ble_notification(measurement_data)
                
                # Small chance of disconnection to simulate real conditions
                if random.random() < 0.05:  # 5% chance
                    print("📡 [MOCK BLE] Connection lost, will reconnect...")
                    is_connected = False
                    await asyncio.sleep(2)
            
        except KeyboardInterrupt:
            print("\n🔵 [MOCK BLE] Stopping simulation...")
            break
        except Exception as e:
            print(f"❌ [MOCK BLE] Unexpected error: {e}")
            is_connected = False
            await asyncio.sleep(5)


def run_mock_ble_bridge():
    """Chạy mock BLE bridge"""
    print("🔵" + "=" * 60)
    print("🔵 MOCK BLE BRIDGE - BLOOD PRESSURE SIMULATOR")
    print("🔵" + "=" * 60)
    print(f"🔵 Device: {current_device['name']}")
    print(f"🔵 Address: {current_device['address']}")
    print(f"🔵 Measurement Interval: {MEASUREMENT_INTERVAL} seconds")
    print(f"🔵 Config File: {MOCK_CONFIG_FILE}")
    print("🔵" + "=" * 60)
    print("🔵 This simulates BLE connection to blood pressure device.")
    print("🔵 Will generate realistic measurement data automatically.")
    print("🔵 Press Ctrl+C to stop.")
    print("🔵" + "=" * 60)
    print()
    
    try:
        # Start the async connection loop
        asyncio.run(mock_connection_loop())
    except KeyboardInterrupt:
        print("\n🔵 [MOCK BLE] Simulation stopped by user")
    except Exception as e:
        print(f"❌ [MOCK BLE] Error: {e}")


if __name__ == "__main__":
    run_mock_ble_bridge()