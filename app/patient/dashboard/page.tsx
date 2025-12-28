import Sidebar from '@/components/Sidebar';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/db';
import { redirect } from 'next/navigation';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import MeasurementCard from '@/components/MeasurementCard';
import ChartBP from '@/components/ChartBP';

// Force dynamic rendering to always fetch fresh data
export const dynamic = 'force-dynamic';
export const revalidate = 0;

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

  // Chart data for last 30 days
  const chartData = user ? await prisma.measurement.findMany({
    where: { 
      userId: user.id,
      takenAt: {
        gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) // 30 days
      }
    },
    orderBy: { takenAt: 'asc' }
  }) : [];

  // Calculate averages for the last 7 days
  const last7Days = user ? await prisma.measurement.findMany({
    where: { 
      userId: user.id,
      takenAt: {
        gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) // 7 days
      }
    }
  }) : [];

  const avg7Days = last7Days.length > 0 ? {
    sys: Math.round(last7Days.reduce((sum, m) => sum + m.sys, 0) / last7Days.length),
    dia: Math.round(last7Days.reduce((sum, m) => sum + m.dia, 0) / last7Days.length),
    pulse: Math.round(last7Days.reduce((sum, m) => sum + m.pulse, 0) / last7Days.length)
  } : null;

  // Risk assessment
  const getRiskLevel = (sys: number, dia: number) => {
    if (sys >= 180 || dia >= 110) return { level: 'Khẩn cấp', color: 'text-red-600', bgColor: 'bg-red-50' };
    if (sys >= 140 || dia >= 90) return { level: 'Cao', color: 'text-red-500', bgColor: 'bg-red-50' };
    if (sys >= 130 || dia >= 80) return { level: 'Giai đoạn 1', color: 'text-orange-500', bgColor: 'bg-orange-50' };
    if (sys >= 120) return { level: 'Tăng cao', color: 'text-yellow-600', bgColor: 'bg-yellow-50' };
    return { level: 'Bình thường', color: 'text-green-600', bgColor: 'bg-green-50' };
  };

  const currentRisk = latest ? getRiskLevel(latest.sys, latest.dia) : null;

  // Format chart data
  const formattedChartData = chartData.map(m => {
    const date = new Date(m.takenAt);
    return {
      takenAt: date.toLocaleString('vi-VN', { 
        day: 'numeric', 
        month: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      }),
      fullDate: date.toLocaleString('vi-VN', { 
        day: 'numeric', 
        month: 'numeric', 
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      }),
      sys: m.sys,
      dia: m.dia,
      pulse: m.pulse
    };
  });

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

        {/* Enhanced Stats */}
        <div className="grid gap-4 md:grid-cols-4">
          <div className="card">
            <div className="text-sm text-gray-600">Tổng số lần đo</div>
            <div className="text-2xl font-bold text-blue-600">{count}</div>
            <div className="text-xs text-gray-500 mt-1">
              {last7Days.length} lần trong 7 ngày qua
            </div>
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
            <div className="text-sm text-gray-600">Trung bình 7 ngày</div>
            {avg7Days ? (
              <div className="space-y-1">
                <div className="text-lg font-semibold">
                  {avg7Days.sys}/{avg7Days.dia} mmHg
                </div>
                <div className="text-xs text-gray-500">
                  Nhịp tim: {avg7Days.pulse} bpm
                </div>
              </div>
            ) : (
              <div className="text-gray-400">Chưa đủ dữ liệu</div>
            )}
          </div>

          <div className="card">
            <div className="text-sm text-gray-600">Mức độ nguy cơ</div>
            {currentRisk ? (
              <div className={`inline-block px-2 py-1 rounded-full text-sm font-semibold ${currentRisk.bgColor} ${currentRisk.color}`}>
                {currentRisk.level}
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
            <Link href="/patient/chat">
              <Button variant="outline">
                💬 Hỏi trợ lý AI
              </Button>
            </Link>
            <Button variant="outline">
              📋 Báo cáo sức khỏe
            </Button>
          </div>
        </div>

        {/* Blood Pressure Chart */}
        {formattedChartData.length > 0 && (
          <div className="card">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold">📈 Xu hướng huyết áp (30 ngày)</h2>
              <div className="text-sm text-gray-500">
                {formattedChartData.length} lần đo
              </div>
            </div>
            <ChartBP data={formattedChartData} />
            <div className="mt-3 grid grid-cols-3 gap-4 text-center text-sm">
              <div>
                <div className="text-red-500 font-semibold">● SYS</div>
                <div className="text-gray-600">Tâm thu</div>
              </div>
              <div>
                <div className="text-blue-500 font-semibold">● DIA</div>
                <div className="text-gray-600">Tâm trương</div>
              </div>
              <div>
                <div className="text-green-500 font-semibold">● Nhịp tim</div>
                <div className="text-gray-600">Nhịp tim</div>
              </div>
            </div>
          </div>
        )}

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

        {/* Personalized Health Tips */}
        <div className="card">
          <h2 className="text-lg font-semibold mb-3">💡 Lời khuyên sức khỏe cá nhân</h2>
          <div className="space-y-3">
            {/* Risk-based recommendations */}
            {currentRisk?.level === 'Khẩn cấp' && (
              <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
                <div className="flex items-center gap-2 text-red-700 font-semibold mb-2">
                  🚨 Cảnh báo: Huyết áp rất cao
                </div>
                <div className="text-sm text-red-600">
                  Hãy liên hệ bác sĩ ngay lập tức hoặc đến cơ sở y tế gần nhất.
                </div>
              </div>
            )}
            
            {currentRisk?.level === 'Cao' && (
              <div className="p-3 bg-orange-50 border border-orange-200 rounded-lg">
                <div className="flex items-center gap-2 text-orange-700 font-semibold mb-2">
                  ⚠️ Huyết áp cao
                </div>
                <div className="text-sm text-orange-600">
                  Nên kiểm tra với bác sĩ và theo dõi chặt chẽ huyết áp.
                </div>
              </div>
            )}

            {/* General recommendations */}
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
              {last7Days.length < 3 && (
                <div className="flex items-start gap-2">
                  <span className="text-orange-500">•</span>
                  <span className="text-orange-600">Hãy đo huyết áp thường xuyên hơn để có đánh giá chính xác</span>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}