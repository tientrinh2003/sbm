// Demo page để test Enhanced Chatbot Integration
// File: app/demo/chat/page.tsx

'use client';

import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';
import EnhancedChatInterface from '@/components/EnhancedChatInterface';

export default function ChatDemoPage() {
  const { data: session, status } = useSession();
  const router = useRouter();

  useEffect(() => {
    if (status === 'loading') return; // Still loading
    if (!session) router.push('/login'); // Not authenticated
  }, [session, status, router]);

  if (status === 'loading') {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (!session) {
    return null; // Will redirect to login
  }

  const userRole = (session as any)?.role;
  
  // Role-specific configuration
  const roleConfig = {
    PATIENT: {
      title: "SmartBP Health Assistant",
      placeholder: "Hỏi về huyết áp, sức khỏe của bạn...",
      context: {
        showMeasurements: true,
        showPatientInsights: true
      }
    },
    DOCTOR: {
      title: "Clinical Decision Support",
      placeholder: "Hỏi về bệnh nhân, chẩn đoán, điều trị...",
      context: {
        showDoctorSummary: true
      }
    },
    ADMIN: {
      title: "System Management Assistant", 
      placeholder: "Hỏi về hệ thống, quản lý, báo cáo...",
      context: {}
    }
  };

  const config = roleConfig[userRole as keyof typeof roleConfig] || roleConfig.PATIENT;

  return (
    <div className="container mx-auto px-4 py-6">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="mb-6 text-center">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Enhanced Chatbot Demo
          </h1>
          <p className="text-gray-600">
            Test new AI assistant with role-based context và medical data integration
          </p>
          <div className="mt-4 p-4 bg-blue-50 rounded-lg">
            <p className="text-sm text-blue-800">
              <strong>Current User:</strong> {session.user?.name || session.user?.email} 
              <span className="ml-2 px-2 py-1 bg-blue-200 rounded-full text-xs">
                {userRole}
              </span>
            </p>
          </div>
        </div>

        {/* Chat Interface */}
        <div className="bg-white rounded-lg shadow-lg">
          <EnhancedChatInterface
            title={config.title}
            placeholder={config.placeholder}
            roleContext={config.context}
          />
        </div>

        {/* Testing Guide */}
        <div className="mt-6 p-6 bg-gray-50 rounded-lg">
          <h3 className="text-lg font-semibold mb-4">🧪 Testing Guide</h3>
          
          {userRole === 'PATIENT' && (
            <div className="space-y-2">
              <p className="font-medium">Test Patient Features:</p>
              <ul className="list-disc list-inside text-sm text-gray-700 space-y-1">
                <li>Hỏi về huyết áp: "Huyết áp của tôi thế nào?"</li>
                <li>Tư vấn sức khỏe: "Tôi nên làm gì để giảm huyết áp?"</li>
                <li>Hướng dẫn đo: "Cách đo huyết áp đúng như thế nào?"</li>
                <li>Triệu chứng: "Tôi bị đau đầu có liên quan đến huyết áp không?"</li>
              </ul>
            </div>
          )}
          
          {userRole === 'DOCTOR' && (
            <div className="space-y-2">
              <p className="font-medium">Test Doctor Features:</p>
              <ul className="list-disc list-inside text-sm text-gray-700 space-y-1">
                <li>Phân tích bệnh nhân: "Bệnh nhân nào cần chú ý?"</li>
                <li>Hỗ trợ chẩn đoán: "Huyết áp 160/100 nên điều trị thế nào?"</li>
                <li>Theo dõi: "Cách đánh giá xu hướng huyết áp bệnh nhân?"</li>
                <li>Guidelines: "Hướng dẫn điều trị tăng huyết áp mới nhất?"</li>
              </ul>
            </div>
          )}
          
          {userRole === 'ADMIN' && (
            <div className="space-y-2">
              <p className="font-medium">Test Admin Features:</p>
              <ul className="list-disc list-inside text-sm text-gray-700 space-y-1">
                <li>Quản lý hệ thống: "Số lượng người dùng hiện tại?"</li>
                <li>Troubleshooting: "Cách xử lý lỗi kết nối Bluetooth?"</li>
                <li>Báo cáo: "Thống kê sử dụng hệ thống?"</li>
                <li>Cấu hình: "Cách thêm thiết bị mới?"</li>
              </ul>
            </div>
          )}
          
          <div className="mt-4 p-3 bg-yellow-100 rounded text-sm text-yellow-800">
            <strong>Note:</strong> AI responses sẽ include context từ database thực tế của bạn
            (measurements, assignments, user profile). Check network tab để xem API calls.
          </div>
        </div>
      </div>
    </div>
  );
}