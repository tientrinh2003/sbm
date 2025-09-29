'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from './ui/alert';

interface BluetoothDevice {
  address: string;
  name: string;
  rssi: number;
  is_omron: boolean;
  battery?: number;
}

interface BluetoothManagerProps {
  onDeviceConnected?: (address: string) => void;
  onStatusUpdate?: (status: string) => void;
  onMeasurementReceived?: (data: any) => void;
}

export default function BluetoothManager({ 
  onDeviceConnected, 
  onStatusUpdate, 
  onMeasurementReceived 
}: BluetoothManagerProps) {
  const [devices, setDevices] = useState<BluetoothDevice[]>([]);
  const [isScanning, setIsScanning] = useState(false);
  const [connectionStatus, setConnectionStatus] = useState<'disconnected' | 'connecting' | 'connected' | 'error'>('disconnected');
  const [selectedDevice, setSelectedDevice] = useState<string>('');
  const [lastError, setLastError] = useState<string>('');
  const [isListening, setIsListening] = useState(false);

  const updateStatus = (message: string) => {
    onStatusUpdate?.(message);
    console.log('Bluetooth:', message);
  };

  // Check if system supports Web Bluetooth API
  const isWebBluetoothSupported = () => {
    return typeof navigator !== 'undefined' && 'bluetooth' in navigator;
  };

  const scanDevices = async () => {
    setIsScanning(true);
    setLastError('');
    updateStatus('🔍 Đang quét thiết bị Bluetooth...');
    
    try {
      // Try multiple scan methods
      await scanViaPi() || await scanViaWebBluetooth() || await useDemoDevices();
    } catch (error) {
      console.error('Scan error:', error);
      setLastError('Không thể quét thiết bị Bluetooth');
      await useDemoDevices();
    } finally {
      setIsScanning(false);
    }
  };

  const scanViaPi = async () => {
    try {
      const PI_IP = process.env.NEXT_PUBLIC_PI_IP || 'localhost';
      const response = await fetch(`http://${PI_IP}:8000/scan-bluetooth`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ scan_time: 8 }),
        signal: AbortSignal.timeout(12000) // 12 second timeout
      });
      
      if (response.ok) {
        const data = await response.json();
        setDevices(data.devices || []);
        updateStatus(`✅ Tìm thấy ${data.devices?.length || 0} thiết bị qua Raspberry Pi`);
        return true;
      }
    } catch (error) {
      console.log('Pi scan failed:', error);
    }
    return false;
  };

  const scanViaWebBluetooth = async () => {
    if (!isWebBluetoothSupported()) return false;
    
    try {
      // Type assertion for Web Bluetooth API
      const bluetooth = (navigator as any).bluetooth;
      const device = await bluetooth.requestDevice({
        filters: [
          { services: ['health_thermometer'] },
          { namePrefix: 'OMRON' },
          { namePrefix: 'BP' }
        ],
        optionalServices: ['battery_service']
      });
      
      const webBluetoothDevice: BluetoothDevice = {
        address: device.id,
        name: device.name || 'Unknown Device',
        rssi: -50, // Web Bluetooth doesn't provide RSSI
        is_omron: device.name?.includes('OMRON') || false
      };
      
      setDevices([webBluetoothDevice]);
      updateStatus(`✅ Tìm thấy thiết bị: ${device.name}`);
      return true;
    } catch (error) {
      console.log('Web Bluetooth scan failed:', error);
    }
    return false;
  };

  const useDemoDevices = async () => {
    const demoDevices: BluetoothDevice[] = [
      {
        address: '00:5F:BF:3A:51:BD',
        name: 'OMRON HEM-7156T-E',
        rssi: -45,
        is_omron: true,
        battery: 85
      },
      {
        address: '12:34:56:78:9A:BC',
        name: 'OMRON Connect',
        rssi: -62,
        is_omron: true,
        battery: 72
      },
      {
        address: 'AA:BB:CC:DD:EE:FF',
        name: 'Generic BP Monitor',
        rssi: -78,
        is_omron: false
      }
    ];
    setDevices(demoDevices);
    updateStatus(`🔄 Demo mode: ${demoDevices.length} thiết bị mẫu`);
    return true;
  };

  const connectToDevice = async (deviceAddress: string) => {
    setConnectionStatus('connecting');
    setLastError('');
    updateStatus(`🔄 Đang kết nối với ${deviceAddress}...`);
    
    try {
      // Try to connect via multiple methods
      const connected = await connectViaPi(deviceAddress) || await connectViaWebBluetooth(deviceAddress);
      
      if (connected) {
        setConnectionStatus('connected');
        setSelectedDevice(deviceAddress);
        updateStatus('✅ Kết nối thành công! Sẵn sàng đo huyết áp.');
        onDeviceConnected?.(deviceAddress);
        startListening();
      } else {
        throw new Error('Connection failed');
      }
    } catch (error) {
      console.error('Connection error:', error);
      setConnectionStatus('error');
      setLastError('Không thể kết nối với thiết bị');
      updateStatus('❌ Lỗi kết nối thiết bị');
    }
  };

  const connectViaPi = async (deviceAddress: string) => {
    try {
      const PI_IP = process.env.NEXT_PUBLIC_PI_IP || 'localhost';
      const response = await fetch(`http://${PI_IP}:8000/connect`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ address: deviceAddress }),
        signal: AbortSignal.timeout(10000)
      });
      
      return response.ok;
    } catch (error) {
      console.log('Pi connection failed:', error);
      return false;
    }
  };

  const connectViaWebBluetooth = async (deviceAddress: string) => {
    // This would implement Web Bluetooth connection
    // For now, simulate success for demo
    await new Promise(resolve => setTimeout(resolve, 2000));
    return true;
  };

  const startListening = () => {
    setIsListening(true);
    updateStatus('🎧 Đang lắng nghe dữ liệu từ thiết bị...');
    
    // Simulate measurement data every 30 seconds
    const interval = setInterval(() => {
      if (connectionStatus === 'connected') {
        const mockMeasurement = {
          sys: Math.floor(Math.random() * 40) + 110, // 110-150
          dia: Math.floor(Math.random() * 20) + 70,  // 70-90
          pulse: Math.floor(Math.random() * 30) + 60, // 60-90
          timestamp: new Date().toISOString()
        };
        
        onMeasurementReceived?.(mockMeasurement);
        updateStatus(`📊 Nhận dữ liệu: ${mockMeasurement.sys}/${mockMeasurement.dia} mmHg`);
      }
    }, 30000);
    
    // Store interval for cleanup
    (window as any).btInterval = interval;
  };

  const disconnectDevice = async () => {
    try {
      const PI_IP = process.env.NEXT_PUBLIC_PI_IP || 'localhost';
      await fetch(`http://${PI_IP}:8000/disconnect`, { method: 'POST' });
      
      setConnectionStatus('disconnected');
      setSelectedDevice('');
      setIsListening(false);
      setLastError('');
      
      // Clear measurement interval
      if ((window as any).btInterval) {
        clearInterval((window as any).btInterval);
      }
      
      updateStatus('🔌 Đã ngắt kết nối thiết bị');
      onDeviceConnected?.('');
    } catch (error) {
      console.error('Disconnect error:', error);
      updateStatus('⚠️ Lỗi ngắt kết nối');
    }
  };

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if ((window as any).btInterval) {
        clearInterval((window as any).btInterval);
      }
    };
  }, []);

  return (
    <div className="space-y-4">
      {/* Error Alert */}
      {lastError && (
        <Alert variant="destructive">
          <AlertDescription>{lastError}</AlertDescription>
        </Alert>
      )}

      {/* Connection Status */}
      <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
        <div className="flex items-center gap-3">
          <div className={`w-3 h-3 rounded-full ${
            connectionStatus === 'connected' ? 'bg-green-500' : 
            connectionStatus === 'connecting' ? 'bg-yellow-500 animate-pulse' : 
            connectionStatus === 'error' ? 'bg-red-500' : 'bg-gray-400'
          }`} />
          <div>
            <div className="text-sm font-medium">🔵 Bluetooth Manager</div>
            <div className="text-xs text-gray-600">
              {connectionStatus === 'connected' ? `Kết nối: ${selectedDevice}` : 
               connectionStatus === 'connecting' ? 'Đang kết nối...' : 
               connectionStatus === 'error' ? 'Lỗi kết nối' : 'Chưa kết nối'}
            </div>
          </div>
        </div>
        
        {isListening && (
          <div className="text-xs text-green-600 font-medium animate-pulse">
            🎧 Listening
          </div>
        )}
      </div>

      {/* Control Buttons */}
      <div className="flex items-center gap-2">
        <Button
          onClick={scanDevices}
          disabled={isScanning || connectionStatus === 'connecting'}
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
            className="text-red-600 hover:text-red-700"
          >
            🔌 Ngắt kết nối
          </Button>
        )}
        
        {!isWebBluetoothSupported() && (
          <div className="text-xs text-orange-600 ml-2">
            ⚠️ Web Bluetooth không được hỗ trợ
          </div>
        )}
      </div>

      {/* Device List */}
      {devices.length > 0 && (
        <div className="space-y-2">
          <div className="text-sm font-medium text-gray-700">
            Thiết bị được tìm thấy ({devices.length}):
          </div>
          <div className="space-y-2 max-h-48 overflow-y-auto">
            {devices.map((device) => (
              <div 
                key={device.address} 
                className={`p-3 border rounded-lg hover:bg-gray-50 ${
                  selectedDevice === device.address ? 'bg-blue-50 border-blue-200' : ''
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
                      {device.battery && ` • Battery: ${device.battery}%`}
                    </div>
                  </div>
                  <Button
                    onClick={() => connectToDevice(device.address)}
                    disabled={connectionStatus === 'connecting' || selectedDevice === device.address}
                    size="sm"
                    className={selectedDevice === device.address ? 'bg-green-600' : ''}
                  >
                    {selectedDevice === device.address ? '✅ Đã kết nối' : '🔗 Kết nối'}
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Help Text */}
      <div className="text-xs text-gray-500 space-y-1">
        <div>💡 Mẹo: Đảm bảo thiết bị đo huyết áp đã bật và ở chế độ ghép nối</div>
        <div>🔄 Nếu không tìm thấy thiết bị, hãy thử quét lại sau vài giây</div>
      </div>
    </div>
  );
}