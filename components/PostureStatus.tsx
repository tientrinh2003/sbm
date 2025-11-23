'use client';
import { useEffect, useState } from 'react';

interface AIStatus {
  speech?: {
    status: string;
    confidence: number;
    color: string;
  };
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
        // Use proxy to avoid CORS issues
        const response = await fetch(`/api/pi-proxy/ai-status?host=${piHost}`);
        
        if (response.ok) {
          const data = await response.json();
          setAiStatus(data);
        } else {
          console.error('❌ AI status HTTP error:', response.status, response.statusText);
          // For legacy compatibility, set empty status on error
          setAiStatus(null);
        }
      } catch (error) {
        console.error('❌ AI status fetch error:', error);
        setAiStatus(null);
      }
    };
    
    fetchAiStatus();
    const interval = setInterval(fetchAiStatus, 300);
    
    return () => {
      clearInterval(interval);
    };
  }, [piHost, cameraActive]);
  
  const ok = (v:boolean|undefined, goodLabel:string, badLabel:string)=> v? <span className="badge badge-green">{goodLabel}</span> : <span className="badge badge-amber">{badLabel}</span>;
  
  // Convert AI status to Vietnamese display
  const convertSpeechStatus = (status: string) => {
    switch (status) {
      case 'speaking': return 'Đang nói';
      case 'not_speaking': return 'Im lặng';
      case 'no_backend': return 'Chưa kết nối AI';
      case 'error': return 'Lỗi AI';
      default: return tele.speak ? 'Đang nói' : 'Im lặng';
    }
  };
  
  const speechStatus = aiStatus.speech?.status ? 
    convertSpeechStatus(aiStatus.speech.status) : 
    (tele.speak ? 'Đang nói' : 'Im lặng');
    
  const speechColor = aiStatus.speech?.status === 'speaking' ? 'badge-red' : 'badge-green';
  const confidence = aiStatus.speech?.confidence ? ` (${(aiStatus.speech.confidence * 100).toFixed(0)}%)` : '';
  
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
  
  return (<div className="space-y-2 text-sm">
    <div>Posture: {ok(tele.posture_ok,'OK', aiStatus.posture || 'Điều chỉnh')}</div>
    <div>Cuff: {ok(tele.cuff_ok,'OK', aiStatus.cuff || 'Chưa xác định')}</div>
    <div>Mouth: {aiStatus.mouth ? <span className="badge badge-green">{aiStatus.mouth}</span> : (tele.mouth_open? <span className="badge badge-red">Mở</span> : <span className="badge badge-green">Đóng</span>)}</div>
    <div>Speech: <span className={`badge ${speechColor}`}>{speechStatus}{confidence}</span><span className="text-xs ml-1">{timeIndicator}</span></div>
  </div>);
}
