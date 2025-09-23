import asyncio
import json
import os
from bleak import BleakClient, BleakError
from datetime import datetime
import logging

# --- CẤU HÌNH ---
CONFIG_FILE = "device_config.json"
DEFAULT_DEVICE_ADDRESS = "00:5F:BF:3A:51:BD"
RECONNECT_DELAY_SECONDS = 5
BLOOD_PRESSURE_MEASUREMENT_UUID = "00002a35-0000-1000-8000-00805f9b34fb"


def load_device_config():
    """Đọc cấu hình device từ file JSON"""
    try:
        if os.path.exists(CONFIG_FILE):
            with open(CONFIG_FILE, 'r') as f:
                config = json.load(f)
                device_address = config.get('device_address', DEFAULT_DEVICE_ADDRESS)
                device_name = config.get('device_name', 'Unknown Device')
                print(f"✅ Loaded device from config: {device_name} ({device_address})")
                return device_address, device_name
    except Exception as e:
        print(f"❌ Error loading config: {e}")
    
    print(f"🔧 Using default device address: {DEFAULT_DEVICE_ADDRESS}")
    return DEFAULT_DEVICE_ADDRESS, "Default Device"


def save_device_config(device_address, device_name):
    """Lưu cấu hình device vào file JSON"""
    try:
        config = {
            'device_address': device_address,
            'device_name': device_name,
            'updated_at': datetime.now().isoformat()
        }
        with open(CONFIG_FILE, 'w') as f:
            json.dump(config, f, indent=2)
        print(f"💾 Saved device config: {device_name} ({device_address})")
        return True
    except Exception as e:
        print(f"❌ Error saving config: {e}")
        return False


# Đọc device address từ config
DEVICE_ADDRESS, DEVICE_NAME = load_device_config()


def parse_blood_pressure_data(sender: int, data: bytearray):
    """
    Phân tích dữ liệu BLE nhận được từ máy đo huyết áp.
    Định dạng chuẩn: Flags(1), SYS(2), DIA(2), MAP(2), Timestamp(7), Pulse(2)
    """
    print("\n" + "=" * 40)
    print(f"[{datetime.now().strftime('%H:%M:%S')}] DỮ LIỆU MỚI NHẬN:")
    print(f"  - Dữ liệu thô (hex): {data.hex(' ')}")

    try:
        # Cờ (Flags) ở byte đầu tiên cho biết các trường dữ liệu nào có mặt
        flags = data[0]
        unit_is_kpa = flags & 0x01
        has_timestamp = flags & 0x02
        has_pulse_rate = flags & 0x04

        # Các giá trị huyết áp luôn có (SFloat)
        # SFloat là một định dạng số thực 16-bit đặc biệt, nhưng ở đây chúng ta đọc nó như số nguyên
        sys_val = int.from_bytes(data[1:3], "little")
        dia_val = int.from_bytes(data[3:5], "little")
        map_val = int.from_bytes(data[5:7], "little")

        unit = "kPa" if unit_is_kpa else "mmHg"

        print(f"  - Huyết áp tâm thu (SYS): {sys_val} {unit}")
        print(f"  - Huyết áp tâm trương (DIA): {dia_val} {unit}")
        print(f"  - Huyết áp trung bình (MAP): {map_val} {unit}")

        # Con trỏ để đọc các trường dữ liệu tiếp theo
        idx = 7

        if has_timestamp:
            year = int.from_bytes(data[idx:idx + 2], "little")
            month, day, hour, minute, second = data[idx + 2:idx + 7]
            timestamp = f"{year}-{month:02d}-{day:02d} {hour:02d}:{minute:02d}:{second:02d}"
            print(f"  - Thời gian đo: {timestamp}")
            idx += 7

        if has_pulse_rate:
            # Nhịp tim là dạng SFloat, đọc như số nguyên là đủ cho mục đích hiển thị
            pulse = int.from_bytes(data[idx:idx + 2], "little")
            print(f"  - Nhịp tim: {pulse} bpm")
            idx += 2

        # TODO: Gửi dữ liệu lên server qua HTTP API
        measurement_data = {
            "sys": sys_val,
            "dia": dia_val,
            "pulse": pulse if has_pulse_rate else None,
            "timestamp": timestamp if has_timestamp else datetime.now().isoformat(),
            "method": "BLUETOOTH"
        }
        
        # Có thể gửi lên server ở đây
        print(f"📊 Measurement data: {json.dumps(measurement_data, indent=2)}")

    except IndexError:
        logging.error(f"[Lỗi Parser] Dữ liệu nhận được quá ngắn: {data.hex(' ')}")
    except Exception as e:
        logging.error(f"[Lỗi Parser] Lỗi không xác định: {e}")

    print("=" * 40)


