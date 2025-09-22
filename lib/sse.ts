import { bus } from './eventbus';
export function streamFor(userKey:string){
  const encoder = new TextEncoder();
  const stream = new ReadableStream({
    start(controller){
      const send = (data:any)=>{ controller.enqueue(encoder.encode(`data: ${JSON.stringify(data)}\n\n`)); };
      const handler = (evt:any)=>{ if(evt?.userKey===userKey) send(evt); };
      bus.on('telemetry', handler); bus.on('bp', handler);
      // heartbeat
      const hb = setInterval(()=>controller.enqueue(encoder.encode(`: ping\n\n`)), 15000);
      (controller as any)._cleanup = ()=>{ clearInterval(hb); bus.off('telemetry', handler); bus.off('bp', handler); };
    },
    cancel(){ (this as any)?._cleanup?.(); }
  });
  return stream;
}
