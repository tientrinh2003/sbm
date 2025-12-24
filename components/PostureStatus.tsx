'use client';
import { useEffect, useState } from 'react';

interface AISpeechStatus {
  status: string;           // 'speaking' | 'quiet' | 'no_data' | 'error'
  confidence: number;       // probability of predicted class
  color?: string;           // optional color mapping
  timestamp?: number;       // seconds epoch from backend
  is_speaking?: boolean;    // convenience flag
}

interface AIStatus {
  speech?: AISpeechStatus;
  posture?: string;
  cuff?: string;
  mouth?: string;
}

export default function PostureStatus({tele, piHost = '192.168.22.70', cameraActive = false}:{tele:Record<string,any>, piHost?: string, cameraActive?: boolean}){
  const [aiStatus, setAiStatus] = useState<AIStatus>({});
  
  // Only fetch AI status when camera is active
  useEffect(() => {
    if (!cameraActive) {
      // Reset AI status when camera not active
      setAiStatus({});
      return;
    }
    
    const fetchAiStatus = async () => {
      try {
        const response = await fetch(`/api/pi-proxy/ai-status?host=${piHost}`);
        if (!response.ok) {
          console.error('❌ AI status HTTP error:', response.status, response.statusText);
          setAiStatus({});
          return;
        }
        const raw = await response.json();
        console.log('🔍 Raw API response:', raw); // Debug log
        // Backend returns: { is_speaking, confidence, status, timestamp }
        // Normalize to aiStatus.speech shape expected by UI
        if (raw && typeof raw === 'object' && 'status' in raw) {
          const normalized: AIStatus = {
            speech: {
              status: raw.status, // keep original ('speaking' | 'quiet' | ...)
              confidence: Number(raw.confidence) || 0,
              timestamp: Number(raw.timestamp) || undefined,
              is_speaking: !!raw.is_speaking,
              color: raw.status === 'speaking' ? 'red' : 'green'
            }
          };
          console.log('✅ Normalized speech:', normalized.speech); // Debug log
          setAiStatus(normalized);
        } else {
          setAiStatus({});
        }
      } catch (err) {
        console.error('❌ AI status fetch error:', err);
        setAiStatus({});
      }
    };
    
    fetchAiStatus();
    const interval = setInterval(fetchAiStatus, 1000); // 1 second polling
    
    return () => {
      clearInterval(interval);
    };
  }, [piHost, cameraActive]);
  
  // Convert AI status to Vietnamese display
  const convertSpeechStatus = (status: string) => {
    switch (status) {
      case 'speaking': return 'Đang nói chuyện';
      case 'quiet':
      case 'not_speaking': return 'Im lặng';
      case 'no_backend': return 'Đang kết nối...';
      case 'no_data': return 'Đang phát hiện...';
      case 'error': return 'Lỗi';
      default: return 'Im lặng';
    }
  };
  
  const speechStatus = aiStatus.speech?.status ? 
    convertSpeechStatus(aiStatus.speech.status) : 
    'Đang phát hiện...';
    
  const isSpeaking = aiStatus.speech?.status === 'speaking';
  const confidence = (aiStatus.speech && aiStatus.speech.confidence !== undefined)
    ? (aiStatus.speech.confidence * 100).toFixed(0)
    : '0';
  
  // Format timestamp for display
  const getTimeAgo = (timestamp: number) => {
    if (!timestamp) return '';
    const now = Date.now() / 1000;
    const diff = now - timestamp;
    if (diff < 2) return ' 🟢';
    if (diff < 5) return ` (${diff.toFixed(0)}s)`;
    return ' 🔴';
  };
  
  const timeIndicator = aiStatus.speech?.timestamp ? getTimeAgo(aiStatus.speech.timestamp) : '';
  
  return (
    <div className="flex items-center justify-between p-4">
      <div className="flex items-center gap-3">
        <span className="text-3xl">{isSpeaking ? '🔴' : '🟢'}</span>
        <div>
          <div className="text-lg font-semibold">{speechStatus}</div>
          <div className="text-sm text-gray-500">Độ tin cậy: {confidence}%</div>
        </div>
      </div>
      {isSpeaking && (
        <div className="text-sm text-red-600 font-medium animate-pulse">
          ⚠️ Vui lòng giữ im lặng
        </div>
      )}
    </div>
  );
}
