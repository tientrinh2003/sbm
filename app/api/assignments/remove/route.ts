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
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const formData = await request.formData();
    const assignmentId = formData.get('assignmentId') as string;

    if (!assignmentId) {
      return NextResponse.json(
        { error: 'Missing assignmentId' },
        { status: 400 }
      );
    }

    // Verify assignment belongs to this doctor
    const assignment = await prisma.assignment.findUnique({
      where: { id: assignmentId }
    });

    if (!assignment) {
      console.warn(`Assignment ${assignmentId} not found`);
      return NextResponse.json({ error: 'Assignment not found' }, { status: 404 });
    }

    if (assignment.doctorId !== doctorId) {
      console.warn(`Unauthorized remove attempt by doctor ${doctorId} for assignment ${assignmentId} (owner: ${assignment.doctorId})`);
      return NextResponse.json({ error: 'Unauthorized for this assignment' }, { status: 403 });
    }

    // Delete assignment
    await prisma.assignment.delete({
      where: { id: assignmentId }
    });

    // Redirect back
    return redirect('/doctor/assignments');

  } catch (error: any) {
    console.error('❌ Error removing assignment:', error);
    return NextResponse.json(
      { error: 'Failed to remove assignment', details: error.message },
      { status: 500 }
    );
  }
}
