'use client';

import { useEffect, useRef, useState } from 'react';
import { Button } from '@/components/ui/button';

interface CameraStreamProps {
  onCapture?: (imageData: string) => void;
  className?: string;
}

export default function CameraStream({ onCapture, className = '' }: CameraStreamProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isStreaming, setIsStreaming] = useState(false);
  const [error, setError] = useState<string>('');
  const [hasPermission, setHasPermission] = useState<boolean | null>(null);
  const [devices, setDevices] = useState<MediaDeviceInfo[]>([]);
  const [selectedDevice, setSelectedDevice] = useState<string>('');
  const [isCapturing, setIsCapturing] = useState(false);

  // Get available camera devices
  const getCameraDevices = async () => {
    try {
      const devices = await navigator.mediaDevices.enumerateDevices();
      const videoDevices = devices.filter(device => device.kind === 'videoinput');
      setDevices(videoDevices);
      
      if (videoDevices.length > 0 && !selectedDevice) {
        setSelectedDevice(videoDevices[0].deviceId);
      }
    } catch (err) {
      console.error('Error getting camera devices:', err);
      setError('Không thể truy cập danh sách camera');
    }
  };

  // Start camera stream
  const startCamera = async (deviceId?: string) => {
    try {
      setError('');
      setIsStreaming(false);

      // Stop existing stream
      if (videoRef.current?.srcObject) {
        const stream = videoRef.current.srcObject as MediaStream;
        stream.getTracks().forEach(track => track.stop());
      }

      // Request camera access
      const constraints: MediaStreamConstraints = {
        video: {
          deviceId: deviceId ? { exact: deviceId } : undefined,
          width: { ideal: 1280 },
          height: { ideal: 720 },
          facingMode: deviceId ? undefined : 'user'
        },
        audio: false
      };

      const stream = await navigator.mediaDevices.getUserMedia(constraints);
      
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.onloadedmetadata = () => {
          videoRef.current?.play();
          setIsStreaming(true);
          setHasPermission(true);
        };
      }

    } catch (err: any) {
      console.error('Error starting camera:', err);
      setHasPermission(false);
      
      if (err.name === 'NotAllowedError') {
        setError('Quyền truy cập camera bị từ chối. Vui lòng cho phép truy cập camera.');
      } else if (err.name === 'NotFoundError') {
        setError('Không tìm thấy camera nào. Hãy kết nối camera và thử lại.');
      } else if (err.name === 'NotReadableError') {
        setError('Camera đang được sử dụng bởi ứng dụng khác.');
      } else {
        setError(`Lỗi camera: ${err.message}`);
      }
    }
  };

  // Stop camera stream
  const stopCamera = () => {
    if (videoRef.current?.srcObject) {
      const stream = videoRef.current.srcObject as MediaStream;
      stream.getTracks().forEach(track => track.stop());
      videoRef.current.srcObject = null;
    }
    setIsStreaming(false);
  };

  // Capture photo from video stream
  const capturePhoto = () => {
    if (!videoRef.current || !canvasRef.current || !isStreaming) return;

    setIsCapturing(true);
    
    try {
      const video = videoRef.current;
      const canvas = canvasRef.current;
      const ctx = canvas.getContext('2d');

      if (!ctx) return;

      // Set canvas size to match video
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;

      // Draw current video frame to canvas
      ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

      // Convert to base64 image data
      const imageData = canvas.toDataURL('image/jpeg', 0.8);
      
      // Call callback if provided
      if (onCapture) {
        onCapture(imageData);
      }

      // Visual feedback
      setTimeout(() => setIsCapturing(false), 300);

    } catch (err) {
      console.error('Error capturing photo:', err);
      setError('Lỗi chụp ảnh');
      setIsCapturing(false);
    }
  };

  // Initialize camera on component mount
  useEffect(() => {
    getCameraDevices();
  }, []);

  // Auto-start camera when device is selected
  useEffect(() => {
    if (selectedDevice) {
      startCamera(selectedDevice);
    }

    // Cleanup on unmount
    return () => {
      stopCamera();
    };
  }, [selectedDevice]);

  return (
    <div className={`space-y-4 ${className}`}>
      {/* Camera Selection */}
      {devices.length > 1 && (
        <div className="flex items-center gap-2 text-sm">
          <label htmlFor="camera-select" className="font-medium">
            📹 Camera:
          </label>
          <select
            id="camera-select"
            value={selectedDevice}
            onChange={(e) => setSelectedDevice(e.target.value)}
            className="px-2 py-1 border border-gray-300 rounded text-sm"
          >
            {devices.map((device, index) => (
              <option key={device.deviceId} value={device.deviceId}>
                {device.label || `Camera ${index + 1}`}
              </option>
            ))}
          </select>
        </div>
      )}

      {/* Video Stream */}
      <div className="relative bg-black rounded-lg overflow-hidden aspect-video">
        <video
          ref={videoRef}
          className="w-full h-full object-cover"
          playsInline
          muted
        />
        
        {/* Capture overlay effect */}
        {isCapturing && (
          <div className="absolute inset-0 bg-white opacity-60 animate-pulse" />
        )}

        {/* Error overlay */}
        {error && (
          <div className="absolute inset-0 flex items-center justify-center bg-gray-900 bg-opacity-75">
            <div className="text-center text-white p-4">
              <div className="text-4xl mb-2">📷</div>
              <div className="font-medium mb-2">Lỗi Camera</div>
              <div className="text-sm text-gray-300 mb-4">{error}</div>
              <Button
                onClick={() => startCamera(selectedDevice)}
                className="bg-blue-600 hover:bg-blue-700"
                size="sm"
              >
                Thử lại
              </Button>
            </div>
          </div>
        )}

        {/* Loading state */}
        {!isStreaming && !error && hasPermission !== false && (
          <div className="absolute inset-0 flex items-center justify-center bg-gray-900">
            <div className="text-center text-white">
              <div className="animate-spin text-4xl mb-2">⚙️</div>
              <div>Đang khởi động camera...</div>
            </div>
          </div>
        )}

        {/* No permission state */}
        {hasPermission === false && !error && (
          <div className="absolute inset-0 flex items-center justify-center bg-gray-900">
            <div className="text-center text-white p-4">
              <div className="text-4xl mb-2">🔐</div>
              <div className="font-medium mb-2">Cần quyền truy cập camera</div>
              <div className="text-sm text-gray-300 mb-4">
                Vui lòng cho phép truy cập camera để sử dụng tính năng này.
              </div>
              <Button
                onClick={() => startCamera(selectedDevice)}
                className="bg-green-600 hover:bg-green-700"
                size="sm"
              >
                Cho phép truy cập
              </Button>
            </div>
          </div>
        )}
      </div>

      {/* Controls */}
      <div className="flex items-center justify-between">
        <div className="flex gap-2">
          <Button
            onClick={() => startCamera(selectedDevice)}
            disabled={isStreaming}
            className="bg-green-600 hover:bg-green-700 disabled:bg-gray-400"
            size="sm"
          >
            {isStreaming ? '✅ Đang chạy' : '▶️ Bật camera'}
          </Button>
          
          <Button
            onClick={stopCamera}
            disabled={!isStreaming}
            className="bg-red-600 hover:bg-red-700 disabled:bg-gray-400"
            size="sm"
          >
            ⏹️ Tắt camera
          </Button>

          {onCapture && (
            <Button
              onClick={capturePhoto}
              disabled={!isStreaming || isCapturing}
              className="bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400"
              size="sm"
            >
              {isCapturing ? '📸 Đang chụp...' : '📸 Chụp ảnh'}
            </Button>
          )}
        </div>

        {/* Status indicator */}
        <div className="flex items-center gap-2 text-sm">
          <div className={`w-2 h-2 rounded-full ${isStreaming ? 'bg-green-500' : 'bg-gray-400'}`} />
          <span className={isStreaming ? 'text-green-600' : 'text-gray-500'}>
            {isStreaming ? 'Live' : 'Offline'}
          </span>
        </div>
      </div>

      {/* Hidden canvas for photo capture */}
      <canvas ref={canvasRef} className="hidden" />

      {/* Instructions */}
      <div className="text-xs text-gray-500 bg-gray-50 p-2 rounded">
        💡 <strong>Hướng dẫn:</strong> Cho phép truy cập camera khi trình duyệt hỏi. 
        Nếu không thấy camera, kiểm tra kết nối và thử refresh trang.
      </div>
    </div>
  );
}
