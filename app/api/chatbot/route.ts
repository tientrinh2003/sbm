import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/db';
import { UserContext, PatientSummary, DoctorContext, ChatbotRequest, ChatbotResponse } from '@/types/chatbot';

export async function POST(request: NextRequest) {
  try {
    // Kiểm tra authentication
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { message, conversationId, language = 'auto' } = body;

    if (!message) {
      return NextResponse.json({ error: 'Message is required' }, { status: 400 });
    }

    // Lấy thông tin user đầy đủ từ database
    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
      include: {
        measurements: {
          orderBy: { takenAt: 'desc' },
          take: 10
        },
        assignmentsAsDoctor: {
          include: { patient: true }
        },
        assignmentsAsPatient: {
          include: { doctor: true }
        }
      }
    });


    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // Tạo user context
    const userContext: UserContext = {
      id: user.id,
      name: user.name || undefined,
      email: user.email || undefined,
      role: user.role,
      dateOfBirth: user.dateOfBirth || undefined,
      gender: user.gender || undefined,
      phone: user.phone || undefined,
    };

    // Tạo role-specific data
    let roleSpecificData: PatientSummary | DoctorContext | null = null;

    if (user.role === 'PATIENT') {
      // Tính toán thống kê cho bệnh nhân
      const measurements = user.measurements.map(m => ({
        id: m.id,
        sys: m.sys,
        dia: m.dia,
        pulse: m.pulse,
        method: m.method,
        takenAt: m.takenAt.toISOString(),
        // Pi AI data - will be available after migration
        // aiAnalysis: m.aiAnalysis ? (m.aiAnalysis as any) : undefined,
        // speechData: m.speechData ? (m.speechData as any) : undefined,
        // piTimestamp: m.piTimestamp?.toISOString() || undefined,
        // deviceId: m.deviceId || undefined,
      }));

      const avgSys = measurements.length > 0 
        ? measurements.reduce((sum, m) => sum + m.sys, 0) / measurements.length 
        : 0;
      const avgDia = measurements.length > 0 
        ? measurements.reduce((sum, m) => sum + m.dia, 0) / measurements.length 
        : 0;

      // Đánh giá risk
      let riskAssessment = 'Unknown';
      if (avgSys >= 180 || avgDia >= 110) {
        riskAssessment = 'Critical - Hypertensive Crisis';
      } else if (avgSys >= 140 || avgDia >= 90) {
        riskAssessment = 'High - Stage 2 Hypertension';
      } else if (avgSys >= 130 || avgDia >= 80) {
        riskAssessment = 'Elevated - Stage 1 Hypertension';
      } else if (avgSys >= 120) {
        riskAssessment = 'Elevated - Prehypertension';
      } else if (measurements.length > 0) {
        riskAssessment = 'Normal';
      }

      roleSpecificData = {
        latest_measurements: measurements,
        measurement_count: measurements.length,
        avg_sys: avgSys,
        avg_dia: avgDia,
        risk_assessment: riskAssessment,
        recent_notes: []
      };

    } else if (user.role === 'DOCTOR') {
      // Thống kê cho bác sĩ
      const patientCount = user.assignmentsAsDoctor.length;
      
      // Lấy alerts gần đây (measurements với BP cao)
      const recentAlerts = await prisma.measurement.findMany({
        where: {
          user: {
            assignmentsAsPatient: {
              some: { doctorId: user.id }
            }
          },
          OR: [
            { sys: { gte: 140 } },
            { dia: { gte: 90 } }
          ],
          takenAt: {
            gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) // Last 7 days
          }
        },
        include: { user: true },
        orderBy: { takenAt: 'desc' },
        take: 5
      });

      roleSpecificData = {
        assigned_patients_count: patientCount,
        recent_alerts: recentAlerts.map(alert => 
          `${alert.user.name || 'Patient'}: ${alert.sys}/${alert.dia} mmHg`
        ),
        pending_reviews: recentAlerts.length
      };
    }

    // Tạo request payload cho chatbot
    const chatbotRequest: ChatbotRequest = {
      message: message,
      user_id: session.user.email,
      conversation_id: conversationId || `${session.user.email}_${Date.now()}`,
      language: "auto",  // Always auto-detect language from user message
      context: {
        user: userContext,
        role_specific_data: roleSpecificData,
        timestamp: new Date().toISOString(),
        session_metadata: {
          device_info: request.headers.get('user-agent') || undefined
        }
      }
    };

    // Gửi request đến enhanced chatbot backend
    const chatbotUrl = process.env.NEXT_PUBLIC_CHATBOT_URL || 'http://localhost:5001';
    const chatbotResponse = await fetch(`${chatbotUrl}/chat`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(chatbotRequest)
    });

    if (!chatbotResponse.ok) {
      throw new Error(`Chatbot service responded with status: ${chatbotResponse.status}`);
    }

    const data: ChatbotResponse = await chatbotResponse.json();

    return NextResponse.json({
      success: true,
      response: data.response,
      conversationId: data.conversation_id,
      suggestions: data.suggestions,
      requires_medical_attention: data.requires_medical_attention,
      detected_language: data.detected_language,
      data_insights: data.data_insights
    });

  } catch (error) {
    console.error('Enhanced Chatbot API error:', error);
    return NextResponse.json({ 
      success: false,
      error: 'Failed to process chat request',
      details: process.env.NODE_ENV === 'development' ? String(error) : undefined
    }, { status: 500 });
  }
}