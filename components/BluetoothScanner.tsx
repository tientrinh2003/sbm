'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import Card from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

interface BluetoothDevice {
    address: string;
    name: string;
    rssi: number;
    connectable: boolean;
}

export default function BluetoothScanner() {
    const [devices, setDevices] = useState<BluetoothDevice[]>([]);
    const [isScanning, setIsScanning] = useState(false);
    const [isConnecting, setIsConnecting] = useState(false);
    const [selectedDevice, setSelectedDevice] = useState<string>('');
    const [raspberryPiIP, setRaspberryPiIP] = useState('192.168.1.100'); // Default IP
    const [error, setError] = useState<string>('');
    const [success, setSuccess] = useState<string>('');

    const scanDevices = async () => {
        setIsScanning(true);
        setError('');
        setDevices([]);

        try {
            const response = await fetch('/api/bluetooth/scan', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    raspberryPiIP: raspberryPiIP
                })
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.error || 'Failed to scan devices');
            }

            setDevices(data.devices || []);
            setSuccess(`Found ${data.devices?.length || 0} Bluetooth devices`);

        } catch (err) {
            setError(err instanceof Error ? err.message : 'Failed to scan devices');
            console.error('Scan error:', err);
        } finally {
            setIsScanning(false);
        }
    };

    const connectToDevice = async (device: BluetoothDevice) => {
        setIsConnecting(true);
        setError('');
        setSuccess('');

        try {
            const response = await fetch('/api/bluetooth/set-device', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    deviceAddress: device.address,
                    deviceName: device.name,
                    raspberryPiIP: raspberryPiIP
                })
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.error || 'Failed to set device');
            }

            setSelectedDevice(device.address);
            setSuccess(`Successfully set device: ${device.name} (${device.address})`);

        } catch (err) {
            setError(err instanceof Error ? err.message : 'Failed to connect to device');
            console.error('Connect error:', err);
        } finally {
            setIsConnecting(false);
        }
    };

    const getSignalStrength = (rssi: number) => {
        if (rssi >= -50) return { strength: 'Excellent', color: 'text-green-600', bars: 4 };
        if (rssi >= -60) return { strength: 'Good', color: 'text-blue-600', bars: 3 };
        if (rssi >= -70) return { strength: 'Fair', color: 'text-yellow-600', bars: 2 };
        return { strength: 'Weak', color: 'text-red-600', bars: 1 };
    };

    return (
        <div className="max-w-4xl mx-auto p-6 space-y-6">
            <div className="text-center">
                <h1 className="text-3xl font-bold text-gray-900 mb-2">
                    🔵 Bluetooth Device Scanner
                </h1>
                <p className="text-gray-600">
                    Scan and connect to blood pressure monitoring devices
                </p>
            </div>

            {/* Raspberry Pi IP Configuration */}
            <Card className="p-4">
                <div className="space-y-4">
                    <Label htmlFor="pi-ip" className="text-sm font-medium">
                        Raspberry Pi IP Address
                    </Label>
                    <div className="flex gap-4">
                        <Input
                            id="pi-ip"
                            type="text"
                            value={raspberryPiIP}
                            onChange={(e) => setRaspberryPiIP(e.target.value)}
                            placeholder="192.168.1.100"
                            className="flex-1"
                        />
                        <Button 
                            onClick={scanDevices}
                            disabled={isScanning || !raspberryPiIP}
                            className="min-w-[120px]"
                        >
                            {isScanning ? (
                                <>
                                    <span className="animate-spin mr-2">🔄</span>
                                    Scanning...
                                </>
                            ) : (
                                <>
                                    📡 Scan Devices
                                </>
                            )}
                        </Button>
                    </div>
                </div>
            </Card>

            {/* Error/Success Messages */}
            {error && (
                <Card className="p-4 border-red-200 bg-red-50">
                    <div className="flex items-center gap-2 text-red-800">
                        <span>❌</span>
                        <span className="font-medium">Error:</span>
                        <span>{error}</span>
                    </div>
                </Card>
            )}

            {success && (
                <Card className="p-4 border-green-200 bg-green-50">
                    <div className="flex items-center gap-2 text-green-800">
                        <span>✅</span>
                        <span className="font-medium">Success:</span>
                        <span>{success}</span>
                    </div>
                </Card>
            )}

            {/* Device List */}
            {devices.length > 0 && (
                <div className="space-y-4">
                    <h2 className="text-xl font-semibold text-gray-900">
                        Found Devices ({devices.length})
                    </h2>
                    
                    <div className="grid gap-4">
                        {devices.map((device, index) => {
                            const signal = getSignalStrength(device.rssi);
                            const isSelected = selectedDevice === device.address;
                            
                            return (
                                <Card 
                                    key={index} 
                                    className={`p-4 transition-all duration-200 ${
                                        isSelected 
                                            ? 'border-blue-500 bg-blue-50 shadow-md' 
                                            : 'hover:shadow-md'
                                    }`}
                                >
                                    <div className="flex items-center justify-between">
                                        <div className="flex-1 space-y-2">
                                            <div className="flex items-center gap-3">
                                                <span className="text-2xl">
                                                    {device.name.toLowerCase().includes('blood') || 
                                                     device.name.toLowerCase().includes('omron') || 
                                                     device.name.toLowerCase().includes('bp') 
                                                        ? '🩺' : '📱'}
                                                </span>
                                                <div>
                                                    <h3 className="font-semibold text-gray-900">
                                                        {device.name || 'Unknown Device'}
                                                    </h3>
                                                    <p className="text-sm text-gray-600 font-mono">
                                                        {device.address}
                                                    </p>
                                                </div>
                                            </div>
                                            
                                            <div className="flex items-center gap-4 text-sm">
                                                <div className={`flex items-center gap-1 ${signal.color}`}>
                                                    <span>📶</span>
                                                    <span>{signal.strength}</span>
                                                    <span className="text-gray-500">({device.rssi} dBm)</span>
                                                </div>
                                                
                                                <div className={`flex items-center gap-1 ${
                                                    device.connectable ? 'text-green-600' : 'text-gray-500'
                                                }`}>
                                                    <span>{device.connectable ? '🟢' : '🔴'}</span>
                                                    <span>{device.connectable ? 'Connectable' : 'Not Connectable'}</span>
                                                </div>
                                            </div>
                                        </div>

                                        <div className="flex items-center gap-2">
                                            {isSelected && (
                                                <span className="text-blue-600 font-medium text-sm">
                                                    ✅ Selected
                                                </span>
                                            )}
                                            
                                            <Button
                                                onClick={() => connectToDevice(device)}
                                                disabled={isConnecting || !device.connectable}
                                                variant={isSelected ? "outline" : "default"}
                                                size="sm"
                                            >
                                                {isConnecting ? (
                                                    <>
                                                        <span className="animate-spin mr-1">⚙️</span>
                                                        Connecting...
                                                    </>
                                                ) : isSelected ? (
                                                    'Selected'
                                                ) : (
                                                    'Select Device'
                                                )}
                                            </Button>
                                        </div>
                                    </div>
                                </Card>
                            );
                        })}
                    </div>
                </div>
            )}

            {/* Instructions */}
            <Card className="p-4 bg-blue-50 border-blue-200">
                <div className="space-y-2">
                    <h3 className="font-semibold text-blue-900 flex items-center gap-2">
                        <span>💡</span>
                        Instructions
                    </h3>
                    <ul className="text-sm text-blue-800 space-y-1">
                        <li>• Make sure your Raspberry Pi is connected to the same network</li>
                        <li>• Ensure the HTTP server is running on Raspberry Pi (port 8000)</li>
                        <li>• Turn on your blood pressure device and make it discoverable</li>
                        <li>• Click "Scan Devices" to find nearby Bluetooth devices</li>
                        <li>• Select your blood pressure monitor from the list</li>
                    </ul>
                </div>
            </Card>
        </div>
    );
}