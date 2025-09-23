import { NextRequest } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';

export async function POST(request: NextRequest) {
    try {
        // Kiểm tra authentication
        const session = await getServerSession(authOptions);
        if (!session?.user?.email) {
            return Response.json({ error: 'Unauthorized' }, { status: 401 });
        }

        // Lấy IP của Raspberry Pi từ request body
        const body = await request.json();
        const { raspberryPiIP } = body;

        if (!raspberryPiIP) {
            return Response.json({ 
                error: 'Raspberry Pi IP address is required' 
            }, { status: 400 });
        }

        // Gửi lệnh quét Bluetooth đến Raspberry Pi với timeout
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 30000);

        const scanResponse = await fetch(`http://${raspberryPiIP}:8000/scan-bluetooth`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            signal: controller.signal,
        });

        clearTimeout(timeoutId);

        if (!scanResponse.ok) {
            throw new Error(`Raspberry Pi responded with status: ${scanResponse.status}`);
        }

        const devices = await scanResponse.json();

        return Response.json({
            success: true,
            devices: devices,
            message: 'Bluetooth scan completed successfully'
        });

    } catch (error) {
        console.error('Bluetooth scan error:', error);
        return Response.json({
            error: 'Failed to scan Bluetooth devices',
            details: error instanceof Error ? error.message : 'Unknown error'
        }, { status: 500 });
    }
}