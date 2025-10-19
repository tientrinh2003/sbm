// Enhanced Bluetooth Manager with Device Discovery and Live Streaming
'use client';

import { useState, useEffect, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';

interface BluetoothDevice {
  address: string;
  name: string;
  rssi: number;
  is_omron: boolean;
  services: string[];
}

interface MeasurementSession {
  session_id: string;
  device_address: string;
  device_name: string;
  user_id: string;
  start_time: string;
  is_active: boolean;
  camera_streaming: boolean;
}

interface MeasurementResult {
  timestamp: string;
  systolic: number;
  diastolic: number;
  pulse: number;
  device_address: string;
  session_id: string;
}

interface EnhancedBluetoothManagerProps {
  onMeasurementComplete?: (data: MeasurementResult) => void;
  onStatusUpdate?: (status: string) => void;
  piHost?: string;
  userId?: string;
}

export default function EnhancedBluetoothManager({ 
  onMeasurementComplete,
  onStatusUpdate,
  piHost = 'localhost',
  userId
}: EnhancedBluetoothManagerProps) {
  const [discoveredDevices, setDiscoveredDevices] = useState<BluetoothDevice[]>([]);
  const [selectedDevice, setSelectedDevice] = useState<BluetoothDevice | null>(null);
  const [isScanning, setIsScanning] = useState(false);
  const [isConnecting, setIsConnecting] = useState(false);
  const [connectionStatus, setConnectionStatus] = useState<'disconnected' | 'connecting' | 'connected'>('disconnected');
  const [activeSession, setActiveSession] = useState<MeasurementSession | null>(null);
  const [measurementResult, setMeasurementResult] = useState<MeasurementResult | null>(null);
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);
  const [editableMeasurement, setEditableMeasurement] = useState<MeasurementResult | null>(null);
  const [cameraStreamUrl, setCameraStreamUrl] = useState<string>('');
  const [lastError, setLastError] = useState('');

  // WebSocket connection for real-time updates
  const wsRef = useRef<WebSocket | null>(null);

  const updateStatus = (message: string) => {
    onStatusUpdate?.(message);
    console.log('Enhanced Bluetooth:', message);
  };

  // Validate required props
  if (!userId) {
    return (
      <Alert variant="destructive">
        <AlertDescription>❌ User ID không được cung cấp cho Enhanced Bluetooth Manager</AlertDescription>
      </Alert>
    );
  }

  // Initialize WebSocket connection
  useEffect(() => {
    const connectWebSocket = () => {
      try {
        const ws = new WebSocket(`ws://${piHost}:8000/api/ws`);
        
        ws.onopen = () => {
          console.log('📡 WebSocket connected to Pi');
          updateStatus('Kết nối real-time thành công');
        };
        
        ws.onmessage = (event) => {
          const data = JSON.parse(event.data);
          handleWebSocketMessage(data);
        };
        
        ws.onclose = () => {
          console.log('📡 WebSocket disconnected');
          setTimeout(connectWebSocket, 5000); // Retry connection
        };
        
        ws.onerror = (error) => {
          console.error('📡 WebSocket error:', error);
        };
        
        wsRef.current = ws;
      } catch (error) {
        console.error('📡 WebSocket connection failed:', error);
      }
    };

    connectWebSocket();
    
    return () => {
      if (wsRef.current) {
        wsRef.current.close();
      }
    };
  }, [piHost]);

  const handleWebSocketMessage = (data: any) => {
    switch (data.type) {
      case 'bluetooth_discovery':
        setDiscoveredDevices(data.devices);
        updateStatus(`Tìm thấy ${data.devices.length} thiết bị Bluetooth`);
        break;
        
      case 'session_started':
        setActiveSession(data.session);
        setCameraStreamUrl(`http://${piHost}:8000/api/camera/stream`);
        updateStatus('📹 Bắt đầu phiên đo - Camera đang stream');
        break;
        
      case 'measurement_received':
        setMeasurementResult(data.data);
        setEditableMeasurement(data.data);
        setShowConfirmDialog(true);
        setCameraStreamUrl(''); // Stop camera stream
        updateStatus('🩺 Nhận được kết quả đo huyết áp');
        break;
        
      case 'measurement_confirmed':
        setActiveSession(null);
        setShowConfirmDialog(false);
        onMeasurementComplete?.(data.measurement);
        updateStatus('✅ Đo huyết áp hoàn thành');
        break;
        
      default:
        console.log('📡 Unknown message type:', data.type);
    }
  };

  const scanForDevices = async () => {
    setIsScanning(true);
    setLastError('');
    updateStatus('🔍 Đang quét thiết bị Bluetooth...');
    
    try {
      // Try Pi first, fallback to local mock API
      let response;
      try {
        response = await fetch(`http://${piHost}:8000/api/bluetooth/discover`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          signal: AbortSignal.timeout(5000) // 5 second timeout
        });
      } catch (piError) {
        console.log('Pi offline, using mock API');
        updateStatus('⚠️ Pi offline - sử dụng mock data');
        response = await fetch('/api/bluetooth/discover', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' }
        });
      }
      
      if (response.ok) {
        const data = await response.json();
        if (data.success) {
          setDiscoveredDevices(data.data.devices);
          updateStatus(`✅ Quét thành công: ${data.data.devices.length} thiết bị`);
        }
      } else {
        throw new Error('Scan failed');
      }
    } catch (error) {
      console.error('Scan error:', error);
      setLastError('Không thể quét thiết bị Bluetooth');
      updateStatus('❌ Lỗi quét Bluetooth');
    } finally {
      setIsScanning(false);
    }
  };

  const connectToDevice = async (device: BluetoothDevice) => {
    setIsConnecting(true);
    setConnectionStatus('connecting');
    updateStatus(`🔵 Đang kết nối với ${device.name}...`);
    
    try {
      const response = await fetch(`http://${piHost}:8000/api/bluetooth/connect`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          device_address: device.address,
          device_name: device.name
        })
      });
      
      if (response.ok) {
        const data = await response.json();
        if (data.success) {
          setSelectedDevice(device);
          setConnectionStatus('connected');
          updateStatus(`✅ Đã kết nối với ${device.name}`);
        } else {
          throw new Error(data.message);
        }
      } else {
        throw new Error('Connection failed');
      }
    } catch (error) {
      console.error('Connection error:', error);
      setLastError(`Không thể kết nối với ${device.name}`);
      setConnectionStatus('disconnected');
      updateStatus(`❌ Kết nối thất bại`);
    } finally {
      setIsConnecting(false);
    }
  };

  const startMeasurement = async () => {
    if (!selectedDevice) {
      updateStatus('❌ Chưa chọn thiết bị');
      return;
    }
    
    updateStatus('📊 Bắt đầu phiên đo huyết áp...');
    
    try {
      const response = await fetch(`http://${piHost}:8000/api/measurement/start`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          device_address: selectedDevice.address,
          device_name: selectedDevice.name,
          user_id: userId,
          ai_enabled: true
        })
      });
      
      if (response.ok) {
        const data = await response.json();
        if (data.success) {
          updateStatus('🎥 Camera đang hoạt động - Bắt đầu đo huyết áp');
        }
      }
    } catch (error) {
      console.error('Start measurement error:', error);
      updateStatus('❌ Lỗi bắt đầu đo');
    }
  };

  const confirmMeasurement = async () => {
    if (!editableMeasurement || !activeSession) return;
    
    try {
      const response = await fetch(`http://${piHost}:8000/api/measurement/confirm`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          session_id: activeSession.session_id,
          systolic: editableMeasurement.systolic,
          diastolic: editableMeasurement.diastolic,
          pulse: editableMeasurement.pulse,
          confirmed: true
        })
      });
      
      if (response.ok) {
        updateStatus('✅ Xác nhận kết quả thành công');
      }
    } catch (error) {
      console.error('Confirm measurement error:', error);
      updateStatus('❌ Lỗi xác nhận kết quả');
    }
  };

  const retakeMeasurement = () => {
    setShowConfirmDialog(false);
    setMeasurementResult(null);
    setEditableMeasurement(null);
    startMeasurement();
  };

  return (
    <div className="space-y-4 p-4 border rounded-lg bg-white">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="text-lg font-semibold">🩺 Enhanced Bluetooth Manager</div>
        <div className="text-sm text-gray-500">Pi: {piHost}</div>
      </div>

      {/* Error Display */}
      {lastError && (
        <Alert variant="destructive">
          <AlertDescription>{lastError}</AlertDescription>
        </Alert>
      )}

      {/* Device Discovery Section */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <div className="text-sm font-medium">📱 Thiết bị Bluetooth</div>
          <Button 
            onClick={scanForDevices}
            disabled={isScanning}
            size="sm"
            variant="outline"
          >
            {isScanning ? '🔄 Đang quét...' : '🔍 Quét thiết bị'}
          </Button>
        </div>

        {/* Device List */}
        {discoveredDevices.length > 0 && (
          <div className="space-y-2 max-h-64 overflow-y-auto">
            {discoveredDevices.map((device) => (
              <div 
                key={device.address}
                className={`p-3 border rounded-lg hover:bg-gray-50 ${
                  selectedDevice?.address === device.address ? 'bg-blue-50 border-blue-200' : ''
                }`}
              >
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <span className="font-medium">{device.name}</span>
                      {device.is_omron && (
                        <span className="px-2 py-1 bg-green-100 text-green-800 text-xs rounded-full">
                          OMRON
                        </span>
                      )}
                    </div>
                    <div className="text-xs text-gray-500 mt-1">
                      {device.address} • Signal: {device.rssi} dBm
                    </div>
                  </div>
                  <Button
                    onClick={() => connectToDevice(device)}
                    disabled={isConnecting || connectionStatus === 'connecting'}
                    size="sm"
                    className={selectedDevice?.address === device.address ? 'bg-green-600' : ''}
                  >
                    {selectedDevice?.address === device.address ? '✅ Đã kết nối' : '🔗 Kết nối'}
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Live Camera Stream */}
      {cameraStreamUrl && (
        <div className="space-y-2">
          <div className="text-sm font-medium">📹 Camera trực tiếp</div>
          <div className="border rounded-lg overflow-hidden">
            <img 
              src={cameraStreamUrl} 
              alt="Live Camera Stream"
              className="w-full h-64 object-cover"
              onError={() => {
                console.error('Camera stream error');
                setCameraStreamUrl('');
              }}
            />
            <div className="p-2 bg-red-600 text-white text-center text-sm">
              🔴 ĐANG GHI HÌNH - Vui lòng ngồi yên và bắt đầu đo huyết áp
            </div>
          </div>
        </div>
      )}

      {/* Measurement Control */}
      {selectedDevice && connectionStatus === 'connected' && !activeSession && (
        <div className="space-y-2">
          <Button 
            onClick={startMeasurement}
            className="w-full bg-red-600 hover:bg-red-700 text-white"
            size="lg"
          >
            🩺 Bắt đầu đo huyết áp
          </Button>
          <div className="text-xs text-gray-500 text-center">
            Camera sẽ bật và ghi hình trong quá trình đo
          </div>
        </div>
      )}

      {/* Active Session Status */}
      {activeSession && (
        <div className="p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
          <div className="text-sm font-medium text-yellow-800">
            📊 Đang đo huyết áp...
          </div>
          <div className="text-xs text-yellow-600 mt-1">
            Phiên: {activeSession.session_id}
          </div>
          <div className="text-xs text-yellow-600">
            Thiết bị: {activeSession.device_name}
          </div>
        </div>
      )}

      {/* Measurement Confirmation Dialog */}
      {showConfirmDialog && editableMeasurement && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded-lg max-w-md w-full mx-4">
            <div className="text-lg font-semibold mb-4">🩺 Kết quả đo huyết áp</div>
            
            <div className="space-y-3 mb-6">
              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="text-sm font-medium">SYS</label>
                  <input
                    type="number"
                    value={editableMeasurement.systolic}
                    onChange={(e) => setEditableMeasurement(prev => prev ? 
                      {...prev, systolic: parseInt(e.target.value) || 0} : null
                    )}
                    className="w-full p-2 border rounded"
                  />
                </div>
                <div>
                  <label className="text-sm font-medium">DIA</label>
                  <input
                    type="number"
                    value={editableMeasurement.diastolic}
                    onChange={(e) => setEditableMeasurement(prev => prev ? 
                      {...prev, diastolic: parseInt(e.target.value) || 0} : null
                    )}
                    className="w-full p-2 border rounded"
                  />
                </div>
                <div>
                  <label className="text-sm font-medium">Pulse</label>
                  <input
                    type="number"
                    value={editableMeasurement.pulse}
                    onChange={(e) => setEditableMeasurement(prev => prev ? 
                      {...prev, pulse: parseInt(e.target.value) || 0} : null
                    )}
                    className="w-full p-2 border rounded"
                  />
                </div>
              </div>
            </div>
            
            <div className="flex gap-3">
              <Button 
                onClick={confirmMeasurement}
                className="flex-1 bg-green-600 hover:bg-green-700"
              >
                ✅ Xác nhận
              </Button>
              <Button 
                onClick={retakeMeasurement}
                variant="outline"
                className="flex-1"
              >
                🔄 Đo lại
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Help Text */}
      <div className="text-xs text-gray-500 space-y-1 border-t pt-3">
        <div>💡 Bước 1: Quét và chọn thiết bị đo huyết áp</div>
        <div>💡 Bước 2: Kết nối với thiết bị</div>
        <div>💡 Bước 3: Bắt đầu đo - Camera sẽ ghi hình tự động</div>
        <div>💡 Bước 4: Xác nhận kết quả sau khi đo xong</div>
      </div>
    </div>
  );
}