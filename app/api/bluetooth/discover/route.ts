// Mock Pi Enhanced API for Development
import { NextRequest, NextResponse } from 'next/server';

export async function POST(req: NextRequest) {
  await new Promise(resolve => setTimeout(resolve, 2000)); // Simulate scan time
  
  // Mock discovered devices
  const mockDevices = [
    {
      address: "AA:BB:CC:DD:EE:FF",
      name: "OMRON HEM-7120", 
      rssi: -45,
      is_omron: true,
      services: ["blood_pressure"]
    },
    {
      address: "11:22:33:44:55:66",
      name: "OMRON Connect",
      rssi: -62,
      is_omron: true, 
      services: ["blood_pressure", "heart_rate"]
    },
    {
      address: "FF:EE:DD:CC:BB:AA",
      name: "Generic BLE Device",
      rssi: -78,
      is_omron: false,
      services: ["generic"]
    }
  ];

  return NextResponse.json({
    success: true,
    message: "Bluetooth scan completed",
    data: {
      devices: mockDevices,
      scan_duration: 2.0,
      total_found: mockDevices.length
    }
  });
}