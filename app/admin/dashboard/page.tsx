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

  // System statistics
  const totalUsers = await prisma.user.count();
  const totalPatients = await prisma.user.count({ where: { role: 'PATIENT' } });
  const totalDoctors = await prisma.user.count({ where: { role: 'DOCTOR' } });
  const totalMeasurements = await prisma.measurement.count();

  // Time-based statistics
  const today = new Date();
  const last7Days = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);

  const measurementsToday = await prisma.measurement.count({
    where: { takenAt: { gte: new Date(today.setHours(0, 0, 0, 0)) } }
  });

  const measurements7Days = await prisma.measurement.count({
    where: { takenAt: { gte: last7Days } }
  });

  const newUsers7Days = await prisma.user.count({
    where: { createdAt: { gte: last7Days } }
  });

  // Recent activity
  const recentMeasurements = await prisma.measurement.findMany({
    include: {
      user: { select: { name: true, email: true } }
    },
    orderBy: { takenAt: 'desc' },
    take: 5
  });

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
            🏥 Bảng điều khiển - Quản trị viên
          </h1>
          <p className="text-gray-600 mt-1">
            Quản lý toàn bộ hệ thống SmartBP
          </p>
        </div>

        {/* System Stats */}
        <div className="grid gap-4 md:grid-cols-5">
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
            <div className="text-sm text-gray-600">Tổng số đo</div>
            <div className="text-2xl font-bold text-orange-600">{totalMeasurements}</div>
          </div>

          <div className="card text-center">
            <div className="text-sm text-gray-600">Đo hôm nay</div>
            <div className="text-2xl font-bold text-red-600">{measurementsToday}</div>
          </div>
        </div>

        {/* System Health */}
        <div className="card">
          <h2 className="text-lg font-semibold mb-4">🏥 Tình trạng hệ thống</h2>
          <div className="grid gap-4 md:grid-cols-4">
            <div className="flex items-center justify-between p-3 bg-green-50 rounded-lg border border-green-200">
              <div>
                <div className="text-sm font-semibold text-green-800">Database</div>
                <div className="text-xs text-green-600">Connected</div>
              </div>
              <div className="w-3 h-3 bg-green-500 rounded-full"></div>
            </div>
            
            <div className="flex items-center justify-between p-3 bg-green-50 rounded-lg border border-green-200">
              <div>
                <div className="text-sm font-semibold text-green-800">API Server</div>
                <div className="text-xs text-green-600">Running</div>
              </div>
              <div className="w-3 h-3 bg-green-500 rounded-full"></div>
            </div>
            
            <div className="flex items-center justify-between p-3 bg-green-50 rounded-lg border border-green-200">
              <div>
                <div className="text-sm font-semibold text-green-800">Chatbot</div>
                <div className="text-xs text-green-600">Online</div>
              </div>
              <div className="w-3 h-3 bg-green-500 rounded-full"></div>
            </div>
            
            <div className="flex items-center justify-between p-3 bg-blue-50 rounded-lg border border-blue-200">
              <div>
                <div className="text-sm font-semibold text-blue-800">Uptime</div>
                <div className="text-xs text-blue-600">99.9%</div>
              </div>
              <div className="text-blue-600">📊</div>
            </div>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="card">
          <h2 className="text-lg font-semibold mb-4">⚡ Thao tác quản trị</h2>
          <div className="flex gap-3 flex-wrap">
            <Link href="/admin/users">
              <Button className="bg-blue-600 hover:bg-blue-700">
                👥 Quản lý người dùng
              </Button>
            </Link>
            <Link href="/admin/chat">
              <Button variant="outline">
                🤖 System AI
              </Button>
            </Link>
            <Button variant="outline">
              📊 Báo cáo hệ thống
            </Button>
            <Button variant="outline">
              ⚙️ Cấu hình
            </Button>
            <Button variant="outline">
              🔧 Backup Database
            </Button>
            <Button variant="outline">
              📧 Gửi thông báo
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
                      <div className="font-semibold">{user.name}</div>
                      <div className="text-sm text-gray-600">{user.email}</div>
                    </div>
                    <div className="text-right">
                      <div className={`text-xs px-2 py-1 rounded ${
                        user.role === 'PATIENT' ? 'bg-green-100 text-green-800' :
                        user.role === 'DOCTOR' ? 'bg-blue-100 text-blue-800' :
                        'bg-purple-100 text-purple-800'
                      }`}>
                        {user.role}
                      </div>
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
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold">📊 Hoạt động gần đây</h2>
            </div>
            
            {recentMeasurements.length === 0 ? (
              <p className="text-gray-600 text-center py-4">
                Chưa có hoạt động nào
              </p>
            ) : (
              <div className="space-y-3 max-h-64 overflow-y-auto">
                {recentMeasurements.map((measurement) => (
                  <div key={measurement.id} className="flex items-center justify-between p-2 border-l-4 border-blue-200 bg-blue-50">
                    <div>
                      <div className="text-sm font-semibold">
                        {measurement.user.name}
                      </div>
                      <div className="text-xs text-gray-600">
                        Đo: {measurement.sys}/{measurement.dia} mmHg
                      </div>
                    </div>
                    <div className="text-xs text-gray-500">
                      {new Date(measurement.takenAt).toLocaleString('vi-VN')}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
        
        {/* Footer Stats */}
        <div className="card bg-gradient-to-r from-blue-50 to-indigo-50">
          <div className="text-center">
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              🎯 Tổng quan hoạt động
            </h3>
            <div className="grid grid-cols-3 gap-4 text-sm">
              <div>
                <div className="font-semibold text-blue-600">{measurements7Days}</div>
                <div className="text-gray-600">Đo 7 ngày</div>
              </div>
              <div>
                <div className="font-semibold text-green-600">{totalMeasurements}</div>
                <div className="text-gray-600">Tổng đo</div>
              </div>
              <div>
                <div className="font-semibold text-purple-600">{newUsers7Days}</div>
                <div className="text-gray-600">User mới</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}