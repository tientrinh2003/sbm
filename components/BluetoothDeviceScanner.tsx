'use client';
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';

interface BluetoothDevice {
  address: string;
  name: string;
  rssi: number;
  is_omron: boolean;
}

interface BluetoothScannerProps {
  piHost: string;
  onDeviceSelected: (address: string) => void;
  onMeasurementComplete?: (data: any) => void;
  onMeasurementStart?: () => void;
  onMeasurementEnd?: () => void;
}

export default function BluetoothDeviceScanner({ 
  piHost, 
  onDeviceSelected,
  onMeasurementComplete,
  onMeasurementStart,
  onMeasurementEnd
}: BluetoothScannerProps) {
  const [devices, setDevices] = useState<BluetoothDevice[]>([]);
  const [isScanning, setIsScanning] = useState(false);
  const [selectedDevice, setSelectedDevice] = useState<string>('');
  const [isMeasuring, setIsMeasuring] = useState(false);
  const [status, setStatus] = useState('');
  const [error, setError] = useState('');

  const scanDevices = async () => {
    setIsScanning(true);
    setError('');
    setStatus('🔍 Đang quét thiết bị Bluetooth...');
    
    try {
      const response = await fetch(`/api/pi-proxy/bluetooth-scan?host=${piHost}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' }
      });
      
      if (response.ok) {
        const data = await response.json();
        if (data.success && data.devices) {
          setDevices(data.devices);
          setStatus(`✅ Tìm thấy ${data.devices.length} thiết bị`);
        } else {
          setError(data.error || 'Không tìm thấy thiết bị');
        }
      } else {
        setError('Lỗi kết nối Pi server');
      }
    } catch (err) {
      console.error('Scan error:', err);
      setError('Không thể quét thiết bị');
    } finally {
      setIsScanning(false);
    }
  };

  const selectDevice = (address: string) => {
    setSelectedDevice(address);
    onDeviceSelected(address);
    setStatus(`✅ Đã chọn thiết bị: ${address}`);
  };

  const measureBloodPressure = async () => {
    if (!selectedDevice) {
      setError('Vui lòng chọn thiết bị trước');
      return;
    }

    setIsMeasuring(true);
    setError('');
    setStatus('📊 Đang đo huyết áp... Vui lòng chờ tối đa 2 phút. Hãy bật chế độ đo trên máy Omron.');
    
    // Notify parent to start monitoring (camera/mic)
    onMeasurementStart?.();
    
    try {
      const response = await fetch(`/api/pi-proxy/bluetooth-measure?host=${piHost}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ device_address: selectedDevice })
      });
      
      if (response.ok) {
        const result = await response.json();
        if (result.success && result.data) {
          setStatus('✅ Đo thành công!');
          onMeasurementComplete?.(result.data);
        } else {
          setError(result.error || 'Đo thất bại');
        }
      } else {
        setError('Lỗi đo huyết áp');
      }
    } catch (err) {
      console.error('Measurement error:', err);
      setError('Không thể đo huyết áp');
    } finally {
      setIsMeasuring(false);
      // Notify parent to stop monitoring (camera/mic)
      onMeasurementEnd?.();
    }
  };

  return (
    <div className="space-y-4">
      {/* Scan Button */}
      <div className="flex gap-2">
        <Button 
          onClick={scanDevices} 
          disabled={isScanning}
          className="bg-blue-600 hover:bg-blue-700"
        >
          {isScanning ? '🔄 Đang quét...' : '🔍 Quét thiết bị Bluetooth'}
        </Button>
        
        {selectedDevice && (
          <Button 
            onClick={measureBloodPressure}
            disabled={isMeasuring}
            className="bg-green-600 hover:bg-green-700"
          >
            {isMeasuring ? '⏳ Đang đo...' : '📊 Đo huyết áp'}
          </Button>
        )}
      </div>

      {/* Status Message */}
      {status && (
        <Alert className="bg-blue-50 border-blue-200">
          <AlertDescription>{status}</AlertDescription>
        </Alert>
      )}

      {/* Error Message */}
      {error && (
        <Alert className="bg-red-50 border-red-200">
          <AlertDescription className="text-red-800">{error}</AlertDescription>
        </Alert>
      )}

      {/* Device List */}
      {devices.length > 0 && (
        <div className="space-y-2">
          <div className="text-sm font-medium">📱 Thiết bị tìm thấy:</div>
          <div className="grid gap-2">
            {devices.map((device) => (
              <div
                key={device.address}
                onClick={() => selectDevice(device.address)}
                className={`
                  p-3 border rounded-lg cursor-pointer transition-all
                  ${selectedDevice === device.address 
                    ? 'border-blue-500 bg-blue-50' 
                    : 'border-gray-200 hover:border-blue-300 hover:bg-gray-50'}
                `}
              >
                <div className="flex items-center justify-between">
                  <div>
                    <div className="font-medium">
                      {device.is_omron && '🩺 '}
                      {device.name}
                    </div>
                    <div className="text-xs text-gray-600">{device.address}</div>
                  </div>
                  <div className="text-xs text-gray-500">
                    RSSI: {device.rssi} dBm
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
