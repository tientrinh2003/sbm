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

export default async function PatientDetailPage({ params }: { params: Promise<{ id: string }> | { id: string } }) {
  const { id } = (await params) as { id: string }; // await params per Next.js dynamic API

  const session = await getServerSession(authOptions);
  const role = (session as any)?.role;
  
  if (!session) redirect('/login');
  if (role !== 'DOCTOR') redirect('/forbidden');

  // Get patient with all measurements and notes
  const patient = await prisma.user.findUnique({
    where: { id }, // Use destructured id
    include: {
      measurements: {
        orderBy: { takenAt: 'desc' },
        take: 100 // Last 100 measurements
      },
      clinicalNotes: {
        include: {
          doctor: {
            select: { name: true, email: true }
          }
        },
        orderBy: { createdAt: 'desc' }
      },
      emergencyContacts: true
    }
  });

  if (!patient || patient.role !== 'PATIENT') {
    redirect('/doctor/patients');
  }

  // Calculate statistics
  const totalMeasurements = patient.measurements.length;
  const latestMeasurement = patient.measurements[0];
  
  // Last 30 days measurements
  const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
  const recentMeasurements = patient.measurements.filter(
    m => new Date(m.takenAt) >= thirtyDaysAgo
  );
  
  const avgSys = recentMeasurements.length > 0
    ? Math.round(recentMeasurements.reduce((sum, m) => sum + m.sys, 0) / recentMeasurements.length)
    : 0;
  const avgDia = recentMeasurements.length > 0
    ? Math.round(recentMeasurements.reduce((sum, m) => sum + m.dia, 0) / recentMeasurements.length)
    : 0;
  const avgPulse = recentMeasurements.length > 0
    ? Math.round(recentMeasurements.reduce((sum, m) => sum + m.pulse, 0) / recentMeasurements.length)
    : 0;

  // Risk assessment
  // Risk assessment (AHA-like thresholds)
  const getRiskLevel = (sys: number, dia: number) => {
    // Crisis: systolic >180 or diastolic >120
    if (sys > 180 || dia > 120) return { level: 'Khẩn cấp', color: 'text-red-700', bgColor: 'bg-red-50' };
    // Hypertension stage 2
    if (sys >= 140 || dia >= 90) return { level: 'Giai đoạn 2', color: 'text-red-600', bgColor: 'bg-red-50' };
    // Hypertension stage 1
    if (sys >= 130 || dia >= 80) return { level: 'Giai đoạn 1', color: 'text-orange-500', bgColor: 'bg-orange-50' };
    // Elevated (120-129 systolic and diastolic <80)
    if (sys >= 120 && sys <= 129 && dia < 80) return { level: 'Tăng nhẹ', color: 'text-yellow-600', bgColor: 'bg-yellow-50' };
    return { level: 'Bình thường', color: 'text-green-600', bgColor: 'bg-green-50' };
  };

  const currentRisk = latestMeasurement ? getRiskLevel(latestMeasurement.sys, latestMeasurement.dia) : null;

  // Chart data
  const chartData = recentMeasurements
    .slice(0, 30)
    .reverse()
    .map(m => {
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
      <Sidebar role="DOCTOR" />
      <div className="space-y-6">
        {/* Patient Header */}
        <div className="card">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center text-2xl">
                {patient.gender === 'MALE' ? '👨' : patient.gender === 'FEMALE' ? '👩' : '👤'}
              </div>
              <div>
                <h1 className="text-2xl font-bold">{patient.name}</h1>
                <div className="flex gap-4 text-sm text-gray-600 mt-1">
                  <span>📧 {patient.email}</span>
                  {patient.phone && <span>📱 {patient.phone}</span>}
                  {patient.dateOfBirth && (
                    <span>🎂 {new Date().getFullYear() - new Date(patient.dateOfBirth).getFullYear()} tuổi</span>
                  )}
                </div>
              </div>
            </div>
            <div className="flex gap-2">
              <Link href="/doctor/patients">
                <Button variant="outline">← Quay lại</Button>
              </Link>
              <Link href={`/doctor/patients/${id}/note`}>
                <Button className="bg-blue-600 hover:bg-blue-700">
                  📝 Thêm ghi chú lâm sàng
                </Button>
              </Link>
            </div>
          </div>
        </div>

        {/* Risk Alert */}
        {latestMeasurement && currentRisk && (currentRisk.level === 'Khẩn cấp' || currentRisk.level === 'Cao') && (
          <div className="card border-red-200 bg-red-50">
            <div className="flex items-center gap-3">
              <span className="text-3xl">🚨</span>
              <div>
                <h3 className="font-semibold text-red-800">Cảnh báo huyết áp {currentRisk.level.toLowerCase()}</h3>
                <p className="text-sm text-red-600 mt-1">
                  Đo gần nhất: {latestMeasurement.sys}/{latestMeasurement.dia} mmHg vào{' '}
                  {new Date(latestMeasurement.takenAt).toLocaleString('vi-VN')}
                </p>
                <p className="text-sm text-red-600">
                  Cần liên hệ bệnh nhân ngay để đánh giá và can thiệp kịp thời.
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Quick Stats */}
        <div className="grid gap-4 md:grid-cols-4">
          <div className="card text-center">
            <div className="text-sm text-gray-600">Tổng số lần đo</div>
            <div className="text-3xl font-bold text-blue-600 mt-2">{totalMeasurements}</div>
          </div>
          
          <div className="card text-center">
            <div className="text-sm text-gray-600">TB SYS (30 ngày)</div>
            <div className="text-3xl font-bold text-red-500 mt-2">{avgSys}</div>
            <div className="text-xs text-gray-500">mmHg</div>
          </div>

          <div className="card text-center">
            <div className="text-sm text-gray-600">TB DIA (30 ngày)</div>
            <div className="text-3xl font-bold text-blue-500 mt-2">{avgDia}</div>
            <div className="text-xs text-gray-500">mmHg</div>
          </div>

          <div className="card text-center">
            <div className="text-sm text-gray-600">TB Pulse (30 ngày)</div>
            <div className="text-3xl font-bold text-green-500 mt-2">{avgPulse}</div>
            <div className="text-xs text-gray-500">bpm</div>
          </div>
        </div>

        {/* Current Status */}
        {latestMeasurement && currentRisk && (
          <div className="card">
            <h2 className="text-lg font-semibold mb-4">📊 Tình trạng hiện tại</h2>
            <div className="grid gap-4 md:grid-cols-3">
              <div className={`p-4 rounded-lg ${currentRisk.bgColor} border`}>
                <div className="text-sm text-gray-600">Phân loại</div>
                <div className={`text-xl font-bold mt-1 ${currentRisk.color}`}>
                  {currentRisk.level}
                </div>
              </div>
              
              <div className="p-4 rounded-lg bg-gray-50 border">
                <div className="text-sm text-gray-600">Huyết áp gần nhất</div>
                <div className="text-xl font-bold mt-1">
                  {latestMeasurement.sys}/{latestMeasurement.dia}
                </div>
                <div className="text-xs text-gray-500 mt-1">
                  {new Date(latestMeasurement.takenAt).toLocaleString('vi-VN')}
                </div>
              </div>

              <div className="p-4 rounded-lg bg-gray-50 border">
                <div className="text-sm text-gray-600">Nhịp tim</div>
                <div className="text-xl font-bold mt-1">{latestMeasurement.pulse} bpm</div>
                <div className="text-xs text-gray-500 mt-1">
                  {latestMeasurement.method === 'BLUETOOTH' ? '📱 Bluetooth' : '✍️ Thủ công'}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Trend Chart */}
        <div className="card">
          <h2 className="text-lg font-semibold mb-4">📈 Xu hướng huyết áp (30 ngày)</h2>
          {chartData.length > 0 ? (
            <ChartBP data={chartData} />
          ) : (
            <div className="h-64 flex items-center justify-center bg-gray-50 rounded-lg">
              <p className="text-gray-500">Chưa có dữ liệu đo huyết áp</p>
            </div>
          )}
        </div>

        {/* Clinical Notes */}
        <div className="card">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold">📋 Ghi chú lâm sàng</h2>
            <Link href={`/doctor/patients/${id}/note`}>
              <Button size="sm" className="bg-blue-600 hover:bg-blue-700">
                + Thêm ghi chú
              </Button>
            </Link>
          </div>
          
          {patient.clinicalNotes.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              <div className="text-4xl mb-2">📝</div>
              <p>Chưa có ghi chú lâm sàng nào</p>
            </div>
          ) : (
            <div className="space-y-4">
              {patient.clinicalNotes.map(note => (
                <div key={note.id} className="p-4 bg-gray-50 rounded-lg border">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <span className="font-medium">{note.doctor.name}</span>
                      <span className="text-sm text-gray-500">
                        {new Date(note.createdAt).toLocaleString('vi-VN')}
                      </span>
                    </div>
                    {note.noteType && (
                      <span className="px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded-full">
                        {note.noteType}
                      </span>
                    )}
                  </div>
                  <p className="text-gray-700 whitespace-pre-wrap">{note.content}</p>
                  {note.recommendations && (
                    <div className="mt-3 pt-3 border-t border-gray-200">
                      <div className="text-sm font-medium text-gray-600 mb-1">💡 Khuyến nghị:</div>
                      <p className="text-sm text-gray-700">{note.recommendations}</p>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Emergency Contacts */}
        {patient.emergencyContacts.length > 0 && (
          <div className="card">
            <h2 className="text-lg font-semibold mb-4">🚨 Liên hệ khẩn cấp</h2>
            <div className="grid gap-3 md:grid-cols-2">
              {patient.emergencyContacts.map(contact => (
                <div key={contact.id} className="p-3 bg-gray-50 rounded-lg border">
                  <div className="font-medium">{contact.name}</div>
                  <div className="text-sm text-gray-600">{contact.relationship}</div>
                  <div className="text-sm text-gray-700 mt-1">
                    📱 {contact.phone}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Measurement History */}
        <div className="card">
          <h2 className="text-lg font-semibold mb-4">📜 Lịch sử đo huyết áp</h2>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-200">
                  <th className="text-left py-3 px-4">Thời gian</th>
                  <th className="text-left py-3 px-4">SYS</th>
                  <th className="text-left py-3 px-4">DIA</th>
                  <th className="text-left py-3 px-4">Pulse</th>
                  <th className="text-left py-3 px-4">Phương thức</th>
                  <th className="text-left py-3 px-4">Đánh giá</th>
                </tr>
              </thead>
              <tbody>
                {patient.measurements.slice(0, 20).map(measurement => {
                  const risk = getRiskLevel(measurement.sys, measurement.dia);
                  return (
                    <tr key={measurement.id} className="border-b border-gray-100 hover:bg-gray-50">
                      <td className="py-3 px-4 text-sm">
                        {new Date(measurement.takenAt).toLocaleString('vi-VN')}
                      </td>
                      <td className="py-3 px-4 font-semibold text-red-600">
                        {measurement.sys}
                      </td>
                      <td className="py-3 px-4 font-semibold text-blue-600">
                        {measurement.dia}
                      </td>
                      <td className="py-3 px-4 font-semibold text-green-600">
                        {measurement.pulse}
                      </td>
                      <td className="py-3 px-4 text-sm">
                        {measurement.method === 'BLUETOOTH' ? '📱 Bluetooth' : '✍️ Thủ công'}
                      </td>
                      <td className="py-3 px-4">
                        <span className={`px-2 py-1 rounded-full text-xs font-semibold ${risk.bgColor} ${risk.color} border`}>
                          {risk.level}
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
          {patient.measurements.length > 20 && (
            <div className="text-center mt-4">
              <Button variant="outline" size="sm">
                Xem tất cả {patient.measurements.length} lần đo →
              </Button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
