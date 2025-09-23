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

        const body = await request.json();
        const { deviceAddress, deviceName, raspberryPiIP } = body;

        // Validation
        if (!deviceAddress || !raspberryPiIP) {
            return Response.json({ 
                error: 'Device address and Raspberry Pi IP are required' 
            }, { status: 400 });
        }

        // Gửi device address đến Raspberry Pi
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 10000);

        const response = await fetch(`http://${raspberryPiIP}:8000/set-device`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                device_address: deviceAddress,
                device_name: deviceName || 'Unknown Device'
            }),
            signal: controller.signal,
        });

        clearTimeout(timeoutId);

        if (!response.ok) {
            throw new Error(`Raspberry Pi responded with status: ${response.status}`);
        }

        const result = await response.json();

        return Response.json({
            success: true,
            message: `Device ${deviceAddress} set successfully on Raspberry Pi`,
            result: result
        });

    } catch (error) {
        console.error('Set device error:', error);
        return Response.json({
            error: 'Failed to set device on Raspberry Pi',
            details: error instanceof Error ? error.message : 'Unknown error'
        }, { status: 500 });
    }
}