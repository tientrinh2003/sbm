import { NextRequest, NextResponse } from 'next/server';

// Increase timeout for blood pressure measurement (can take up to 2 minutes)
export const maxDuration = 150; // 150 seconds

export async function POST(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const piHost = searchParams.get('host') || '192.168.22.70';
    const body = await request.json();
    
    // Create AbortController for 140s timeout (leave 10s buffer)
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 140000);
    
    try {
      const response = await fetch(`http://${piHost}:8000/api/bluetooth/measure`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
        signal: controller.signal,
      });
      
      clearTimeout(timeoutId);
    
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: 'Unknown error' }));
        return NextResponse.json(
          { success: false, error: errorData.error || `HTTP ${response.status}` },
          { status: response.status }
        );
      }
      
      const data = await response.json();
      return NextResponse.json(data);
    } catch (fetchError: any) {
      clearTimeout(timeoutId);
      
      if (fetchError.name === 'AbortError') {
        console.error('Bluetooth measurement timeout after 140s');
        return NextResponse.json(
          { success: false, error: 'Đo huyết áp quá lâu (>2 phút). Vui lòng kiểm tra thiết bị và thử lại.' },
          { status: 408 }
        );
      }
      throw fetchError;
    }
  } catch (error: any) {
    console.error('Bluetooth measure proxy error:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Không thể đo huyết áp. Vui lòng kiểm tra kết nối Raspberry Pi.' },
      { status: 500 }
    );
  }
}
