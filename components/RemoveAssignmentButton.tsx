"use client";
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';

export default function RemoveAssignmentButton({ assignmentId }: { assignmentId: string }) {
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleRemove = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!confirm('Bạn có chắc muốn hủy phân công bệnh nhân này?')) return;
    setLoading(true);
    try {
      const body = new URLSearchParams();
      body.append('assignmentId', assignmentId);

      const res = await fetch('/api/assignments/remove', {
        method: 'POST',
        body,
      });

      if (res.ok) {
        if (res.redirected) {
          router.push(res.url);
        } else {
          router.refresh();
        }
      } else {
        let data;
        try { data = await res.json(); } catch (_) { data = null; }
        alert(data?.error || 'Lỗi khi hủy phân công');
      }
    } catch (err) {
      console.error('Remove assignment error', err);
      alert('Không thể kết nối đến server');
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleRemove}>
      <Button
        type="submit"
        size="sm"
        variant="outline"
        className="text-red-600 hover:bg-red-50"
        disabled={loading}
      >
        {loading ? '⏳...' : '❌ Hủy'}
      </Button>
    </form>
  );
}
