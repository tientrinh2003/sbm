import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';

export async function POST(request: NextRequest) {
  try {
    // Kiểm tra authentication
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { message, conversationId } = body;

    if (!message) {
      return NextResponse.json({ error: 'Message is required' }, { status: 400 });
    }

    // Gửi request đến chatbot backend
    const chatbotResponse = await fetch('http://localhost:5000/chat', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        message: message,
        user_id: session.user.email,
        conversation_id: conversationId || `${session.user.email}_${Date.now()}`,
        context: {
          role: (session as any).role,
          timestamp: new Date().toISOString()
        }
      })
    });

    if (!chatbotResponse.ok) {
      throw new Error(`Chatbot service responded with status: ${chatbotResponse.status}`);
    }

    const data = await chatbotResponse.json();

    return NextResponse.json({
      success: true,
      response: data.response,
      conversationId: data.conversation_id || conversationId
    });

  } catch (error) {
    console.error('Chatbot API error:', error);
    return NextResponse.json({
      error: 'Failed to get chatbot response',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}