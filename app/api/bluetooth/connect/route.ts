// Mock Bluetooth Connect API
import { NextRequest, NextResponse } from 'next/server';

export async function POST(req: NextRequest) {
  const body = await req.json();
  const { device_address, device_name } = body;
  
  await new Promise(resolve => setTimeout(resolve, 1500)); // Simulate connection time
  
  if (!device_address || !device_name) {
    return NextResponse.json({
      success: false,
      message: "Missing device_address or device_name"
    }, { status: 400 });
  }

  // Simulate successful connection
  return NextResponse.json({
    success: true,
    message: `Connected to ${device_name}`,
    data: {
      device_address,
      device_name,
      connection_time: new Date().toISOString(),
      status: "connected"
    }
  });
}