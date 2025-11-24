import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const piHost = searchParams.get('host') || '192.168.22.70';
    
    const response = await fetch(`http://${piHost}:8000/api/bluetooth/scan`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
    });
    
    const data = await response.json();
    return NextResponse.json(data, { status: response.status });
  } catch (error) {
    console.error('Bluetooth scan proxy error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to scan devices', devices: [] },
      { status: 500 }
    );
  }
}
