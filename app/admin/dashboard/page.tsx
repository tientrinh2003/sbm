import Sidebar from '@/components/Sidebar';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/db';
import { redirect } from 'next/navigation';
import Link from 'next/link';
import { Button } from '@/components/ui/button';

export default async function AdminDashboard() {
  const session = await getServerSession(authOptions);
  const role = (session as any)?.role;
  
  if (!session) redirect('/login');
  if (role !== 'ADMIN') redirect('/forbidden');

  // Thống kê tổng quan hệ thống
  const totalUsers = await prisma.user.count();
  const totalPatients = await prisma.user.count({ where: { role: 'PATIENT' } });
  const totalDoctors = await prisma.user.count({ where: { role: 'DOCTOR' } });
  const totalMeasurements = await prisma.measurement.count();

  // Thống kê theo thời gian
  const today = new Date();
  const last7Days = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
  const last30Days = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);

  const measurementsToday = await prisma.measurement.count({
    where: { takenAt: { gte: new Date(today.setHours(0, 0, 0, 0)) } }
  });

  const measurements7Days = await prisma.measurement.count({
    where: { takenAt: { gte: last7Days } }
  });

  const measurements30Days = await prisma.measurement.count({
    where: { takenAt: { gte: last30Days } }
  });

  // Người dùng mới trong 7 ngày
  const newUsers7Days = await prisma.user.count({
    where: { createdAt: { gte: last7Days } }
  });

  // Hoạt động gần đây
  const recentMeasurements = await prisma.measurement.findMany({
    include: {
      user: {
        select: { name: true, email: true }
      }
    },
    orderBy: { takenAt: 'desc' },
    take: 10
  });

  // Người dùng đăng ký gần đây
  const recentUsers = await prisma.user.findMany({
    orderBy: { createdAt: 'desc' },
    take: 5,
    select: {
      id: true,
      name: true,
      email: true,
      role: true,
      createdAt: true
    }
  });

  return (
    <div className="grid gap-6 md:grid-cols-[16rem_1fr]">
      <Sidebar role="ADMIN" />
      <div className="space-y-6">
        {/* Welcome Section */}
        <div className="card">
          <h1 className="text-xl font-semibold text-gray-900">
            Bảng điều khiển - Quản trị viên
          </h1>
          <p className="text-gray-600 mt-1">
            Quản lý toàn bộ hệ thống SmartBP
          </p>
        </div>

        {/* System Stats */}
        <div className="grid gap-4 md:grid-cols-4">
          <div className="card text-center">
            <div className="text-sm text-gray-600">Tổng người dùng</div>
            <div className="text-2xl font-bold text-blue-600">{totalUsers}</div>
            <div className="text-xs text-green-600 mt-1">+{newUsers7Days} tuần này</div>
          </div>
          
          <div className="card text-center">
            <div className="text-sm text-gray-600">Bệnh nhân</div>
            <div className="text-2xl font-bold text-green-600">{totalPatients}</div>
          </div>

          <div className="card text-center">
            <div className="text-sm text-gray-600">Bác sĩ</div>
            <div className="text-2xl font-bold text-purple-600">{totalDoctors}</div>
          </div>

          <div className="card text-center">
            <div className="text-sm text-gray-600">Tổng lần đo</div>
            <div className="text-2xl font-bold text-orange-600">{totalMeasurements}</div>
          </div>
        </div>

        {/* Activity Stats */}
        <div className="grid gap-4 md:grid-cols-3">
          <div className="card text-center">
            <div className="text-sm text-gray-600">Đo hôm nay</div>
            <div className="text-xl font-bold text-blue-600">{measurementsToday}</div>
          </div>
          
          <div className="card text-center">
            <div className="text-sm text-gray-600">Đo 7 ngày</div>
            <div className="text-xl font-bold text-green-600">{measurements7Days}</div>
          </div>

          <div className="card text-center">
            <div className="text-sm text-gray-600">Đo 30 ngày</div>
            <div className="text-xl font-bold text-orange-600">{measurements30Days}</div>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="card">
          <h2 className="text-lg font-semibold mb-4">⚡ Quản lý hệ thống</h2>
          <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-4">
            <Link href="/admin/users">
              <Button className="w-full bg-blue-600 hover:bg-blue-700">
                👥 Quản lý người dùng
              </Button>
            </Link>
            <Button variant="outline" className="w-full">
              📊 Báo cáo thống kê
            </Button>
            <Button variant="outline" className="w-full">
              🔧 Cấu hình hệ thống
            </Button>
            <Button variant="outline" className="w-full">
              📋 Nhật ký hoạt động
            </Button>
          </div>
        </div>

        <div className="grid gap-6 md:grid-cols-2">
          {/* Recent Users */}
          <div className="card">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold">👤 Người dùng mới</h2>
              <Link href="/admin/users">
                <Button variant="ghost" size="sm">
                  Xem tất cả →
                </Button>
              </Link>
            </div>
            
            {recentUsers.length === 0 ? (
              <p className="text-gray-600 text-center py-4">
                Chưa có người dùng mới
              </p>
            ) : (
              <div className="space-y-3">
                {recentUsers.map((user) => (
                  <div key={user.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <div>
                      <div className="font-medium">{user.name}</div>
                      <div className="text-sm text-gray-600">{user.email}</div>
                    </div>
                    <div className="text-right">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                        user.role === 'ADMIN' ? 'bg-red-100 text-red-800' :
                        user.role === 'DOCTOR' ? 'bg-purple-100 text-purple-800' :
                        'bg-blue-100 text-blue-800'
                      }`}>
                        {user.role === 'ADMIN' ? '👑 Admin' :
                         user.role === 'DOCTOR' ? '👨‍⚕️ Bác sĩ' :
                         '👤 Bệnh nhân'}
                      </span>
                      <div className="text-xs text-gray-500 mt-1">
                        {new Date(user.createdAt).toLocaleDateString('vi-VN')}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Recent Activity */}
          <div className="card">
            <h2 className="text-lg font-semibold mb-4">📈 Hoạt động gần đây</h2>
            
            {recentMeasurements.length === 0 ? (
              <p className="text-gray-600 text-center py-4">
                Chưa có hoạt động đo huyết áp
              </p>
            ) : (
              <div className="space-y-3">
                {recentMeasurements.slice(0, 5).map((measurement) => {
                  const isHigh = measurement.sys >= 140 || measurement.dia >= 90;
                  
                  return (
                    <div key={measurement.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                      <div>
                        <div className="font-medium">{measurement.user.name}</div>
                        <div className="text-sm text-gray-600">
                          {new Date(measurement.takenAt).toLocaleDateString('vi-VN')} {new Date(measurement.takenAt).toLocaleTimeString('vi-VN')}
                        </div>
                      </div>
                      <div className="text-right">
                        <div className={`font-semibold ${isHigh ? 'text-red-600' : 'text-green-600'}`}>
                          {measurement.sys}/{measurement.dia}
                        </div>
                        <div className="text-xs text-gray-500">
                          {measurement.pulse} bpm
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        {/* System Health */}
        <div className="card">
          <h2 className="text-lg font-semibold mb-4">🔧 Trạng thái hệ thống</h2>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <div className="p-3 bg-green-50 rounded-lg">
              <div className="flex items-center gap-2 mb-2">
                <span className="w-2 h-2 bg-green-500 rounded-full"></span>
                <span className="font-medium text-green-800">Database</span>
              </div>
              <div className="text-sm text-green-700">Hoạt động bình thường</div>
            </div>

            <div className="p-3 bg-green-50 rounded-lg">
              <div className="flex items-center gap-2 mb-2">
                <span className="w-2 h-2 bg-green-500 rounded-full"></span>
                <span className="font-medium text-green-800">MQTT Server</span>
              </div>
              <div className="text-sm text-green-700">Kết nối ổn định</div>
            </div>

            <div className="p-3 bg-green-50 rounded-lg">
              <div className="flex items-center gap-2 mb-2">
                <span className="w-2 h-2 bg-green-500 rounded-full"></span>
                <span className="font-medium text-green-800">API Service</span>
              </div>
              <div className="text-sm text-green-700">Sẵn sàng phục vụ</div>
            </div>

            <div className="p-3 bg-yellow-50 rounded-lg">
              <div className="flex items-center gap-2 mb-2">
                <span className="w-2 h-2 bg-yellow-500 rounded-full"></span>
                <span className="font-medium text-yellow-800">Storage</span>
              </div>
              <div className="text-sm text-yellow-700">Sử dụng 67%</div>
            </div>
          </div>
        </div>

        {/* Analytics Overview */}
        <div className="card">
          <h2 className="text-lg font-semibold mb-4">📊 Thống kê chi tiết</h2>
          <div className="h-64 flex items-center justify-center bg-gray-50 rounded-lg">
            <div className="text-center text-gray-500">
              <div className="text-2xl mb-2">📈</div>
              <p>Biểu đồ thống kê chi tiết</p>
              <p className="text-sm">Người dùng, đo huyết áp, xu hướng sử dụng</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}