import { bus } from './eventbus';

export function streamFor(userKey: string) {
  const encoder = new TextEncoder();
  let heartbeatInterval: NodeJS.Timeout | null = null;
  let isClosed = false;
  
  const stream = new ReadableStream({
    start(controller) {
      const send = (data: any) => {
        if (!isClosed) {
          try {
            controller.enqueue(encoder.encode(`data: ${JSON.stringify(data)}\n\n`));
          } catch (error) {
            console.error('SSE send error:', error);
            cleanup();
          }
        }
      };
      
      const handler = (evt: any) => {
        if (evt?.userKey === userKey) send(evt);
      };
      
      const cleanup = () => {
        if (isClosed) return;
        isClosed = true;
        
        if (heartbeatInterval) {
          clearInterval(heartbeatInterval);
          heartbeatInterval = null;
        }
        
        bus.off('telemetry', handler);
        bus.off('bp', handler);
      };
      
      // Setup event listeners
      bus.on('telemetry', handler);
      bus.on('bp', handler);
      
      // Setup heartbeat with error handling
      heartbeatInterval = setInterval(() => {
        if (!isClosed) {
          try {
            controller.enqueue(encoder.encode(`: ping\n\n`));
          } catch (error) {
            console.error('SSE heartbeat error:', error);
            cleanup();
          }
        }
      }, 15000);
      
      // Store cleanup function
      (controller as any)._cleanup = cleanup;
    },
    
    cancel() {
      const cleanup = (this as any)?._cleanup;
      if (cleanup) cleanup();
    }
  });
  
  return stream;
}
