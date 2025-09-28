import Sidebar from '@/components/Sidebar';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { redirect } from 'next/navigation';
import ChatInterface from '@/components/ChatInterface';

export default async function AdminChat() {
  const session = await getServerSession(authOptions);
  const role = (session as any)?.role;
  
  if (!session) redirect('/login');
  if (role !== 'ADMIN') redirect('/forbidden');

  const adminPrompt = `Bạn là trợ lý AI chuyên biệt cho quản trị viên hệ thống SmartBP.
Nhiệm vụ của bạn là:
- Hỗ trợ quản lý hệ thống và người dùng
- Phân tích dữ liệu thống kê và báo cáo
- Hướng dẫn cấu hình hệ thống
- Xử lý sự cố kỹ thuật
- Tối ưu hóa hiệu năng
- Bảo mật và tuân thủ quy định
- Quản lý Raspberry Pi và thiết bị IoT

Hãy trả lời với tính kỹ thuật cao và hướng đến giải pháp thực tế.`;

  return (
    <div className="grid gap-6 md:grid-cols-[16rem_1fr]">
      <Sidebar role="ADMIN" />
      <div className="space-y-6">
        {/* Header */}
        <div className="card">
          <div className="flex items-center gap-3 mb-2">
            <span className="text-2xl">👑</span>
            <h1 className="text-xl font-semibold text-gray-900">
              AI System Administrator
            </h1>
          </div>
          <p className="text-gray-600">
            Hỗ trợ quản lý hệ thống, phân tích dữ liệu và xử lý sự cố kỹ thuật
          </p>
        </div>

        {/* Chat Interface */}
        <div className="card p-0">
          <ChatInterface
            title="SmartBP System AI"
            placeholder="Hỏi về quản lý hệ thống, thống kê, cấu hình, troubleshooting..."
            systemPrompt={adminPrompt}
          />
        </div>

        {/* Admin Tools */}
        <div className="card">
          <h2 className="text-lg font-semibold mb-4">🛠️ Công cụ quản trị</h2>
          <div className="grid gap-2 md:grid-cols-2">
            <button className="text-left p-3 bg-purple-50 hover:bg-purple-100 rounded-lg text-sm transition-colors">
              "Phân tích hiệu năng hệ thống"
            </button>
            <button className="text-left p-3 bg-purple-50 hover:bg-purple-100 rounded-lg text-sm transition-colors">
              "Cách backup dữ liệu hệ thống"
            </button>
            <button className="text-left p-3 bg-purple-50 hover:bg-purple-100 rounded-lg text-sm transition-colors">
              "Troubleshoot kết nối Raspberry Pi"
            </button>
            <button className="text-left p-3 bg-purple-50 hover:bg-purple-100 rounded-lg text-sm transition-colors">
              "Tối ưu database queries"
            </button>
            <button className="text-left p-3 bg-purple-50 hover:bg-purple-100 rounded-lg text-sm transition-colors">
              "Cấu hình MQTT và Bluetooth"
            </button>
            <button className="text-left p-3 bg-purple-50 hover:bg-purple-100 rounded-lg text-sm transition-colors">
              "Quản lý logs và monitoring"
            </button>
          </div>
        </div>

        {/* System Status */}
        <div className="card">
          <h2 className="text-lg font-semibold mb-3">📊 Trạng thái hệ thống</h2>
          <div className="grid gap-3 md:grid-cols-3">
            <div className="bg-green-50 border border-green-200 rounded-lg p-3">
              <div className="flex items-center gap-2 mb-1">
                <span className="w-2 h-2 bg-green-500 rounded-full"></span>
                <span className="text-sm font-medium text-green-800">Chatbot API</span>
              </div>
              <div className="text-xs text-green-700">Hoạt động bình thường</div>
            </div>
            
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
              <div className="flex items-center gap-2 mb-1">
                <span className="w-2 h-2 bg-blue-500 rounded-full"></span>
                <span className="text-sm font-medium text-blue-800">Database</span>
              </div>
              <div className="text-xs text-blue-700">Kết nối ổn định</div>
            </div>
            
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3">
              <div className="flex items-center gap-2 mb-1">
                <span className="w-2 h-2 bg-yellow-500 rounded-full"></span>
                <span className="text-sm font-medium text-yellow-800">Storage</span>
              </div>
              <div className="text-xs text-yellow-700">Sử dụng 67%</div>
            </div>
          </div>
        </div>

        {/* Technical Notice */}
        <div className="card">
          <h2 className="text-lg font-semibold mb-3">🔧 Lưu ý kỹ thuật</h2>
          <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
            <div className="flex items-start gap-2">
              <span className="text-gray-600 text-sm">💻</span>
              <div className="text-sm text-gray-800">
                <strong>System AI:</strong> Hỗ trợ troubleshooting và tối ưu hóa. 
                Luôn kiểm tra logs chi tiết và backup trước khi thực hiện thay đổi quan trọng.
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}