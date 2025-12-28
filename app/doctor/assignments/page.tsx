import Sidebar from '@/components/Sidebar';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/db';
import { redirect } from 'next/navigation';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import AssignPatientButton from '@/components/AssignPatientButton';
import RemoveAssignmentButton from '@/components/RemoveAssignmentButton';

export default async function DoctorAssignmentsPage() {
  const session = await getServerSession(authOptions);
  const role = (session as any)?.role;
  const doctorId = (session as any)?.userId;
  
  if (!session) redirect('/login');
  if (role !== 'DOCTOR') redirect('/forbidden');

  // Get doctor's assigned patients
  const assignments = await prisma.assignment.findMany({
    where: { doctorId },
    include: {
      patient: {
        include: {
          measurements: {
            orderBy: { takenAt: 'desc' },
            take: 1
          },
          _count: {
            select: { measurements: true }
          }
        }
      }
    },
    orderBy: { createdAt: 'desc' }
  });

  // Get all patients not yet assigned to this doctor
  const assignedPatientIds = assignments.map(a => a.patientId);
  const unassignedPatients = await prisma.user.findMany({
    where: {
      role: 'PATIENT',
      NOT: {
        id: { in: assignedPatientIds }
      }
    },
    include: {
      _count: {
        select: { measurements: true }
      }
    },
    orderBy: { name: 'asc' }
  });

  // Calculate risk levels
  // Calculate risk levels (AHA-like thresholds)
  const getRiskLevel = (sys: number, dia: number) => {
    if (sys > 180 || dia > 120) return { level: 'Khẩn cấp', color: 'text-red-700', bgColor: 'bg-red-50 border-red-200' };
    if (sys >= 140 || dia >= 90) return { level: 'Giai đoạn 2', color: 'text-red-600', bgColor: 'bg-red-50 border-red-200' };
    if (sys >= 130 || dia >= 80) return { level: 'Giai đoạn 1', color: 'text-orange-500', bgColor: 'bg-orange-50 border-orange-200' };
    if (sys >= 120 && sys <= 129 && dia < 80) return { level: 'Tăng nhẹ', color: 'text-yellow-600', bgColor: 'bg-yellow-50 border-yellow-200' };
    return { level: 'Bình thường', color: 'text-green-600', bgColor: 'bg-green-50 border-green-200' };
  };

  return (
    <div className="grid gap-6 md:grid-cols-[16rem_1fr]">
      <Sidebar role="DOCTOR" />
      <div className="space-y-6">
        {/* Header */}
        <div className="card">
          <div>
            <h1 className="text-xl font-semibold text-gray-900">
              Quản lý phân công bệnh nhân
            </h1>
            <p className="text-gray-600 mt-1">
              Bạn đang theo dõi {assignments.length} bệnh nhân
            </p>
          </div>
        </div>

        {/* Stats */}
        <div className="grid gap-4 md:grid-cols-3">
          <div className="card text-center">
            <div className="text-sm text-gray-600">Bệnh nhân được phân công</div>
            <div className="text-3xl font-bold text-blue-600 mt-2">{assignments.length}</div>
          </div>
          
          <div className="card text-center">
            <div className="text-sm text-gray-600">Bệnh nhân chưa phân công</div>
            <div className="text-3xl font-bold text-orange-600 mt-2">{unassignedPatients.length}</div>
          </div>

          <div className="card text-center">
            <div className="text-sm text-gray-600">Tổng bệnh nhân</div>
            <div className="text-3xl font-bold text-green-600 mt-2">
              {assignments.length + unassignedPatients.length}
            </div>
          </div>
        </div>

        {/* Assigned Patients */}
        <div className="card">
          <h2 className="text-lg font-semibold mb-4">👥 Bệnh nhân của tôi</h2>
          
          {assignments.length === 0 ? (
            <div className="text-center py-12 text-gray-500">
              <div className="text-5xl mb-4">👨‍⚕️</div>
              <p className="text-lg font-medium mb-2">Chưa có bệnh nhân được phân công</p>
              <p className="text-sm">Bạn có thể nhận bệnh nhân từ danh sách bên dưới</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-gray-200">
                    <th className="text-left py-3 px-4">Bệnh nhân</th>
                    <th className="text-left py-3 px-4">Liên hệ</th>
                    <th className="text-left py-3 px-4">Đo gần nhất</th>
                    <th className="text-left py-3 px-4">Tổng số lần đo</th>
                    <th className="text-left py-3 px-4">Ngày phân công</th>
                    <th className="text-left py-3 px-4">Thao tác</th>
                  </tr>
                </thead>
                <tbody>
                  {assignments.map(assignment => {
                    const patient = assignment.patient;
                    const latest = patient.measurements[0];
                    const risk = latest ? getRiskLevel(latest.sys, latest.dia) : null;
                    
                    return (
                      <tr key={assignment.id} className="border-b border-gray-100 hover:bg-gray-50">
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
                                {new Date(latest.takenAt).toLocaleDateString('vi-VN')}
                              </div>
                            </div>
                          ) : (
                            <span className="text-gray-400">Chưa có</span>
                          )}
                        </td>
                        <td className="py-3 px-4">
                          <span className="font-semibold">{patient._count.measurements}</span>
                        </td>
                        <td className="py-3 px-4 text-sm text-gray-600">
                          {new Date(assignment.createdAt).toLocaleDateString('vi-VN')}
                        </td>
                        <td className="py-3 px-4">
                          <div className="flex gap-2">
                            <Link href={`/doctor/patients/${patient.id}`}>
                              <Button size="sm" variant="outline">
                                👁️ Xem
                              </Button>
                            </Link>
                            <RemoveAssignmentButton assignmentId={assignment.id} />
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Unassigned Patients */}
        {unassignedPatients.length > 0 && (
          <div className="card">
            <h2 className="text-lg font-semibold mb-4">➕ Bệnh nhân chưa được phân công</h2>
            
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-gray-200">
                    <th className="text-left py-3 px-4">Bệnh nhân</th>
                    <th className="text-left py-3 px-4">Liên hệ</th>
                    <th className="text-left py-3 px-4">Tổng số lần đo</th>
                    <th className="text-left py-3 px-4">Thao tác</th>
                  </tr>
                </thead>
                <tbody>
                  {unassignedPatients.map(patient => (
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
                        <span className="font-semibold">{patient._count.measurements}</span>
                      </td>
                        <td className="py-3 px-4">
                          <AssignPatientButton patientId={patient.id} />
                        </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
