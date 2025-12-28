import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/db';

export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    const role = (session as any)?.role;
    const doctorId = (session as any)?.userId;

    if (!session || role !== 'DOCTOR') {
      return NextResponse.json(
        { error: 'Unauthorized - Chỉ bác sĩ mới có quyền tạo ghi chú' },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { patientId, noteType, content, recommendations, followUpDate } = body;

    // Validate required fields
    if (!patientId || !content) {
      return NextResponse.json(
        { error: 'Missing required fields: patientId, content' },
        { status: 400 }
      );
    }

    // Verify patient exists and is PATIENT role
    const patient = await prisma.user.findUnique({
      where: { id: patientId }
    });

    if (!patient || patient.role !== 'PATIENT') {
      return NextResponse.json(
        { error: 'Patient not found' },
        { status: 404 }
      );
    }

    // Create clinical note
    const clinicalNote = await prisma.clinicalNote.create({
      data: {
        patientId,
        doctorId,
        noteType: noteType || 'ROUTINE_CHECKUP',
        content,
        recommendations: recommendations || null,
        followUpDate: followUpDate ? new Date(followUpDate) : null
      },
      include: {
        doctor: {
          select: {
            name: true,
            email: true
          }
        }
      }
    });

    return NextResponse.json({
      success: true,
      note: clinicalNote
    });

  } catch (error: any) {
    console.error('❌ Error creating clinical note:', error);
    return NextResponse.json(
      { error: 'Failed to create clinical note', details: error.message },
      { status: 500 }
    );
  }
}

// GET all notes for a patient
export async function GET(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    const role = (session as any)?.role;

    if (!session || role !== 'DOCTOR') {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const { searchParams } = new URL(request.url);
    const patientId = searchParams.get('patientId');

    if (!patientId) {
      return NextResponse.json(
        { error: 'Missing patientId parameter' },
        { status: 400 }
      );
    }

    const notes = await prisma.clinicalNote.findMany({
      where: { patientId },
      include: {
        doctor: {
          select: {
            name: true,
            email: true
          }
        }
      },
      orderBy: { createdAt: 'desc' }
    });

    return NextResponse.json({
      success: true,
      notes
    });

  } catch (error: any) {
    console.error('❌ Error fetching clinical notes:', error);
    return NextResponse.json(
      { error: 'Failed to fetch clinical notes', details: error.message },
      { status: 500 }
    );
  }
}
