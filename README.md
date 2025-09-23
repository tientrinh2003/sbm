# Smart BP – Full-stack demo (Next.js 15)

## 🔧 Quick Mock Simulation (No Hardware Required!)

**Want to test the complete system without buying a Raspberry Pi?**

```bash
# Option 1: Windows Batch Script
start_mock_simulation.bat

# Option 2: PowerShell (Cross-platform)  
.\start_mock_simulation.ps1

# Then visit: http://localhost:3000/admin/bluetooth
# Use Pi IP: localhost:8000
```

📖 **Full Guide**: See [MOCK_SIMULATION_GUIDE.md](./MOCK_SIMULATION_GUIDE.md)

## 🚀 Standard Setup

```bash
pnpm install
pnpm approve-builds -y prisma @prisma/client @prisma/engines
cp .env.example .env.local   # edit DB + secrets
pnpm prisma:generate
pnpm prisma:migrate
pnpm seed
pnpm dev
```

### Demo accounts
- admin@smartbp.local / 123456
- doctor@smartbp.local / 123456
- patient@smartbp.local / 123456

## End-to-end chạy không cần Raspberry/MQTT (SSE mô phỏng)
1) Login bằng `patient@smartbp.local` → **Patient / Monitoring**  
2) Bấm **Start Sim (SSE)** → sẽ thấy trạng thái posture/mouth/speak thay đổi, thỉnh thoảng có BP (SYS/DIA/Pulse).  
3) Bấm **Lưu kết quả** để ghi DB.

## Webhook mô phỏng (Pi → Web)
```bash
# Sửa .env.local: WEBHOOK_SECRET=dev-shared-webhook-secret
curl -X POST http://localhost:3000/api/measurements/webhook  -H "Content-Type: application/json"  -H "Authorization: Bearer dev-shared-webhook-secret"  -d '{"userKey":"patient@smartbp.local","sys":130,"dia":84,"pulse":72,"telemetry":{"posture_ok":true,"mouth_open":false,"speak":false}}'
```

## MQTT (tùy chọn)
- Nếu có broker (TCP 1883 + WS 9001), set:
```
NEXT_PUBLIC_MQTT_URL=ws://<broker-host>:9001/mqtt
MQTT_TCP_HOST=<broker-host>
MQTT_TCP_PORT=1883
```
- **Monitoring** sẽ tự subscribe topic `smb/raspi/<userKey>/{telemetry|bp}`.
- Nút **Gửi cấu hình (MQTT)** publish `{ device_address, pi_host }` lên topic `.../config`.

## Kiến trúc kênh kết nối
- Mặc định: **SSE mô phỏng** chạy được ngay (không cần Pi/broker).
- Dự phòng: **Webhook** (Pi gọi thẳng HTTP).
- Tuỳ chọn: **MQTT** cho realtime hai chiều.

## RaspberryPi (sau này)
- Viết code BLE + Mediapipe/YamNet vào `raspberrypi/ble_bridge.py` (placeholder).  
- Gửi telemetry/BP qua MQTT hoặc Webhook/WS theo chuẩn JSON của repo.
