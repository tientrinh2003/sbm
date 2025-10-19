// Mock Measurement Start API
import { NextRequest, NextResponse } from 'next/server';

export async function POST(req: NextRequest) {
  const body = await req.json();
  const { device_address, device_name, user_id, ai_enabled } = body;
  
  if (!device_address || !user_id) {
    return NextResponse.json({
      success: false,
      message: "Missing required parameters"
    }, { status: 400 });
  }

  // Generate mock session
  const session = {
    session_id: `session_${Date.now()}`,
    device_address,
    device_name,
    user_id,
    start_time: new Date().toISOString(),
    is_active: true,
    camera_streaming: ai_enabled,
    ai_enabled
  };

  return NextResponse.json({
    success: true,
    message: "Measurement session started",
    data: {
      session,
      camera_stream_url: ai_enabled ? "http://192.168.22.70:8000/api/camera/stream" : null
    }
  });
}