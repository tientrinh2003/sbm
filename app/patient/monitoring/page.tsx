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
import EnhancedBluetoothManager from '@/components/EnhancedBluetoothManager';
import BluetoothDeviceScanner from '@/components/BluetoothDeviceScanner';
import ConfirmMeasurementDialog from '@/components/ConfirmMeasurementDialog';

export default function Monitoring() {
  const [userKey, setUserKey] = useState<string>('');
  const [piHost, setPiHost] = useState('192.168.22.70');
  const [selectedBluetoothDevice, setSelectedBluetoothDevice] = useState('');
  const [tele, setTele] = useState<any>({});
  const [bp, setBp] = useState<any>({});
  const [status, setStatus] = useState('');
  const [capturedPhoto, setCapturedPhoto] = useState<string>('');
  const [showPhotoDialog, setShowPhotoDialog] = useState(false);
  const [measurementMethod, setMeasurementMethod] = useState<'BLUETOOTH' | 'MANUAL'>('BLUETOOTH');
  const [aiAnalysis, setAiAnalysis] = useState<any>(null);
  const [lastMeasurement, setLastMeasurement] = useState<any>(null);
  const [realtimeAiStatus, setRealtimeAiStatus] = useState<any>(null);
  const [piConnected, setPiConnected] = useState(false);
  const [speechMonitoringActive, setSpeechMonitoringActive] = useState(false);
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);
  const [pendingMeasurement, setPendingMeasurement] = useState<any>(null);

  // Load current user
  useEffect(() => {
    (async () => {
      const r = await fetch('/api/me');
      const j = await r.json();
      const email = j?.user?.email || '';
      setUserKey(email);
    })();
  }, []);

  // Real-time AI status polling (only when monitoring is active)
  useEffect(() => {
    if (!speechMonitoringActive) {
      setRealtimeAiStatus(null);
      return;
    }

    const fetchRealtimeAiStatus = async () => {
      try {
        const response = await fetch(`/api/pi-proxy/ai-status?host=${piHost}`, {
          signal: AbortSignal.timeout(5000)
        });
        if (response.ok) {
          const data = await response.json();
          console.log('🎤 AI Status Response:', data); // Debug log
          setRealtimeAiStatus(data);
          setPiConnected(true);
        } else {
          setPiConnected(false);
        }
      } catch (error) {
        console.log('AI status polling error:', error);
        setPiConnected(false);
      }
    };

    fetchRealtimeAiStatus();
    const interval = setInterval(fetchRealtimeAiStatus, 2000); // Every 2 seconds
    return () => clearInterval(interval);
  }, [piHost, speechMonitoringActive]);



  async function saveBinding() {
    const r = await fetch('/api/device/bind', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ piHost })
    });
    setStatus(r.ok ? '✅ Cấu hình đã lưu' : '❌ Lỗi lưu cấu hình');
  }

  async function saveResult(data?: any) {
    const measurementData = data || bp;
    const { sys = 0, dia = 0, pulse = 0 } = measurementData;
    if (!sys || !dia || !pulse) return alert('Thiếu dữ liệu');
    
    const body: any = { 
      sys, 
      dia, 
      pulse, 
      method: measurementMethod 
    };
    
    // Include AI analysis data if available
    if (aiAnalysis) {
      body.aiAnalysis = aiAnalysis;
      body.speechData = aiAnalysis.speech_analysis;
      body.piTimestamp = new Date().toISOString();
      body.deviceId = selectedBluetoothDevice;
    }
    
    const r = await fetch('/api/measurements/create', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body)
    });
    
    if (r.ok) {
      const result = await r.json();
      setLastMeasurement(result.measurement);
      setStatus('✅ Đã lưu kết quả vào hồ sơ thành công!');
      setBp({ sys: '', dia: '', pulse: '' }); // Clear form after save
    } else {
      alert('Lỗi lưu dữ liệu');
    }
  }

  async function startSim() {
    const r = await fetch('/api/sim/start', { method: 'POST' });
    setStatus(r.ok ? 'Mô phỏng đã bắt đầu' : 'Mô phỏng thất bại');
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
    setStatus('⏳ Bắt đầu quy trình đo...');
    
    if (measurementMethod === 'BLUETOOTH') {
      // Bluetooth mode - trigger measurement via Pi
      setStatus('📡 Đang kết nối với thiết bị Omron...');
      try {
        const response = await fetch(`http://${piHost}:8000/start-measurement`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            user_id: userKey,
            session_id: Date.now().toString()
          })
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
    } else if (false) { // PI_AUTOMATED temporarily disabled
      // Pi-assisted mode with AI analysis
      setStatus('🤖 Bắt đầu chế độ AI tự động...');
      try {
        const response = await fetch(`http://${piHost}:8000/ai-measurement`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            mac_address: mac,
            user_id: userKey,
            session_id: Date.now().toString(),
            ai_enabled: true
          })
        });
        
        if (response.ok) {
          const data = await response.json();
          if (data.measurement) {
            setBp(data.measurement);
            setAiAnalysis(data.ai_analysis);
            setStatus('🎯 AI đã hoàn thành phân tích! Kiểm tra kết quả bên dưới.');
          }
        } else {
          throw new Error('AI measurement failed');
        }
      } catch (error) {
        console.error('AI measurement error:', error);
        setStatus('Lỗi đo huyết áp với AI');
      }
    } else {
      // Manual mode - clear form for manual entry
      setBp({ sys: '', dia: '', pulse: '' });
      setAiAnalysis(null);
      setStatus('Chế độ nhập thủ công - vui lòng nhập giá trị bên dưới');
    }
  }

  function handleDeviceConnected(_address: string) {
    // Device connected callback - can be used for future features
  }

  return (
    <div className="grid gap-6 md:grid-cols-[16rem_1fr]">
      <Sidebar role="PATIENT" />
      <div className="space-y-6">
        {/* Configuration */}
        <div className="card space-y-3">
          <div className="text-sm font-medium">⚙️ Thiết lập hệ thống</div>
          <div className="grid md:grid-cols-2 gap-3">
            <div>
              <Label>Pi Host</Label>
              <Input 
                value={piHost} 
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => setPiHost(e.target.value)} 
              />
            </div>
            <div className="flex items-end">
              <Button variant="outline" onClick={saveBinding}>💾 Lưu cấu hình</Button>
            </div>
          </div>
          <div className="text-sm text-slate-600">Trạng thái: {status || '—'}</div>
        </div>

        {/* Camera and Speech Status */}
        {speechMonitoringActive && (
          <div className="space-y-4">
            <div className="card">
              <div className="text-sm font-medium mb-3">📹 Camera giám sát</div>
              <CameraStream 
                onCapture={handlePhotoCapture}
                piHost={piHost}
                isActive={speechMonitoringActive}
              />
            </div>
            <div className="card">
              <PostureStatus 
                tele={tele} 
                piHost={piHost}
                cameraActive={speechMonitoringActive}
              />
            </div>
          </div>
        )}

        {/* AI Enhanced Mode Info */}
        {measurementMethod === 'PI_AUTOMATED' && (
          <div className="card">
            <div className="bg-green-50 border border-green-200 rounded-lg p-4">
              <div className="text-green-800">
                <div className="font-medium flex items-center gap-2 mb-2">
                  🤖 <span>Chế độ AI nâng cao đang hoạt động</span>
                </div>
                <div className="text-sm space-y-1">
                  <div>📹 Camera từ Pi sẽ stream trực tiếp khi bắt đầu đo</div>
                  <div>🔍 Tự động quét và kết nối thiết bị Bluetooth</div>
                  <div>🧠 AI phân tích speech + visual real-time</div>
                  <div>✅ Xác nhận kết quả trước khi lưu</div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Blood Pressure Measurement */}
        <div className="card space-y-4">
          <div className="text-sm font-medium">🩺 Đo huyết áp</div>
          
          {/* Measurement Method Selection */}
          <div className="flex gap-3 flex-wrap">
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="radio"
                name="measurementMethod"
                value="BLUETOOTH"
                checked={measurementMethod === 'BLUETOOTH'}
                onChange={(e) => setMeasurementMethod(e.target.value as 'BLUETOOTH')}
                className="text-blue-600"
              />
              <span className="text-sm">📱 Bluetooth (Legacy)</span>
            </label>
            {/* PI_AUTOMATED option temporarily disabled - waiting for schema update */}
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

          {/* Enhanced Bluetooth Manager - temporarily disabled */}
          {false && ( // PI_AUTOMATED temporarily disabled
            <EnhancedBluetoothManager
              piHost={piHost}
              userId={userKey}
              onMeasurementComplete={(data) => {
                setBp({ sys: data.systolic, dia: data.diastolic, pulse: data.pulse });
                setStatus('✅ Đo huyết áp hoàn thành với AI Enhanced mode');
              }}
              onStatusUpdate={(status) => setStatus(status)}
            />
          )}

          {/* Legacy Bluetooth Manager for BLUETOOTH mode */}
          {measurementMethod === 'BLUETOOTH' && (
            <>
              <BluetoothDeviceScanner
                piHost={piHost}
                onDeviceSelected={(address) => setSelectedBluetoothDevice(address)}
                onMeasurementStart={() => {
                  // Auto start monitoring when measurement begins
                  setSpeechMonitoringActive(true);
                  setStatus('🎥 Đã bật camera và micro để giám sát...');
                }}
                onMeasurementComplete={(data) => {
                  // Show confirmation dialog instead of auto-filling form
                  setPendingMeasurement(data);
                  setShowConfirmDialog(true);
                  setStatus(`✅ Đo huyết áp thành công: ${data.sys}/${data.dia} mmHg, Pulse: ${data.pulse} bpm`);
                }}
                onMeasurementEnd={() => {
                  // Auto stop monitoring after measurement completes
                  setSpeechMonitoringActive(false);
                  setStatus('🔴 Đã tắt camera và micro');
                }}
              />
              
              {selectedBluetoothDevice && (
                <div className="bg-green-50 border border-green-200 rounded-lg p-3">
                  <div className="text-sm text-green-800">
                    ✅ Thiết bị đã chọn: <span className="font-mono">{selectedBluetoothDevice}</span>
                  </div>
                </div>
              )}
            </>
          )}

          {/* Legacy Mode Info */}
          {measurementMethod === 'BLUETOOTH' && (
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
              <div className="text-sm text-blue-800">
                📱 <strong>Bluetooth Legacy:</strong> Kết nối trực tiếp với thiết bị đo huyết áp qua Bluetooth.
              </div>
            </div>
          )}

          {/* Manual Mode Info */}
          {measurementMethod === 'MANUAL' && (
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
              <div className="text-sm text-blue-800">
                📝 <strong>Chế độ nhập thủ công:</strong> Nhập giá trị đo được từ thiết bị của bạn vào form bên dưới.
              </div>
            </div>
          )}

          {/* Measure Button - only for BLUETOOTH and MANUAL modes */}
          {measurementMethod === 'MANUAL' && (
            <Button
              onClick={takeMeasurement}
              className="bg-red-600 hover:bg-red-700 text-white"
            >
              📝 Nhập thủ công
            </Button>
          )}
        </div>

        {/* AI Analysis Results */}
        {false && ( // PI_AUTOMATED AI analysis temporarily disabled
          <div className="card space-y-3">
            {/* Debug Info */}
            {speechMonitoringActive && (
              <div className="mb-2 p-2 bg-blue-50 border border-blue-200 rounded text-xs">
                🔍 Debug: Speech monitoring = {speechMonitoringActive ? 'ON' : 'OFF'} | 
                Pi connected = {piConnected ? 'YES' : 'NO'} | 
                Is speaking = {realtimeAiStatus?.data?.speech_analysis?.is_speaking ? 'YES' : 'NO'}
              </div>
            )}

            {/* Speech Detection Alert */}
            {speechMonitoringActive && realtimeAiStatus?.data?.speech_analysis?.is_speaking && (
              <div className="mb-4 p-4 bg-yellow-50 border-l-4 border-yellow-400 rounded-lg shadow-sm">
                <div className="flex items-center gap-3">
                  <div className="flex-shrink-0">
                    <span className="text-2xl">⚠️</span>
                  </div>
                  <div className="flex-1">
                    <h3 className="text-lg font-semibold text-yellow-800 mb-1">
                      Phát hiện tiếng nói!
                    </h3>
                    <p className="text-yellow-700 text-sm">
                      <strong>Xin hãy giữ im lặng để đo huyết áp chính xác.</strong><br/>
                      Việc nói chuyện có thể ảnh hưởng đến kết quả đo huyết áp.
                    </p>
                    <div className="mt-2 text-xs text-yellow-600">
                      Độ tin cậy phát hiện: {(realtimeAiStatus?.data?.speech_analysis?.confidence * 100).toFixed(1)}%
                    </div>
                  </div>
                </div>
              </div>
            )}

            <div className="text-sm font-medium">🧠 Phân tích AI</div>
            <div className="grid md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <div className="text-xs font-medium text-gray-600">🎤 Phân tích giọng nói</div>
                {aiAnalysis.speech_analysis && (
                  <div className="space-y-1 text-sm">
                    <div>Độ tin cậy: <span className="font-mono">{(aiAnalysis.speech_analysis.confidence * 100).toFixed(1)}%</span></div>
                    <div>Lớp âm thanh: <span className="font-mono">{aiAnalysis.speech_analysis.class_name}</span></div>
                    <div>Mức stress: <span className={`font-mono ${aiAnalysis.speech_analysis.stress_level > 0.7 ? 'text-red-600' : aiAnalysis.speech_analysis.stress_level > 0.4 ? 'text-yellow-600' : 'text-green-600'}`}>
                      {(aiAnalysis.speech_analysis.stress_level * 100).toFixed(1)}%
                    </span></div>
                  </div>
                )}
              </div>
              <div className="space-y-2">
                <div className="text-xs font-medium text-gray-600">👄 Phân tích hình ảnh</div>
                {aiAnalysis.visual_analysis && (
                  <div className="space-y-1 text-sm">
                    <div>Phát hiện khuôn mặt: <span className="font-mono">{aiAnalysis.visual_analysis.face_detected ? '✅ Có' : '❌ Không'}</span></div>
                    <div>Chuyển động miệng: <span className="font-mono">{aiAnalysis.visual_analysis.mouth_movement ? '✅ Có' : '❌ Không'}</span></div>
                    <div>Độ tin cậy: <span className="font-mono">{(aiAnalysis.visual_analysis.confidence * 100).toFixed(1)}%</span></div>
                  </div>
                )}
              </div>
            </div>
            {aiAnalysis.correlation_score && (
              <div className="bg-green-50 border border-green-200 rounded-lg p-3">
                <div className="text-sm">
                  <span className="font-medium text-green-800">🎯 Điểm tương quan AI-BP: </span>
                  <span className="font-mono font-bold text-green-900">{(aiAnalysis.correlation_score * 100).toFixed(1)}%</span>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Measurement Results - Only show for MANUAL mode */}
        {measurementMethod === 'MANUAL' && (
          <div className="card space-y-3">
            <div className="flex items-center justify-between">
              <div className="text-sm font-medium">💉 Nhập kết quả đo thủ công</div>
            </div>
            
            <div className="grid grid-cols-3 gap-3">
              <div>
                <Label>SYS (mmHg)</Label>
                <Input 
                  type="number"
                  value={bp.sys ?? ''} 
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) => setBp((v: any) => ({ ...v, sys: Number(e.target.value) || undefined }))} 
                  placeholder="120"
                />
              </div>
              <div>
                <Label>DIA (mmHg)</Label>
                <Input 
                  type="number"
                  value={bp.dia ?? ''} 
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) => setBp((v: any) => ({ ...v, dia: Number(e.target.value) || undefined }))} 
                  placeholder="80"
                />
              </div>
              <div>
                <Label>Pulse (bpm)</Label>
                <Input 
                  type="number"
                  value={bp.pulse ?? ''} 
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) => setBp((v: any) => ({ ...v, pulse: Number(e.target.value) || undefined }))} 
                  placeholder="75"
                />
              </div>
            </div>
            <Button onClick={() => saveResult()}>💾 Lưu kết quả</Button>
          </div>
        )}

        {/* Photo Capture Dialog */}
        <CapturePhotoDialog
          isOpen={showPhotoDialog}
          imageData={capturedPhoto}
          onClose={() => setShowPhotoDialog(false)}
          onSave={savePhotoToProfile}
        />

        {/* Confirmation Dialog for Bluetooth Measurement */}
        <ConfirmMeasurementDialog
          isOpen={showConfirmDialog}
          data={pendingMeasurement}
          onConfirm={async () => {
            await saveResult(pendingMeasurement);
            setShowConfirmDialog(false);
            setPendingMeasurement(null);
          }}
          onCancel={() => {
            setShowConfirmDialog(false);
            setPendingMeasurement(null);
            setStatus('❌ Đã hủy - Kết quả không được lưu');
          }}
        />
      </div>
    </div>
  );
}