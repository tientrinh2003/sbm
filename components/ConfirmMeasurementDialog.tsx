'use client';

interface ConfirmMeasurementDialogProps {
  isOpen: boolean;
  data: {
    sys: number;
    dia: number;
    pulse: number;
  } | null;
  onConfirm: () => void;
  onCancel: () => void;
}

export default function ConfirmMeasurementDialog({ 
  isOpen, 
  data, 
  onConfirm, 
  onCancel 
}: ConfirmMeasurementDialogProps) {
  if (!isOpen || !data) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4 shadow-xl">
        <h3 className="text-xl font-semibold text-center mb-4">
          ✅ Đo huyết áp thành công
        </h3>
        
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
          <div className="space-y-3">
            <div className="flex justify-between items-center">
              <span className="text-gray-600">Huyết áp tâm thu (SYS):</span>
              <span className="text-2xl font-bold text-red-600">{data.sys}</span>
              <span className="text-gray-500">mmHg</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-gray-600">Huyết áp tâm trương (DIA):</span>
              <span className="text-2xl font-bold text-blue-600">{data.dia}</span>
              <span className="text-gray-500">mmHg</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-gray-600">Nhịp tim (Pulse):</span>
              <span className="text-2xl font-bold text-green-600">{data.pulse}</span>
              <span className="text-gray-500">bpm</span>
            </div>
          </div>
        </div>

        <p className="text-center text-gray-600 mb-6">
          Bạn có muốn lưu kết quả này vào hồ sơ không?
        </p>

        <div className="flex gap-3">
          <button
            onClick={onCancel}
            className="flex-1 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
          >
            ❌ Không lưu
          </button>
          <button
            onClick={onConfirm}
            className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            ✅ Xác nhận & Lưu
          </button>
        </div>
      </div>
    </div>
  );
}
