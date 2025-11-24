'use client';

import { useEffect, useRef, useState } from 'react';
import { Button } from '@/components/ui/button';

interface CameraStreamProps {
  onCapture?: (imageData: string) => void;
  className?: string;
  piHost?: string; // Raspberry Pi IP address
  onConnectionChange?: (connected: boolean) => void; // Callback for connection status
  isActive?: boolean; // External control to start/stop stream
}

export default function CameraStream({ onCapture, className = '', piHost = '192.168.22.70', onConnectionChange, isActive = false }: CameraStreamProps) {
  const imgRef = useRef<HTMLImageElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  const [isStreaming, setIsStreaming] = useState(false);
  const [isCapturing, setIsCapturing] = useState(false);
  const [error, setError] = useState('');
  const [piStatus, setPiStatus] = useState<'connecting' | 'connected' | 'disconnected'>('disconnected');
  const [streamUrl, setStreamUrl] = useState('');
  const [isMounted, setIsMounted] = useState(false);
  const [manualMode, setManualMode] = useState(false); // Track if user manually started

  // Fix hydration mismatch
  useEffect(() => {
    setIsMounted(true);
  }, []);

  // Auto connect/disconnect when isActive changes (PRIORITY)
  useEffect(() => {
    if (isActive && !isStreaming) {
      console.log('🎬 Auto-starting stream (isActive=true) - FORCED by measurement');
      setManualMode(false); // Override manual mode
      connectToPiStream();
    } else if (!isActive && isStreaming && !manualMode) {
      // Only auto-stop if NOT in manual mode
      console.log('🛑 Auto-stopping stream (isActive=false)');
      disconnectStream();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isActive]);

  // Kết nối đến Pi camera stream
  const connectToPiStream = async () => {
    try {
      setError('');
      setPiStatus('connecting');
      
      // Check Pi server status via proxy to avoid CORS issues
      const response = await fetch(`/api/pi-proxy/health?host=${piHost}`);
      
      if (response.ok) {
        const data = await response.json();
        
        if (data.ok) {
          // Use MJPEG streaming with AI overlay (still direct to Pi for video stream)
          // Start monitoring services on Pi
          const startResponse = await fetch(`/api/pi-proxy/monitoring/start?host=${piHost}`, {
            method: 'POST'
          });
          
          if (startResponse.ok) {
            const startData = await startResponse.json();
            console.log('🎤 Started Pi monitoring:', startData.services);
          }
          
          setStreamUrl(`http://${piHost}:8000/api/camera/stream`);
          setPiStatus('connected');
          setIsStreaming(true);
          onConnectionChange?.(true); // Notify parent about connection
          console.log('✅ Connected to Pi MJPEG stream with AI detection:', data.backend);
          console.log('📹 Stream URL:', `http://${piHost}:8000/api/camera/stream`);
          
          // Force image load
          if (imgRef.current) {
            imgRef.current.src = `http://${piHost}:8000/api/camera/stream?t=${Date.now()}`;
            console.log('🔄 Forcing IMG src reload');
          }
        } else {
          throw new Error('Pi server health check failed');
        }
      } else {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.details || `Health check failed: ${response.status}`);
      }
    } catch (err: any) {
      console.error('❌ Pi connection error:', err);
      setPiStatus('disconnected');
      setIsStreaming(false);
      setError(`Không thể kết nối Pi (${piHost}): ${err.message}`);
    }
  };

  // Ngắt kết nối stream
  const disconnectStream = async () => {
    try {
      // Stop monitoring services on Pi
      const stopResponse = await fetch(`/api/pi-proxy/monitoring/stop?host=${piHost}`, {
        method: 'POST'
      });
      
      if (stopResponse.ok) {
        const stopData = await stopResponse.json();
        console.log('🔇 Stopped Pi monitoring:', stopData.message);
      }
    } catch (error) {
      console.error('Error stopping Pi monitoring:', error);
    }
    
    setStreamUrl('');
    setIsStreaming(false);
    setPiStatus('disconnected');
    onConnectionChange?.(false); // Notify parent about disconnection
    console.log('📴 Disconnected from Pi stream');
  };

  // Chụp ảnh từ Pi stream
  const capturePhoto = () => {
    if (!imgRef.current || !canvasRef.current || !isStreaming) {
      console.warn('Cannot capture: missing image/canvas or not streaming');
      return;
    }

    setIsCapturing(true);
    
    try {
      const img = imgRef.current;
      const canvas = canvasRef.current;
      const ctx = canvas.getContext('2d');

      if (!ctx) {
        throw new Error('Cannot get canvas context');
      }

      // Set canvas size to match image
      canvas.width = img.naturalWidth || 640;
      canvas.height = img.naturalHeight || 480;

      // Draw current image frame to canvas
      ctx.drawImage(img, 0, 0, canvas.width, canvas.height);

      // Convert to base64 image data
      const imageData = canvas.toDataURL('image/jpeg', 0.8);
      
      console.log(`📸 Photo captured from Pi stream: ${canvas.width}x${canvas.height}`);
      
      // Call callback if provided
      if (onCapture) {
        onCapture(imageData);
      }

      // Visual feedback
      setTimeout(() => setIsCapturing(false), 300);

    } catch (err) {
      console.error('Error capturing photo:', err);
      setError('❌ Lỗi chụp ảnh: ' + (err as Error).message);
      setIsCapturing(false);
    }
  };

    // Check Pi server status
  const checkPiStatus = async () => {
    try {
      const response = await fetch(`http://${piHost}:8000/`, {
        method: 'GET',
        signal: AbortSignal.timeout(5000) // 5s timeout
      });
      const data = await response.json();
      return data.success && data.data?.capabilities?.camera;
    } catch (err) {
      console.error('Pi status check failed:', err);
      return false;
    }
  };

  // Auto-connect to Pi stream on mount
  useEffect(() => {
    console.log('🚀 CameraStream component mounted - connecting to Pi');
    connectToPiStream();

    return () => {
      console.log('🧹 CameraStream cleanup');
      disconnectStream();
    };
  }, []);

  // Handle Pi host changes
  useEffect(() => {
    if (piHost && piStatus === 'disconnected') {
      connectToPiStream();
    }
  }, [piHost]);

  // Prevent hydration mismatch
  if (!isMounted) {
    return (
      <div className={`space-y-4 ${className}`}>
        <div className="flex items-center justify-between text-sm bg-gray-50 p-3 rounded">
          <div className="flex items-center gap-2">
            <span className="font-medium">🔄 Loading camera...</span>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={`space-y-4 ${className}`}>
      {/* Pi Connection Info */}
      <div className="flex items-center justify-between text-sm bg-blue-50 p-3 rounded">
        <div className="flex items-center gap-2">
          <span className="font-medium">� Raspberry Pi:</span>
          <span className="font-mono">{piHost}:8000</span>
        </div>
        <div className="flex items-center gap-2">
          <div className={`w-2 h-2 rounded-full ${
            piStatus === 'connected' ? 'bg-green-500' : 
            piStatus === 'connecting' ? 'bg-yellow-500' : 'bg-red-500'
          }`} />
          <span className={
            piStatus === 'connected' ? 'text-green-600' : 
            piStatus === 'connecting' ? 'text-yellow-600' : 'text-red-600'
          }>
            {piStatus === 'connected' ? 'Kết nối' : 
             piStatus === 'connecting' ? 'Đang kết nối...' : 'Ngắt kết nối'}
          </span>
        </div>
      </div>

      {/* Pi Camera Stream */}
      <div className="relative bg-black rounded-lg overflow-hidden aspect-video">
        {streamUrl && isStreaming ? (
          <img
            ref={imgRef}
            src={streamUrl}
            alt="Pi MJPEG Stream with AI Detection"
            className="w-full h-full object-cover"
            onLoad={() => {
              console.log('📹 Pi MJPEG stream loaded with AI overlay');
              setError('');
            }}
            onError={(e) => {
              console.error('❌ Pi MJPEG stream error:', e);
              setError(`Lỗi MJPEG stream từ Pi\nKiểm tra:\n• Server Pi đang chạy?\n• Endpoint /api/camera/stream có hoạt động?\n• Camera Pi có sẵn?`);
              setIsStreaming(false);
              // Retry connection after 3 seconds
              setTimeout(() => {
                console.log('🔄 Auto-retry Pi stream connection');
                connectToPiStream();
              }, 3000);
            }}
            crossOrigin="anonymous"
            style={{ 
              imageRendering: 'auto'
            }}
          />
        ) : (
          <div className="absolute inset-0 flex items-center justify-center bg-gray-900">
            <div className="text-center text-white p-4">
              <div className="text-4xl mb-2">📷</div>
              <div className="font-medium mb-2">Camera Raspberry Pi</div>
              <div className="text-sm text-gray-300 mb-4">
                {piStatus === 'connecting' ? 'Đang kết nối Pi...' : 
                 piStatus === 'connected' ? 'Đang tải stream...' :
                 'Chưa kết nối Pi'}
              </div>
            </div>
          </div>
        )}

        {/* Flash khi chụp */}
        {isCapturing && (
          <div className="absolute inset-0 bg-white opacity-60 animate-pulse" />
        )}

        {/* Overlay lỗi */}
        {error && (
          <div className="absolute inset-0 flex items-center justify-center bg-black/90">
            <div className="text-center text-white p-4 max-w-md space-y-3">
              <div className="text-3xl">⚠️</div>
              <div className="font-semibold">Lỗi kết nối Pi</div>
              <div className="text-xs text-gray-300 whitespace-pre-line leading-relaxed">
                {error}
              </div>
              <div className="flex gap-2 justify-center">
                <Button
                  size="sm"
                  className="bg-blue-600 hover:bg-blue-700"
                  onClick={connectToPiStream}
                >
                  🔄 Thử lại
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => checkPiStatus()}
                >
                  🔍 Kiểm tra Pi
                </Button>
              </div>
            </div>
          </div>
        )}

        {/* Status góc trên */}
        <div className="absolute top-2 left-2 px-2 py-1 rounded bg-black/70 text-xs text-white">
          {isStreaming ? '🟢 Pi Live' : '⏸️ Offline'}
        </div>
      </div>

      {/* Nút điều khiển */}
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <div className="flex gap-2 flex-wrap">
          <Button
            onClick={() => {
              setManualMode(true); // Enter manual mode
              connectToPiStream();
            }}
            disabled={isStreaming || piStatus === 'connecting' || isActive}
            size="sm"
            className="bg-green-600 hover:bg-green-700 disabled:bg-gray-400"
            title={isActive ? 'Đang đo huyết áp - camera bắt buộc bật' : ''}
          >
            {isStreaming ? '✅ Đang stream' : 
             piStatus === 'connecting' ? '⏳ Đang kết nối...' : 
             '▶️ Kết nối Pi'}
          </Button>

          <Button
            onClick={() => {
              setManualMode(false); // Exit manual mode
              disconnectStream();
            }}
            disabled={!isStreaming || isActive}
            size="sm"
            className="bg-red-600 hover:bg-red-700 disabled:bg-gray-400"
            title={isActive ? 'Đang đo huyết áp - không thể tắt camera' : ''}
          >
            ⏹️ Ngắt kết nối
          </Button>

          {onCapture && (
            <Button
              onClick={capturePhoto}
              disabled={!isStreaming || isCapturing}
              size="sm"
              className="bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400"
            >
              {isCapturing ? '📸 Đang chụp...' : '📸 Chụp ảnh'}
            </Button>
          )}
        </div>

        <div className="flex items-center gap-2 text-xs">
          <span className="text-gray-500">
            Pi Status: {piStatus}
          </span>
        </div>
      </div>

      {/* Canvas ẩn */}
      <canvas ref={canvasRef} className="hidden" />

      {/* Hướng dẫn */}
      <div className="text-xs text-gray-500 bg-gray-50 p-2 rounded">
        � Camera stream từ Raspberry Pi. Đảm bảo Pi đang chạy và có thể truy cập qua mạng.
        IP Pi hiện tại: <span className="font-mono">{piHost}:8000</span>
      </div>
    </div>
  );
}
