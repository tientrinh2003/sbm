import Sidebar from '@/components/Sidebar';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/db';
import { redirect } from 'next/navigation';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import MeasurementCard from '@/components/MeasurementCard';

export default async function PatientDashboard() {
  const session = await getServerSession(authOptions);
  const role = (session as any)?.role;
  
  if (!session) redirect('/login');
  if (role !== 'PATIENT') redirect('/forbidden');

  const user = await prisma.user.findUnique({
    where: { email: session.user?.email || '' }
  });

  const latest = user ? await prisma.measurement.findFirst({
    where: { userId: user.id },
    orderBy: { takenAt: 'desc' }
  }) : null;

  const count = user ? await prisma.measurement.count({
    where: { userId: user.id }
  }) : 0;

  const recentMeasurements = user ? await prisma.measurement.findMany({
    where: { userId: user.id },
    orderBy: { takenAt: 'desc' },
    take: 5
  }) : [];

  return (
    <div className="grid gap-6 md:grid-cols-[16rem_1fr]">
      <Sidebar role="PATIENT" />
      <div className="space-y-6">
        {/* Welcome Section */}
        <div className="card">
          <h1 className="text-xl font-semibold text-gray-900">
            Chào mừng, {user?.name || session.user?.name}
          </h1>
          <p className="text-gray-600 mt-1">
            Theo dõi và quản lý sức khỏe huyết áp của bạn
          </p>
        </div>

        {/* Quick Stats */}
        <div className="grid gap-4 md:grid-cols-3">
          <div className="card">
            <div className="text-sm text-gray-600">Tổng số lần đo</div>
            <div className="text-2xl font-bold text-blue-600">{count}</div>
          </div>
          
          <div className="card">
            <div className="text-sm text-gray-600">Lần đo gần nhất</div>
            {latest ? (
              <div className="space-y-1">
                <div className="text-lg font-semibold">
                  {latest.sys}/{latest.dia} mmHg
                </div>
                <div className="text-xs text-gray-500">
                  {new Date(latest.takenAt).toLocaleDateString('vi-VN')}
                </div>
              </div>
            ) : (
              <div className="text-gray-400">Chưa có dữ liệu</div>
            )}
          </div>

          <div className="card">
            <div className="text-sm text-gray-600">Trạng thái</div>
            {latest ? (
              <div className="text-lg font-semibold">
                {latest.sys >= 140 || latest.dia >= 90 ? (
                  <span className="text-red-600">Cao</span>
                ) : latest.sys >= 120 || latest.dia >= 80 ? (
                  <span className="text-yellow-600">Bình thường cao</span>
                ) : (
                  <span className="text-green-600">Bình thường</span>
                )}
              </div>
            ) : (
              <div className="text-gray-400">Chưa có dữ liệu</div>
            )}
          </div>
        </div>

        {/* Quick Actions */}
        <div className="card">
          <h2 className="text-lg font-semibold mb-4">Thao tác nhanh</h2>
          <div className="flex gap-3 flex-wrap">
            <Link href="/patient/monitoring">
              <Button className="bg-blue-600 hover:bg-blue-700">
                📊 Đo huyết áp ngay
              </Button>
            </Link>
            <Link href="/patient/history">
              <Button variant="outline">
                📈 Xem lịch sử
              </Button>
            </Link>
            <Button variant="outline">
              📋 Báo cáo sức khỏe
            </Button>
          </div>
        </div>

        {/* Recent Measurements */}
        {recentMeasurements.length > 0 && (
          <div className="card">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold">Kết quả gần đây</h2>
              <Link href="/patient/history">
                <Button variant="ghost" size="sm">
                  Xem tất cả →
                </Button>
              </Link>
            </div>
            <div className="space-y-3">
              {recentMeasurements.map((measurement) => (
                <div key={measurement.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <div>
                    <div className="font-semibold">
                      {measurement.sys}/{measurement.dia} mmHg
                    </div>
                    <div className="text-sm text-gray-600">
                      Nhịp tim: {measurement.pulse} bpm
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-sm text-gray-500">
                      {new Date(measurement.takenAt).toLocaleDateString('vi-VN')}
                    </div>
                    <div className="text-xs text-gray-400">
                      {measurement.method === 'BLUETOOTH' ? '📱 Bluetooth' : '✋ Thủ công'}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Health Tips */}
        <div className="card">
          <h2 className="text-lg font-semibold mb-3">💡 Lời khuyên sức khỏe</h2>
          <div className="space-y-2 text-sm text-gray-700">
            <div className="flex items-start gap-2">
              <span className="text-blue-500">•</span>
              <span>Đo huyết áp đều đặn vào cùng một thời điểm mỗi ngày</span>
            </div>
            <div className="flex items-start gap-2">
              <span className="text-blue-500">•</span>
              <span>Nghỉ ngơi 5 phút trước khi đo</span>
            </div>
            <div className="flex items-start gap-2">
              <span className="text-blue-500">•</span>
              <span>Tránh caffeine và hoạt động mạnh trước khi đo</span>
            </div>
            <div className="flex items-start gap-2">
              <span className="text-blue-500">•</span>
              <span>Ngồi thẳng, chân chạm đất khi đo</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}