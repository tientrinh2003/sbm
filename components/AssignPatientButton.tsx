"use client";
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';

export default function AssignPatientButton({ patientId }: { patientId: string }) {
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleAssign = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!confirm('Xác nhận nhận bệnh nhân này?')) return;
    setLoading(true);
    try {
      const body = new URLSearchParams();
      body.append('patientId', patientId);

      const res = await fetch('/api/assignments/create', {
        method: 'POST',
        body,
      });

      if (res.ok) {
        // If the server redirected, follow it; otherwise refresh
        if (res.redirected) {
          router.push(res.url);
        } else {
          router.refresh();
        }
      } else {
        let data;
        try { data = await res.json(); } catch (_) { data = null; }
        alert(data?.error || 'Lỗi khi nhận bệnh nhân');
      }
    } catch (err) {
      console.error('Assign error', err);
      alert('Không thể kết nối đến server');
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleAssign}>
      <Button type="submit" size="sm" className="bg-green-600 hover:bg-green-700" disabled={loading}>
        {loading ? '⏳ Đang xử lý...' : '✅ Nhận bệnh nhân'}
      </Button>
    </form>
  );
}
