'use client';
import { useEffect, useState } from 'react';
import Sidebar from '@/components/Sidebar';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import CameraStream from '@/components/CameraStream';
import PostureStatus from '@/components/PostureStatus';
import CapturePhotoDialog from '@/components/CapturePhotoDialog';
import BluetoothManager from '@/components/BluetoothManager';

function useMqtt(url?: string) {
  const [client, setClient] = useState<any>(null);
  useEffect(() => {
    if (!url) return;
    let c: any;
    (async () => {
      const mqtt = await import('mqtt');
      c = mqtt.connect(url, { reconnectPeriod: 2000 });
      setClient(c);
    })();
    return () => {
      try { c?.end?.(true); } catch { }
    };
  }, [url]);
  return client;
}

export default function Monitoring() {
  const mqttUrl = process.env.NEXT_PUBLIC_MQTT_URL;
  const base = process.env.NEXT_PUBLIC_MQTT_BASE || 'smb';
  const mqtt = useMqtt(mqttUrl);
  const [userKey, setUserKey] = useState<string>('');
  const [mac, setMac] = useState('00:5F:BF:3A:51:BD');
  const [piHost, setPiHost] = useState('localhost');
  const [tele, setTele] = useState<any>({});
  const [bp, setBp] = useState<any>({});
  const [status, setStatus] = useState('');
  const [capturedPhoto, setCapturedPhoto] = useState<string>('');
  const [showPhotoDialog, setShowPhotoDialog] = useState(false);
  const [measurementMethod, setMeasurementMethod] = useState<'BLUETOOTH' | 'MANUAL'>('BLUETOOTH');

  // Load current user
  useEffect(() => {
    (async () => {
      const r = await fetch('/api/me');
      const j = await r.json();
      const email = j?.user?.email || '';
      setUserKey(email);
    })();
  }, []);

  // MQTT receive (optional)
  useEffect(() => {
    if (!mqtt || !userKey) return;
    const bpTopic = `${base}/raspi/${userKey}/bp`;
    const tTopic = `${base}/raspi/${userKey}/telemetry`;
    const onConnect = () => {
      setStatus('MQTT connected');
      mqtt.subscribe([bpTopic, tTopic]);
    };
    const onMessage = (_t: string, p: Uint8Array) => {
      const txt = new TextDecoder().decode(p);
      try {
        const obj = JSON.parse(txt);
        if (obj.sys || obj.dia || obj.pulse) setBp(obj);
        if (obj.posture_ok !== undefined) setTele((v: any) => ({ ...v, ...obj }));
      } catch { }
    };
    mqtt.on('connect', onConnect);
    mqtt.on('message', onMessage);
    return () => {
      try {
        mqtt.off('connect', onConnect);
        mqtt.off('message', onMessage);
        mqtt.unsubscribe(bpTopic);
        mqtt.unsubscribe(tTopic);
      } catch { }
    };
  }, [mqtt, userKey, base]);

  // SSE receive
  useEffect(() => {
    if (!userKey) return;
    const es = new EventSource(`/api/sse/stream?userKey=${encodeURIComponent(userKey)}`);
    es.onmessage = (ev) => {
      try {
        const obj = JSON.parse(ev.data);
        if (obj.sys || obj.dia || obj.pulse) setBp(obj);
        if (obj.posture_ok !== undefined) setTele((v: any) => ({ ...v, ...obj }));
      } catch { }
    };
    es.onerror = () => { };
    return () => { es.close(); };
  }, [userKey]);

  function sendConfig() {
    if (!mqtt || !userKey) {
      setStatus('MQTT not connected or user not ready');
      return;
    }
    const cfg = `${base}/raspi/${userKey}/config`;
    mqtt.publish(cfg, JSON.stringify({ device_address: mac, pi_host: piHost }), { qos: 1 });
    setStatus('Config sent via MQTT');
  }

  async function saveBinding() {
    const r = await fetch('/api/device/bind', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ mac, piHost })
    });
    setStatus(r.ok ? 'Binding saved' : 'Save failed');
    if (r.ok) {
      localStorage.setItem('pi_stream', `http://${piHost}:8080/stream.mjpg`);
    }
  }

  async function saveResult() {
    const { sys = 0, dia = 0, pulse = 0 } = bp;
    if (!sys || !dia || !pulse) return alert('Thiếu dữ liệu');
    const r = await fetch('/api/measurements/create', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ sys, dia, pulse, method: measurementMethod })
    });
    alert(r.ok ? 'Đã lưu' : 'Lỗi');
  }

  async function startSim() {
    const r = await fetch('/api/sim/start', { method: 'POST' });
    setStatus(r.ok ? 'Simulation started' : 'Sim failed');
  }

  async function stopSim() {
    const r = await fetch('/api/sim/stop', { method: 'POST' });
    setStatus(r.ok ? 'Simulation stopped' : 'Stop failed');
  }

  function handlePhotoCapture(imageData: string) {
    setCapturedPhoto(imageData);
    setShowPhotoDialog(true);
  }

  async function savePhotoToProfile(imageData: string, note: string) {
    try {
      const response = await fetch(imageData);
      const blob = await response.blob();
      
      const formData = new FormData();
      formData.append('photo', blob, `patient-photo-${Date.now()}.jpg`);
      formData.append('note', note);
      formData.append('type', 'monitoring');
      
      const result = await fetch('/api/photos/upload', {
        method: 'POST',
        body: formData
      });

      if (result.ok) {
        setStatus('Ảnh đã được lưu vào hồ sơ bệnh nhân');
      } else {
        throw new Error('Upload failed');
      }
    } catch (error) {
      console.error('Error saving photo:', error);
      throw error;
    }
  }

  async function takeMeasurement() {
    setStatus('Đang đo huyết áp...');
    
    if (measurementMethod === 'BLUETOOTH') {
      try {
        const response = await fetch(`http://localhost:8000/measure`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' }
        });
        
        if (response.ok) {
          const data = await response.json();
          if (data.data) {
            setBp(data.data);
            setStatus('Đo hoàn thành! Kiểm tra kết quả bên dưới.');
          }
        } else {
          throw new Error('Measurement failed');
        }
      } catch (error) {
        console.error('Measurement error:', error);
        setStatus('Lỗi đo huyết áp');
      }
    } else {
      // Manual mode - clear form for manual entry
      setBp({ sys: '', dia: '', pulse: '' });
      setStatus('Chế độ nhập thủ công - vui lòng nhập giá trị bên dưới');
    }
  }

  function handleDeviceConnected(address: string) {
    if (address) {
      setMac(address);
    }
  }

  return (
    <div className="grid gap-6 md:grid-cols-[16rem_1fr]">
      <Sidebar role="PATIENT" />
      <div className="space-y-6">
        {/* Configuration */}
        <div className="card space-y-3">
          <div className="text-sm font-medium">⚙️ Thiết lập hệ thống</div>
          <div className="grid md:grid-cols-3 gap-3">
            <div>
              <Label>Địa chỉ MAC</Label>
              <Input 
                value={mac} 
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => setMac(e.target.value)} 
              />
            </div>
            <div>
              <Label>Pi Host</Label>
              <Input 
                value={piHost} 
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => setPiHost(e.target.value)} 
              />
            </div>
            <div className="flex items-end gap-2 flex-wrap">
              <Button variant="outline" onClick={saveBinding}>Lưu</Button>
              <Button onClick={sendConfig}>Gửi cấu hình (MQTT)</Button>
              <Button variant="ghost" onClick={startSim}>Start Sim (SSE)</Button>
              <Button variant="ghost" onClick={stopSim}>Stop Sim</Button>
            </div>
          </div>
          <div className="text-xs text-slate-600 break-all">User: {userKey || '—'}</div>
          <div className="text-sm text-slate-600">Trạng thái: {status || '—'}</div>
        </div>

        {/* Camera and Posture */}
        <div className="grid gap-6 md:grid-cols-2">
          <div className="card">
            <div className="text-sm font-medium mb-3">📹 Camera giám sát</div>
            <CameraStream onCapture={handlePhotoCapture} />
          </div>
          <div className="card">
            <div className="text-sm font-medium">📊 Tư thế/tiếng ồn</div>
            <PostureStatus tele={tele} />
          </div>
        </div>

        {/* Blood Pressure Measurement */}
        <div className="card space-y-4">
          <div className="text-sm font-medium">🩺 Đo huyết áp</div>
          
          {/* Measurement Method Selection */}
          <div className="flex gap-3">
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="radio"
                name="measurementMethod"
                value="BLUETOOTH"
                checked={measurementMethod === 'BLUETOOTH'}
                onChange={(e) => setMeasurementMethod(e.target.value as 'BLUETOOTH')}
                className="text-blue-600"
              />
              <span className="text-sm">📱 Bluetooth (Tự động)</span>
            </label>
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="radio"
                name="measurementMethod"
                value="MANUAL"
                checked={measurementMethod === 'MANUAL'}
                onChange={(e) => setMeasurementMethod(e.target.value as 'MANUAL')}
                className="text-blue-600"
              />
              <span className="text-sm">✍️ Nhập thủ công</span>
            </label>
          </div>

          {/* Bluetooth Manager (only show if BLUETOOTH mode) */}
          {measurementMethod === 'BLUETOOTH' && (
            <BluetoothManager 
              onDeviceConnected={handleDeviceConnected}
              onStatusUpdate={setStatus}
            />
          )}

          {/* Manual Mode Info */}
          {measurementMethod === 'MANUAL' && (
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
              <div className="text-sm text-blue-800">
                📝 <strong>Chế độ nhập thủ công:</strong> Nhập giá trị đo được từ thiết bị của bạn vào form bên dưới.
              </div>
            </div>
          )}

          {/* Measure Button */}
          <Button
            onClick={takeMeasurement}
            className="bg-red-600 hover:bg-red-700 text-white"
          >
            {measurementMethod === 'BLUETOOTH' ? '📊 Bắt đầu đo' : '📝 Nhập thủ công'}
          </Button>
        </div>

        {/* Measurement Results */}
        <div className="card space-y-3">
          <div className="flex items-center justify-between">
            <div className="text-sm font-medium">💉 Kết quả đo huyết áp</div>
            <div className="text-xs text-gray-500">
              Phương pháp: {measurementMethod === 'BLUETOOTH' ? '📱 Bluetooth' : '✍️ Thủ công'}
            </div>
          </div>
          
          <div className="grid grid-cols-3 gap-3">
            <div>
              <Label>SYS</Label>
              <Input 
                value={bp.sys ?? ''} 
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => setBp((v: any) => ({ ...v, sys: Number(e.target.value) || undefined }))} 
              />
            </div>
            <div>
              <Label>DIA</Label>
              <Input 
                value={bp.dia ?? ''} 
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => setBp((v: any) => ({ ...v, dia: Number(e.target.value) || undefined }))} 
              />
            </div>
            <div>
              <Label>Pulse</Label>
              <Input 
                value={bp.pulse ?? ''} 
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => setBp((v: any) => ({ ...v, pulse: Number(e.target.value) || undefined }))} 
              />
            </div>
          </div>
          <Button onClick={saveResult}>💾 Lưu kết quả</Button>
        </div>

        {/* Photo Capture Dialog */}
        <CapturePhotoDialog
          isOpen={showPhotoDialog}
          imageData={capturedPhoto}
          onClose={() => setShowPhotoDialog(false)}
          onSave={savePhotoToProfile}
        />
      </div>
    </div>
  );
}