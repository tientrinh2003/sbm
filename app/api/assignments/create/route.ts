import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/db';
import { redirect } from 'next/navigation';

export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    const role = (session as any)?.role;
    const doctorId = (session as any)?.userId;

    if (!session || role !== 'DOCTOR') {
      return NextResponse.json(
        { error: 'Unauthorized - Chỉ bác sĩ mới có quyền phân công bệnh nhân' },
        { status: 401 }
      );
    }

    const formData = await request.formData();
    const patientId = formData.get('patientId') as string;

    if (!patientId) {
      return NextResponse.json(
        { error: 'Missing patientId' },
        { status: 400 }
      );
    }

    // Check if patient exists
    const patient = await prisma.user.findUnique({
      where: { id: patientId }
    });

    if (!patient || patient.role !== 'PATIENT') {
      return NextResponse.json(
        { error: 'Patient not found' },
        { status: 404 }
      );
    }

    // Check if assignment already exists
    const existing = await prisma.assignment.findUnique({
      where: {
        doctorId_patientId: {
          doctorId,
          patientId
        }
      }
    });

    if (existing) {
      return NextResponse.json(
        { error: 'Assignment already exists' },
        { status: 400 }
      );
    }

    // Create assignment
    const assignment = await prisma.assignment.create({
      data: {
        doctorId,
        patientId
      }
    });

    // Redirect back
    return redirect('/doctor/assignments');

  } catch (error: any) {
    console.error('❌ Error creating assignment:', error);
    return NextResponse.json(
      { error: 'Failed to create assignment', details: error.message },
      { status: 500 }
    );
  }
}
