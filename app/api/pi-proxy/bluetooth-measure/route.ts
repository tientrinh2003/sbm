import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const piHost = searchParams.get('host') || '192.168.22.70';
    const body = await request.json();
    
    const response = await fetch(`http://${piHost}:8000/api/bluetooth/measure`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });
    
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({ error: 'Unknown error' }));
      return NextResponse.json(
        { success: false, error: errorData.error || `HTTP ${response.status}` },
        { status: response.status }
      );
    }
    
    const data = await response.json();
    return NextResponse.json(data);
  } catch (error: any) {
    console.error('Bluetooth measure proxy error:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to measure blood pressure' },
      { status: 500 }
    );
  }
}
