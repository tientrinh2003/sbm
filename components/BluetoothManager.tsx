'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';

interface BluetoothDevice {
  address: string;
  name: string;
  rssi: number;
  is_omron: boolean;
}

interface BluetoothManagerProps {
  onDeviceConnected?: (address: string) => void;
  onStatusUpdate?: (status: string) => void;
}

export default function BluetoothManager({ onDeviceConnected, onStatusUpdate }: BluetoothManagerProps) {
  const [devices, setDevices] = useState<BluetoothDevice[]>([]);
  const [isScanning, setIsScanning] = useState(false);
  const [connectionStatus, setConnectionStatus] = useState<'disconnected' | 'connecting' | 'connected'>('disconnected');
  const [selectedDevice, setSelectedDevice] = useState<string>('');

  const updateStatus = (message: string) => {
    onStatusUpdate?.(message);
  };

  const scanDevices = async () => {
    setIsScanning(true);
    updateStatus('Đang quét thiết bị Bluetooth...');
    
    try {
      // Try to scan via Raspberry Pi server (thay localhost bằng IP thật)
      const PI_IP = '192.168.1.100'; // Thay bằng IP thật của Pi
      const response = await fetch(`http://${PI_IP}:8000/scan-bluetooth`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ scan_time: 10 })
      });
      if (response.ok) {
        const data = await response.json();
        setDevices(data.devices || []);
        updateStatus(`Tìm thấy ${data.devices?.length || 0} thiết bị`);
      } else {
        throw new Error('Server unavailable');
      }
    } catch (error) {
      console.error('Scan error:', error);
      updateStatus('Lỗi quét thiết bị - sử dụng dữ liệu demo');
      
      // Fallback: Demo devices
      const demoDevices: BluetoothDevice[] = [
        {
          address: '00:5F:BF:3A:51:BD',
          name: 'OMRON HEM-7156T-E',
          rssi: -45,
          is_omron: true
        },
        {
          address: '12:34:56:78:9A:BC',
          name: 'Generic BP Monitor',
          rssi: -62,
          is_omron: false
        },
        {
          address: 'AA:BB:CC:DD:EE:FF',
          name: 'HealthDevice Pro',
          rssi: -78,
          is_omron: false
        }
      ];
      setDevices(demoDevices);
      updateStatus(`Demo: Tìm thấy ${demoDevices.length} thiết bị`);
    } finally {
      setIsScanning(false);
    }
  };

  const connectToDevice = async (deviceAddress: string) => {
    setConnectionStatus('connecting');
    updateStatus(`Đang kết nối với ${deviceAddress}...`);
    
    try {
      const response = await fetch(`http://localhost:8000/connect`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ address: deviceAddress })
      });
      
      if (response.ok) {
        setConnectionStatus('connected');
        setSelectedDevice(deviceAddress);
        updateStatus('Kết nối thành công! Sẵn sàng đo huyết áp.');
        onDeviceConnected?.(deviceAddress);
      } else {
        throw new Error('Connection failed');
      }
    } catch (error) {
      console.error('Connection error:', error);
      setConnectionStatus('disconnected');
      updateStatus('Lỗi kết nối thiết bị');
    }
  };

  const disconnectDevice = async () => {
    try {
      await fetch(`http://localhost:8000/disconnect`, { method: 'POST' });
      setConnectionStatus('disconnected');
      setSelectedDevice('');
      updateStatus('Đã ngắt kết nối thiết bị');
      onDeviceConnected?.('');
    } catch (error) {
      console.error('Disconnect error:', error);
      updateStatus('Lỗi ngắt kết nối');
    }
  };

  return (
    <div className="space-y-4">
      {/* Connection Status */}
      <div className="flex items-center justify-between">
        <div className="text-sm font-medium">🔵 Thiết bị Bluetooth</div>
        <div className="flex items-center gap-2">
          <div className={`w-2 h-2 rounded-full ${
            connectionStatus === 'connected' ? 'bg-green-500' : 
            connectionStatus === 'connecting' ? 'bg-yellow-500' : 'bg-gray-400'
          }`} />
          <span className="text-xs text-gray-600">
            {connectionStatus === 'connected' ? 'Đã kết nối' : 
             connectionStatus === 'connecting' ? 'Đang kết nối' : 'Chưa kết nối'}
          </span>
        </div>
      </div>

      {/* Control Buttons */}
      <div className="flex items-center gap-2">
        <Button
          onClick={scanDevices}
          disabled={isScanning}
          variant="outline"
          size="sm"
        >
          {isScanning ? '🔄 Đang quét...' : '🔍 Quét thiết bị'}
        </Button>
        
        {connectionStatus === 'connected' && (
          <Button
            onClick={disconnectDevice}
            variant="outline"
            size="sm"
            className="text-red-600 border-red-300 hover:bg-red-50"
          >
            🔌 Ngắt kết nối
          </Button>
        )}
      </div>

      {/* Device List */}
      {devices.length > 0 && (
        <div className="bg-gray-50 rounded-lg p-3 space-y-2">
          <div className="text-xs font-medium text-gray-700 mb-2">
            Thiết bị tìm thấy ({devices.length}):
          </div>
          {devices.map((device) => (
            <div
              key={device.address}
              className={`flex items-center justify-between p-2 rounded border cursor-pointer transition-colors ${
                selectedDevice === device.address
                  ? 'bg-blue-100 border-blue-300'
                  : 'bg-white border-gray-200 hover:bg-gray-50'
              }`}
              onClick={() => connectToDevice(device.address)}
            >
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <span className="text-sm font-medium">{device.name}</span>
                  {device.is_omron && (
                    <span className="text-xs bg-green-100 text-green-700 px-1 rounded">
                      OMRON
                    </span>
                  )}
                </div>
                <div className="text-xs text-gray-500">
                  {device.address} • Tín hiệu: {device.rssi}dBm
                </div>
              </div>
              {selectedDevice === device.address && connectionStatus === 'connected' && (
                <span className="text-green-600 text-sm">✅</span>
              )}
            </div>
          ))}
        </div>
      )}

      {/* No devices found message */}
      {!isScanning && devices.length === 0 && (
        <div className="text-center text-gray-500 text-sm py-4 bg-gray-50 rounded-lg">
          Chưa tìm thấy thiết bị nào. Nhấn "Quét thiết bị" để bắt đầu.
        </div>
      )}

      {/* Connection info */}
      {connectionStatus === 'connected' && selectedDevice && (
        <div className="bg-green-50 border border-green-200 rounded-lg p-3">
          <div className="text-sm text-green-800">
            ✅ <strong>Đã kết nối:</strong> {devices.find(d => d.address === selectedDevice)?.name || selectedDevice}
          </div>
        </div>
      )}
    </div>
  );
}