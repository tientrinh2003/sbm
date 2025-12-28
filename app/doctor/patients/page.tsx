import Sidebar from '@/components/Sidebar';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/db';
import { redirect } from 'next/navigation';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import ChartBP from '@/components/ChartBP';

// Force dynamic rendering to always fetch fresh data
export const dynamic = 'force-dynamic';
export const revalidate = 0;

export default async function DoctorPatients() {
  const session = await getServerSession(authOptions);
  const role = (session as any)?.role;
  
  if (!session) redirect('/login');
  if (role !== 'DOCTOR') redirect('/forbidden');

  // Get all patients with their latest measurements
  const patients = await prisma.user.findMany({
    where: { role: 'PATIENT' },
    include: {
      measurements: {
        orderBy: { takenAt: 'desc' },
        take: 1
      },
      _count: {
        select: { measurements: true }
      }
    },
    orderBy: { name: 'asc' }
  });

  // Calculate risk levels
  const getRiskLevel = (sys: number, dia: number) => {
    if (sys >= 180 || dia >= 110) return { level: 'Khẩn cấp', color: 'text-red-600', bgColor: 'bg-red-50 border-red-200' };
    if (sys >= 140 || dia >= 90) return { level: 'Cao', color: 'text-red-500', bgColor: 'bg-red-50 border-red-200' };
    if (sys >= 130 || dia >= 80) return { level: 'Giai đoạn 1', color: 'text-orange-500', bgColor: 'bg-orange-50 border-orange-200' };
    if (sys >= 120) return { level: 'Tăng cao', color: 'text-yellow-600', bgColor: 'bg-yellow-50 border-yellow-200' };
    return { level: 'Bình thường', color: 'text-green-600', bgColor: 'bg-green-50 border-green-200' };
  };

  // Priority patients (high risk or no recent measurements)
  const priorityPatients = patients.filter(patient => {
    const latest = patient.measurements[0];
    if (!latest) return true; // No measurements
    
    const daysSinceLastMeasurement = (new Date().getTime() - new Date(latest.takenAt).getTime()) / (1000 * 60 * 60 * 24);
    if (daysSinceLastMeasurement > 7) return true; // No measurement in last 7 days
    
    const risk = getRiskLevel(latest.sys, latest.dia);
    return risk.level === 'Khẩn cấp' || risk.level === 'Cao';
  });

  return (
    <div className="grid gap-6 md:grid-cols-[16rem_1fr]">
      <Sidebar role="DOCTOR" />
      <div className="space-y-6">
        {/* Header */}
        <div className="card">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-xl font-semibold text-gray-900">
                Quản lý bệnh nhân
              </h1>
              <p className="text-gray-600 mt-1">
                Theo dõi và quản lý {patients.length} bệnh nhân
              </p>
            </div>
            <Button className="bg-blue-600 hover:bg-blue-700">
              + Thêm bệnh nhân mới
            </Button>
          </div>
        </div>

        {/* Search and Filters */}
        <div className="card">
          <div className="flex gap-4 items-center">
            <Input 
              placeholder="🔍 Tìm kiếm bệnh nhân..." 
              className="max-w-md"
            />
            <select className="px-3 py-2 border border-gray-200 rounded-lg">
              <option value="">Tất cả</option>
              <option value="high-risk">Nguy cơ cao</option>
              <option value="no-recent">Không đo gần đây</option>
              <option value="normal">Bình thường</option>
            </select>
          </div>
        </div>

        {/* Priority Patients Alert */}
        {priorityPatients.length > 0 && (
          <div className="card border-orange-200 bg-orange-50">
            <div className="flex items-center gap-2 mb-4">
              <span className="text-orange-600">⚠️</span>
              <h2 className="text-lg font-semibold text-orange-800">
                Bệnh nhân cần chú ý ({priorityPatients.length})
              </h2>
            </div>
            <div className="grid gap-3 md:grid-cols-2">
              {priorityPatients.slice(0, 4).map(patient => {
                const latest = patient.measurements[0];
                const risk = latest ? getRiskLevel(latest.sys, latest.dia) : { level: 'Chưa có dữ liệu', color: 'text-gray-500', bgColor: 'bg-gray-50 border-gray-200' };
                const daysSinceLastMeasurement = latest ? Math.floor((new Date().getTime() - new Date(latest.takenAt).getTime()) / (1000 * 60 * 60 * 24)) : null;
                
                return (
                  <div key={patient.id} className="bg-white p-3 rounded-lg border">
                    <div className="flex items-center justify-between mb-2">
                      <h3 className="font-semibold">{patient.name}</h3>
                      <span className={`px-2 py-1 rounded-full text-xs font-semibold ${risk.bgColor} ${risk.color} border`}>
                        {risk.level}
                      </span>
                    </div>
                    {latest ? (
                      <div className="text-sm text-gray-600">
                        <div>BP: {latest.sys}/{latest.dia} mmHg</div>
                        <div className="text-xs mt-1">
                          {daysSinceLastMeasurement === 0 ? 'Hôm nay' : `${daysSinceLastMeasurement} ngày trước`}
                        </div>
                      </div>
                    ) : (
                      <div className="text-sm text-red-600">Chưa có phép đo nào</div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* All Patients */}
        <div className="card">
          <h2 className="text-lg font-semibold mb-4">📋 Danh sách bệnh nhân</h2>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-200">
                  <th className="text-left py-3 px-4">Bệnh nhân</th>
                  <th className="text-left py-3 px-4">Liên hệ</th>
                  <th className="text-left py-3 px-4">Đo gần nhất</th>
                  <th className="text-left py-3 px-4">Tổng số lần đo</th>
                  <th className="text-left py-3 px-4">Tình trạng</th>
                  <th className="text-left py-3 px-4">Thao tác</th>
                </tr>
              </thead>
              <tbody>
                {patients.map(patient => {
                  const latest = patient.measurements[0];
                  const risk = latest ? getRiskLevel(latest.sys, latest.dia) : { level: 'Chưa có dữ liệu', color: 'text-gray-500', bgColor: 'bg-gray-50 border-gray-200' };
                  const daysSinceLastMeasurement = latest ? Math.floor((new Date().getTime() - new Date(latest.takenAt).getTime()) / (1000 * 60 * 60 * 24)) : null;
                  
                  return (
                    <tr key={patient.id} className="border-b border-gray-100 hover:bg-gray-50">
                      <td className="py-3 px-4">
                        <div>
                          <div className="font-semibold">{patient.name}</div>
                          <div className="text-sm text-gray-500">
                            {patient.gender === 'MALE' ? '👨' : patient.gender === 'FEMALE' ? '👩' : '👤'} 
                            {patient.dateOfBirth ? ` ${new Date().getFullYear() - new Date(patient.dateOfBirth).getFullYear()} tuổi` : ''}
                          </div>
                        </div>
                      </td>
                      <td className="py-3 px-4">
                        <div className="text-sm">
                          <div>{patient.email}</div>
                          {patient.phone && <div className="text-gray-500">{patient.phone}</div>}
                        </div>
                      </td>
                      <td className="py-3 px-4">
                        {latest ? (
                          <div className="text-sm">
                            <div className="font-semibold">{latest.sys}/{latest.dia} mmHg</div>
                            <div className="text-gray-500">
                              {daysSinceLastMeasurement === 0 ? 'Hôm nay' : `${daysSinceLastMeasurement} ngày trước`}
                            </div>
                          </div>
                        ) : (
                          <span className="text-gray-400">Chưa có</span>
                        )}
                      </td>
                      <td className="py-3 px-4">
                        <span className="font-semibold">{patient._count.measurements}</span>
                      </td>
                      <td className="py-3 px-4">
                        <span className={`px-2 py-1 rounded-full text-xs font-semibold ${risk.bgColor} ${risk.color} border`}>
                          {risk.level}
                        </span>
                      </td>
                      <td className="py-3 px-4">
                        <div className="flex gap-2">
                          <Link href={`/doctor/patients/${patient.id}`}>
                            <Button size="sm" variant="outline">
                              👁️ Xem
                            </Button>
                          </Link>
                          <Link href={`/doctor/patients/${patient.id}/note`}>
                            <Button size="sm" variant="outline">
                              📝 Ghi chú
                            </Button>
                          </Link>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}