async def live_mode(address: str):
    """
    Vòng lặp chính: kết nối, nhận dữ liệu và tự động kết nối lại khi mất kết nối.
    """
    print("--- CHƯƠNG TRÌNH THEO DÕI HUYẾT ÁP QUA BLUETOOTH ---")
    print(f"🍓 Chạy trên Raspberry Pi. Nhấn Ctrl+C để thoát.")
    print(f"🎯 Target device: {DEVICE_NAME} ({address})")
    print(f"📁 Config file: {CONFIG_FILE}")
    print()

    while True:
        # Kiểm tra xem có config mới không
        current_address, current_name = load_device_config()
        if current_address != address:
            print(f"🔄 Device address changed to: {current_name} ({current_address})")
            address = current_address
        
        client = BleakClient(address)
        try:
            print(f"[{datetime.now().strftime('%H:%M:%S')}] Đang quét và kết nối tới {address}...")
            await client.connect(timeout=20.0)

            if client.is_connected:
                print(f"[THÀNH CÔNG] Đã kết nối với thiết bị. Đang chờ dữ liệu...")

                # Bắt đầu nhận thông báo (notifications) từ máy đo huyết áp
                await client.start_notify(BLOOD_PRESSURE_MEASUREMENT_UUID, parse_blood_pressure_data)

                # Giữ cho chương trình chạy và lắng nghe khi đang kết nối
                while client.is_connected:
                    await asyncio.sleep(1)
                    
                    # Kiểm tra config thay đổi mỗi giây
                    new_address, new_name = load_device_config()
                    if new_address != address:
                        print(f"🔄 Config changed! Disconnecting from current device...")
                        break

        except (BleakError, asyncio.TimeoutError) as e:
            print(f"[LỖI KẾT NỐI] Không thể kết nối hoặc mất kết nối: {e}")
        except Exception as e:
            print(f"[LỖI HỆ THỐNG] Đã xảy ra lỗi không mong muốn: {e}")
        finally:
            # Dọn dẹp trước khi thử lại
            if client and client.is_connected:
                try:
                    await client.stop_notify(BLOOD_PRESSURE_MEASUREMENT_UUID)
                except BleakError:
                    pass # Bỏ qua lỗi nếu không thể dừng notify (ví dụ: thiết bị đã ngắt kết nối đột ngột)
                await client.disconnect()
                print("Đã ngắt kết nối an toàn.")

            print(f"Sẽ thử kết nối lại sau {RECONNECT_DELAY_SECONDS} giây...\n")
            await asyncio.sleep(RECONNECT_DELAY_SECONDS)


if __name__ == "__main__":
    # Cấu hình logging để ghi lại lỗi
    logging.basicConfig(level=logging.INFO)
    
    try:
        # Bắt đầu vòng lặp bất đồng bộ
        asyncio.run(live_mode(DEVICE_ADDRESS))
    except KeyboardInterrupt:
        # Xử lý khi người dùng nhấn Ctrl+C
        print("\nĐã nhận tín hiệu dừng. Đang thoát chương trình...")
