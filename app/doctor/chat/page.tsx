import Sidebar from '@/components/Sidebar';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { redirect } from 'next/navigation';
import EnhancedChatInterface from '@/components/EnhancedChatInterface';

export default async function DoctorChat() {
  const session = await getServerSession(authOptions);
  const role = (session as any)?.role;
  
  if (!session) redirect('/login');
  if (role !== 'DOCTOR') redirect('/forbidden');

  const doctorPrompt = `Bạn là trợ lý AI chuyên biệt cho bác sĩ trong hệ thống SmartBP.
Nhiệm vụ của bạn là:
- Hỗ trợ phân tích dữ liệu huyết áp bệnh nhân
- Tư vấn về điều trị và theo dõi bệnh nhân
- Giải thích các mẫu hình huyết áp (patterns)
- Hướng dẫn sử dụng các tính năng quản lý bệnh nhân
- Cung cấp thông tin y khoa cập nhật về huyết áp
- Hỗ trợ ra quyết định lâm sàng

Hãy trả lời với tính chuyên nghiệp cao và dựa trên bằng chứng khoa học.`;

  return (
    <div className="grid gap-6 md:grid-cols-[16rem_1fr]">
      <Sidebar role="DOCTOR" />
      <div className="space-y-6">
        {/* Header */}
        <div className="card">
          <div className="flex items-center gap-3 mb-2">
            <span className="text-2xl">🩺</span>
            <h1 className="text-xl font-semibold text-gray-900">
              Trợ lý AI lâm sàng
            </h1>
          </div>
          <p className="text-gray-600">
            Hỗ trợ chẩn đoán, phân tích dữ liệu bệnh nhân và tư vấn lâm sàng
          </p>
        </div>

        {/* Chat Interface */}
        <div className="card p-0">
          <EnhancedChatInterface
            title="Trợ lý AI lâm sàng SmartBP"
            placeholder="Phân tích dữ liệu bệnh nhân, tư vấn điều trị, hướng dẫn lâm sàng..."
            roleContext={{
              showDoctorSummary: true
            }}
          />
        </div>

        {/* Clinical Tools removed as requested */}

        {/* Professional Notice */}
        <div className="card">
          <h2 className="text-lg font-semibold mb-3">⚕️ Lưu ý chuyên nghiệp</h2>
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <div className="flex items-start gap-2">
              <span className="text-blue-600 text-sm">ℹ️</span>
              <div className="text-sm text-blue-800">
                <strong>Trợ lý AI:</strong> Hỗ trợ ra quyết định, không thay thế 
                kinh nghiệm lâm sàng và đánh giá chuyên nghiệp của bác sĩ.
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}