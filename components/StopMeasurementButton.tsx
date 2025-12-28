'use client';
import { useState } from 'react';
import { Button } from '@/components/ui/button';

interface StopMeasurementButtonProps {
  piHost: string;
  deviceAddress?: string;
  onStopped?: () => void;
}

export default function StopMeasurementButton({ 
  piHost, 
  deviceAddress,
  onStopped 
}: StopMeasurementButtonProps) {
  const [stopping, setStopping] = useState(false);

  async function handleStop() {
    if (!confirm('Bạn có chắc muốn dừng đo huyết áp đang chạy?')) {
      return;
    }

    setStopping(true);
    try {
      // Call stop API on Pi
      const response = await fetch(`http://${piHost}:8000/api/bluetooth/measure/stop`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          device_address: deviceAddress || 'all' 
        })
      });

      if (response.ok) {
        const result = await response.json();
        alert(`✅ Đã dừng đo: ${result.status}`);
        onStopped?.();
      } else {
        const error = await response.json();
        alert(`❌ Lỗi dừng đo: ${error.error || 'Unknown error'}`);
      }
    } catch (error) {
      console.error('Stop measurement error:', error);
      alert('❌ Không thể kết nối tới Pi để dừng đo');
    } finally {
      setStopping(false);
    }
  }

  return (
    <Button
      onClick={handleStop}
      disabled={stopping}
      className="bg-red-600 hover:bg-red-700 text-white"
    >
      {stopping ? '⏳ Đang dừng...' : '🛑 Dừng đo'}
    </Button>
  );
}
