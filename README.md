# Smart BP – IoT Blood Pressure Monitoring Platform (Next.js 15)

## 🚀 Quick Start

### Without Hardware (Mock Simulation)

Muốn test hệ thống đầy đủ mà không cần Raspberry Pi?

```bash
# Windows
start_mock_simulation.bat

# PowerShell / macOS / Linux
./start_mock_simulation.ps1
```

Sau đó truy cập: http://localhost:3000/admin/bluetooth (Pi IP: `localhost:8000`)

📖 **Chi tiết**: Xem [MOCK_SIMULATION_GUIDE.md](./MOCK_SIMULATION_GUIDE.md)

---

### Standard Setup

```bash
pnpm install
pnpm approve-builds -y prisma @prisma/client @prisma/engines
cp .env.example .env.local
pnpm prisma:generate
pnpm prisma:migrate
pnpm seed
pnpm dev
```

**Demo Accounts:**
```
admin@smartbp.local / 123456
doctor@smartbp.local / 123456
patient@smartbp.local / 123456
```

---

## 📊 Testing the System (No Pi/MQTT Required)

### 1. SSE Mock Simulation
1. Đăng nhập: `patient@smartbp.local`
2. Vào **Patient Dashboard → Monitoring**
3. Bấm **Start Sim (SSE)** để xem dữ liệu giả lập thay đổi
4. Quan sát: posture, mouth, speech status và BP readings
5. Bấm **Lưu kết quả** để ghi vào database

### 2. Webhook Mock (HTTP Simulation)

```bash
# Set WEBHOOK_SECRET in .env.local
export WEBHOOK_SECRET=dev-shared-webhook-secret

curl -X POST http://localhost:3000/api/measurements/webhook \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer dev-shared-webhook-secret" \
  -d '{
    "userKey": "patient@smartbp.local",
    "sys": 130,
    "dia": 84,
    "pulse": 72,
    "telemetry": {
      "posture_ok": true,
      "mouth_open": false,
      "speak": false
    }
  }'
```

---

## 📡 Integration Options

### Default: SSE (Server-Sent Events)
- ✅ Hoạt động ngay, không cần Pi/broker
- ✅ Dữ liệu mô phỏng từ server

### Option 2: Webhook (HTTP Push)
- Raspberry Pi gọi trực tiếp endpoint
- Phù hợp cho hệ thống offline-capable

### Option 3: MQTT (Realtime Two-way)

**Requirements:** MQTT Broker (TCP 1883 + WebSocket 9001)

```bash
# .env.local
NEXT_PUBLIC_MQTT_URL=ws://<broker-ip>:9001/mqtt
MQTT_TCP_HOST=<broker-ip>
MQTT_TCP_PORT=1883
```

**Topics:**
- Subscribe: `smb/raspi/<userKey>/{telemetry|bp}`
- Publish config: `smb/raspi/<userKey>/config`

---

## 🔌 Raspberry Pi Integration (Coming Soon)

Placeholder implementation in `raspberrypi/ble_bridge.py`:

```python
# Features to implement:
# - BLE scan & connect to BP device
# - MediaPipe for posture/mouth detection
# - YAMNet for speech classification
# - Send data via MQTT, Webhook, or WebSocket
```

**Send data using:**
- MQTT: Publish to broker
- Webhook: POST to `/api/measurements/webhook`
- WebSocket: Real-time bidirectional sync
