'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';

interface CapturePhotoDialogProps {
  isOpen: boolean;
  imageData: string;
  onClose: () => void;
  onSave?: (imageData: string, note: string) => void;
}

export default function CapturePhotoDialog({ 
  isOpen, 
  imageData, 
  onClose, 
  onSave 
}: CapturePhotoDialogProps) {
  const [note, setNote] = useState('');
  const [isSaving, setIsSaving] = useState(false);

  if (!isOpen) return null;

  const handleSave = async () => {
    if (!onSave) {
      onClose();
      return;
    }

    setIsSaving(true);
    try {
      await onSave(imageData, note);
      setNote('');
      onClose();
    } catch (error) {
      console.error('Error saving photo:', error);
      alert('Lỗi khi lưu ảnh');
    } finally {
      setIsSaving(false);
    }
  };

  const handleDownload = () => {
    try {
      const link = document.createElement('a');
      link.href = imageData;
      link.download = `patient-photo-${new Date().toISOString().slice(0, 19).replace(/:/g, '-')}.jpg`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch (error) {
      console.error('Error downloading photo:', error);
      alert('Lỗi khi tải ảnh');
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b">
          <h2 className="text-lg font-semibold">📸 Ảnh chụp từ camera</h2>
          <Button
            onClick={onClose}
            variant="ghost"
            size="sm"
            className="text-gray-500 hover:text-gray-700"
          >
            ✕
          </Button>
        </div>

        {/* Photo */}
        <div className="p-4">
          <div className="mb-4">
            <img
              src={imageData}
              alt="Captured photo"
              className="w-full rounded-lg border border-gray-200"
            />
          </div>

          {/* Note input */}
          <div className="mb-4">
            <label htmlFor="photo-note" className="block text-sm font-medium text-gray-700 mb-2">
              Ghi chú (tùy chọn):
            </label>
            <textarea
              id="photo-note"
              value={note}
              onChange={(e) => setNote(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
              rows={3}
              placeholder="Nhập ghi chú về ảnh này..."
            />
          </div>

          {/* Actions */}
          <div className="flex items-center justify-between gap-3">
            <div className="text-xs text-gray-500">
              📅 {new Date().toLocaleString('vi-VN')}
            </div>
            
            <div className="flex gap-2">
              <Button
                onClick={handleDownload}
                variant="outline"
                size="sm"
                className="flex items-center gap-1"
              >
                💾 Tải xuống
              </Button>
              
              {onSave && (
                <Button
                  onClick={handleSave}
                  disabled={isSaving}
                  size="sm"
                  className="bg-blue-600 hover:bg-blue-700 flex items-center gap-1"
                >
                  {isSaving ? '⏳ Đang lưu...' : '💾 Lưu vào hồ sơ'}
                </Button>
              )}
              
              <Button
                onClick={onClose}
                variant="ghost"
                size="sm"
              >
                Đóng
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}