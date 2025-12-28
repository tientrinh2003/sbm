import Sidebar from '@/components/Sidebar';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/db';
import { redirect } from 'next/navigation';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import ChartBP from '@/components/ChartBP';

// Force dynamic rendering to always fetch fresh data
export const dynamic = 'force-dynamic';
export const revalidate = 0;

export default async function DoctorDashboard() {
  const session = await getServerSession(authOptions);
  const role = (session as any)?.role;
  
  if (!session) redirect('/login');
  if (role !== 'DOCTOR') redirect('/forbidden');

  // Thống kê tổng quan
  const totalPatients = await prisma.user.count({
    where: { role: 'PATIENT' }
  });

  const totalMeasurements = await prisma.measurement.count();

  const todayMeasurements = await prisma.measurement.count({
    where: {
      takenAt: {
        gte: new Date(new Date().setHours(0, 0, 0, 0))
      }
    }
  });

  // Bệnh nhân có đo gần đây
  const recentPatients = await prisma.user.findMany({
    where: { 
      role: 'PATIENT',
      measurements: {
        some: {
          takenAt: {
            gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) // 7 ngày
          }
        }
      }
    },
    include: {
      measurements: {
        orderBy: { takenAt: 'desc' },
        take: 1
      }
    },
    take: 10
  });

  // Bệnh nhân cần chú ý (huyết áp cao)
  const highBPPatients = await prisma.user.findMany({
    where: {
      role: 'PATIENT',
      measurements: {
        some: {
          OR: [
            { sys: { gte: 140 } },
            { dia: { gte: 90 } }
          ],
          takenAt: {
            gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) // 7 ngày
          }
        }
      }
    },
    include: {
      measurements: {
        where: {
          OR: [
            { sys: { gte: 140 } },
            { dia: { gte: 90 } }
          ]
        },
        orderBy: { takenAt: 'desc' },
        take: 1
      }
    },
    take: 5
  });

  return (
    <div className="grid gap-6 md:grid-cols-[16rem_1fr]">
      <Sidebar role="DOCTOR" />
      <div className="space-y-6">
        {/* Welcome Section */}
        <div className="card">
          <h1 className="text-xl font-semibold text-gray-900">
            Bảng điều khiển - Bác sĩ
          </h1>
          <p className="text-gray-600 mt-1">
            Theo dõi và quản lý bệnh nhân SmartBP
          </p>
        </div>

        {/* Quick Stats */}
        <div className="grid gap-4 md:grid-cols-4">
          <div className="card text-center">
            <div className="text-sm text-gray-600">Tổng bệnh nhân</div>
            <div className="text-2xl font-bold text-blue-600">{totalPatients}</div>
          </div>
          
          <div className="card text-center">
            <div className="text-sm text-gray-600">Tổng số lần đo</div>
            <div className="text-2xl font-bold text-green-600">{totalMeasurements}</div>
          </div>

          <div className="card text-center">
            <div className="text-sm text-gray-600">Đo hôm nay</div>
            <div className="text-2xl font-bold text-orange-600">{todayMeasurements}</div>
          </div>

          <div className="card text-center">
            <div className="text-sm text-gray-600">Cần chú ý</div>
            <div className="text-2xl font-bold text-red-600">{highBPPatients.length}</div>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="card">
          <h2 className="text-lg font-semibold mb-4">⚡ Thao tác nhanh</h2>
          <div className="flex gap-3 flex-wrap">
            <Link href="/doctor/patients">
              <Button className="bg-blue-600 hover:bg-blue-700">
                👥 Quản lý bệnh nhân
              </Button>
            </Link>
            <Link href="/doctor/chat">
              <Button variant="outline">
                🤖 Trợ lý AI lâm sàng
              </Button>
            </Link>
            <Button variant="outline">
              📊 Báo cáo thống kê
            </Button>
            <Button variant="outline">
              📋 Tạo lịch hẹn
            </Button>
            {/* Tin nhắn bệnh nhân chưa tích hợp — tạm ẩn
            <Button variant="outline">
              💬 Tin nhắn bệnh nhân
            </Button>
            */}
          </div>
        </div>

        <div className="grid gap-6 md:grid-cols-2">
          {/* High BP Patients Alert */}
          <div className="card">
            <div className="flex items-center gap-2 mb-4">
              <span className="text-red-500">🚨</span>
              <h2 className="text-lg font-semibold">Bệnh nhân cần chú ý</h2>
            </div>
            
            {highBPPatients.length === 0 ? (
              <p className="text-gray-600 text-center py-4">
                Không có bệnh nhân có huyết áp cao gần đây
              </p>
            ) : (
              <div className="space-y-3">
                {highBPPatients.map((patient) => {
                  const latestMeasurement = patient.measurements[0];
                  return (
                    <div key={patient.id} className="flex items-center justify-between p-3 bg-red-50 rounded-lg border border-red-200">
                      <div>
                        <div className="font-medium">{patient.name}</div>
                        <div className="text-sm text-gray-600">{patient.email}</div>
                      </div>
                      <div className="text-right">
                        <div className="font-semibold text-red-600">
                          {latestMeasurement.sys}/{latestMeasurement.dia} mmHg
                        </div>
                        <div className="text-xs text-gray-500">
                          {new Date(latestMeasurement.takenAt).toLocaleDateString('vi-VN')}
                        </div>
                      </div>
                    </div>
                  );
                })}
                <Link href="/doctor/patients">
                  <Button variant="outline" size="sm" className="w-full">
                    Xem tất cả →
                  </Button>
                </Link>
              </div>
            )}
          </div>

          {/* Recent Activity */}
          <div className="card">
            <h2 className="text-lg font-semibold mb-4">📈 Hoạt động gần đây</h2>
            
            {recentPatients.length === 0 ? (
              <p className="text-gray-600 text-center py-4">
                Chưa có hoạt động đo huyết áp gần đây
              </p>
            ) : (
              <div className="space-y-3">
                {recentPatients.map((patient) => {
                  const latestMeasurement = patient.measurements[0];
                  const isHigh = latestMeasurement.sys >= 140 || latestMeasurement.dia >= 90;
                  
                  return (
                    <div key={patient.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                      <div>
                        <div className="font-medium">{patient.name}</div>
                        <div className="text-sm text-gray-600">
                          {new Date(latestMeasurement.takenAt).toLocaleDateString('vi-VN')}
                        </div>
                      </div>
                      <div className="text-right">
                        <div className={`font-semibold ${isHigh ? 'text-red-600' : 'text-green-600'}`}>
                          {latestMeasurement.sys}/{latestMeasurement.dia}
                        </div>
                        <div className="text-xs text-gray-500">
                          {latestMeasurement.pulse} bpm
                        </div>
                      </div>
                    </div>
                  );
                })}
                <Link href="/doctor/patients">
                  <Button variant="outline" size="sm" className="w-full">
                    Xem chi tiết →
                  </Button>
                </Link>
              </div>
            )}
          </div>
        </div>

        {/* Chart Overview */}
        <div className="card">
          <h2 className="text-lg font-semibold mb-4">📊 Thống kê tổng quan</h2>
          <div className="h-64 flex items-center justify-center bg-gray-50 rounded-lg">
            <div className="text-center text-gray-500">
              <div className="text-2xl mb-2">📈</div>
              <p>Biểu đồ thống kê sẽ được hiển thị ở đây</p>
              <p className="text-sm">Dữ liệu huyết áp theo thời gian</p>
            </div>
          </div>
        </div>

        {/* System Status */}
        <div className="card">
          <h3 className="font-medium mb-3">🔧 Trạng thái hệ thống</h3>
          <div className="grid gap-3 md:grid-cols-3">
            <div className="flex items-center gap-2 p-2 bg-green-50 rounded">
              <span className="w-2 h-2 bg-green-500 rounded-full"></span>
              <span className="text-sm">Cơ sở dữ liệu: Hoạt động</span>
            </div>
            <div className="flex items-center gap-2 p-2 bg-green-50 rounded">
              <span className="w-2 h-2 bg-green-500 rounded-full"></span>
              <span className="text-sm">MQTT: Kết nối</span>
            </div>
            <div className="flex items-center gap-2 p-2 bg-green-50 rounded">
              <span className="w-2 h-2 bg-green-500 rounded-full"></span>
              <span className="text-sm">API: Sẵn sàng</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}