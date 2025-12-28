"use client";
import { useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import Sidebar from '@/components/Sidebar';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import Link from 'next/link';

export default function AddClinicalNotePage() {
  const router = useRouter();
  const params = useParams();
  const id = params?.id as string;
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  
  const [formData, setFormData] = useState({
    noteType: 'ROUTINE_CHECKUP',
    content: '',
    recommendations: '',
    followUpDate: ''
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const response = await fetch('/api/clinical-notes/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          patientId: id,
          ...formData,
          followUpDate: formData.followUpDate ? new Date(formData.followUpDate).toISOString() : null
        })
      });

      if (response.ok) {
        router.push(`/doctor/patients/${id}`);
      } else {
        const data = await response.json();
        setError(data.error || 'Lỗi khi lưu ghi chú');
      }
    } catch (err) {
      setError('Không thể kết nối server');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="grid gap-6 md:grid-cols-[16rem_1fr]">
      <Sidebar role="DOCTOR" />
      <div className="space-y-6">
        {/* Header */}
        <div className="card">
          <h1 className="text-xl font-semibold">📝 Thêm ghi chú lâm sàng</h1>
          <p className="text-gray-600 mt-1">
            Ghi chú đánh giá và khuyến nghị cho bệnh nhân
          </p>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="card space-y-6">
          {error && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-red-800">
              {error}
            </div>
          )}

          <div className="space-y-2">
            <Label htmlFor="noteType">Loại ghi chú *</Label>
            <select
              id="noteType"
              required
              value={formData.noteType}
              onChange={(e) => setFormData({...formData, noteType: e.target.value})}
              className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="ROUTINE_CHECKUP">Kiểm tra định kỳ</option>
              <option value="EMERGENCY">Khẩn cấp</option>
              <option value="CONSULTATION">Tư vấn</option>
              <option value="FOLLOW_UP">Theo dõi sau điều trị</option>
              <option value="DIAGNOSIS">Chẩn đoán</option>
              <option value="TREATMENT_PLAN">Kế hoạch điều trị</option>
              <option value="MEDICATION_REVIEW">Xem xét thuốc</option>
            </select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="content">Nội dung ghi chú *</Label>
            <textarea
              id="content"
              required
              value={formData.content}
              onChange={(e) => setFormData({...formData, content: e.target.value})}
              rows={8}
              placeholder="Ghi chú đánh giá tình trạng bệnh nhân, triệu chứng, dấu hiệu quan sát được..."
              className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 resize-vertical"
            />
            <p className="text-sm text-gray-500">
              Ghi chú chi tiết về tình trạng sức khỏe, triệu chứng, và đánh giá lâm sàng
            </p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="recommendations">Khuyến nghị điều trị</Label>
            <textarea
              id="recommendations"
              value={formData.recommendations}
              onChange={(e) => setFormData({...formData, recommendations: e.target.value})}
              rows={5}
              placeholder="Khuyến nghị về chế độ ăn uống, tập luyện, thuốc men, thay đổi lối sống..."
              className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 resize-vertical"
            />
            <p className="text-sm text-gray-500">
              Khuyến nghị về điều trị, chế độ ăn uống, tập luyện, và theo dõi
            </p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="followUpDate">Ngày hẹn tái khám</Label>
            <Input
              id="followUpDate"
              type="date"
              value={formData.followUpDate}
              onChange={(e) => setFormData({...formData, followUpDate: e.target.value})}
              className="max-w-xs"
            />
            <p className="text-sm text-gray-500">
              Ngày hẹn bệnh nhân quay lại khám hoặc theo dõi
            </p>
          </div>

          <div className="flex gap-3 pt-4 border-t">
            <Button
              type="submit"
              disabled={loading}
              className="bg-blue-600 hover:bg-blue-700"
            >
              {loading ? '⏳ Đang lưu...' : '💾 Lưu ghi chú'}
            </Button>
            <Link href={`/doctor/patients/${id}`}>
              <Button type="button" variant="outline">
                Hủy
              </Button>
            </Link>
          </div>
        </form>

        {/* Guidelines */}
        <div className="card bg-blue-50 border-blue-200">
          <h3 className="font-semibold text-blue-900 mb-3">💡 Hướng dẫn ghi chú lâm sàng</h3>
          <ul className="space-y-2 text-sm text-blue-800">
            <li>✓ Ghi chú rõ ràng, chi tiết các quan sát và đánh giá</li>
            <li>✓ Sử dụng thuật ngữ y khoa chính xác</li>
            <li>✓ Ghi nhận các thay đổi so với lần khám trước</li>
            <li>✓ Đưa ra khuyến nghị cụ thể, có thể thực hiện</li>
            <li>✓ Ghi chú về thuốc đang dùng và tác dụng phụ (nếu có)</li>
            <li>✓ Xác định ngày tái khám để theo dõi tiến triển</li>
          </ul>
        </div>
      </div>
    </div>
  );
}
