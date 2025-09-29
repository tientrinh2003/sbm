import Sidebar from '@/components/Sidebar';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { redirect } from 'next/navigation';
import EnhancedChatInterface from '@/components/EnhancedChatInterface';

export default async function PatientChat() {
  const session = await getServerSession(authOptions);
  const role = (session as any)?.role;
  
  if (!session) redirect('/login');
  if (role !== 'PATIENT') redirect('/forbidden');

  const patientPrompt = `Bạn là trợ lý AI chuyên biệt cho bệnh nhân của hệ thống SmartBP. 
Nhiệm vụ của bạn là:
- Tư vấn về huyết áp, sức khỏe tim mạch
- Hướng dẫn sử dụng thiết bị đo huyết áp
- Giải thích các chỉ số huyết áp
- Khuyến cáo lối sống lành mạnh
- Hỗ trợ sử dụng tính năng của hệ thống
- Lưu ý: Không thay thế lời khuyên y tế chuyên nghiệp

Hãy trả lời một cách thân thiện, chuyên nghiệp và dễ hiểu.`;

  return (
    <div className="grid gap-6 md:grid-cols-[16rem_1fr]">
      <Sidebar role="PATIENT" />
      <div className="space-y-6">
        {/* Header */}
        <div className="card">
          <div className="flex items-center gap-3 mb-2">
            <span className="text-2xl">🤖</span>
            <h1 className="text-xl font-semibold text-gray-900">
              AI Trợ lý sức khỏe
            </h1>
          </div>
          <p className="text-gray-600">
            Tư vấn về huyết áp, hướng dẫn sử dụng hệ thống và chăm sóc sức khỏe tim mạch
          </p>
        </div>

        {/* Chat Interface */}
        <div className="card p-0">
          <EnhancedChatInterface
            title="SmartBP Health Assistant"
            placeholder="Hỏi về huyết áp, cách đo, ý nghĩa các chỉ số..."
            roleContext={{
              showMeasurements: true,
              showPatientInsights: true
            }}
          />
        </div>

        {/* Quick Questions */}
        <div className="card">
          <h2 className="text-lg font-semibold mb-4">💡 Câu hỏi thường gặp</h2>
          <div className="grid gap-2 md:grid-cols-2">
            <button className="text-left p-3 bg-blue-50 hover:bg-blue-100 rounded-lg text-sm transition-colors">
              "Chỉ số huyết áp của tôi có nghĩa là gì?"
            </button>
            <button className="text-left p-3 bg-blue-50 hover:bg-blue-100 rounded-lg text-sm transition-colors">
              "Tôi nên đo huyết áp khi nào trong ngày?"
            </button>
            <button className="text-left p-3 bg-blue-50 hover:bg-blue-100 rounded-lg text-sm transition-colors">
              "Làm sao để giảm huyết áp tự nhiên?"
            </button>
            <button className="text-left p-3 bg-blue-50 hover:bg-blue-100 rounded-lg text-sm transition-colors">
              "Cách sử dụng thiết bị đo huyết áp Bluetooth"
            </button>
          </div>
        </div>

        {/* Health Tips */}
        <div className="card">
          <h2 className="text-lg font-semibold mb-3">🏥 Lưu ý quan trọng</h2>
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
            <div className="flex items-start gap-2">
              <span className="text-yellow-600 text-sm">⚠️</span>
              <div className="text-sm text-yellow-800">
                <strong>Khuyến cáo:</strong> AI chỉ hỗ trợ thông tin tham khảo. 
                Luôn tham khảo ý kiến bác sĩ cho các vấn đề sức khỏe nghiêm trọng.
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}