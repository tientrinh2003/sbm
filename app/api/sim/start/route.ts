import { bus } from '@/lib/eventbus';
import { getServerSession } from 'next-auth'; import { authOptions } from '@/lib/auth';

declare global { var __simLoops: Record<string,{t:any}>|undefined }
const g:any = globalThis as any;
if(!g.__simLoops) g.__simLoops = {};

export async function POST(){
  const s=await getServerSession(authOptions); const email=s?.user?.email||''; if(!email) return new Response('Unauthorized',{status:401});
  const key = email;
  if(g.__simLoops[key]) return new Response(JSON.stringify({running:true}),{headers:{'Content-Type':'application/json'}});

  // simple simulation loop
  const t = setInterval(()=>{
    const tele = {
      userKey:key,
      posture_ok: Math.random()>0.2,
      cuff_ok: Math.random()>0.5, // placeholder
      mouth_open: Math.random()>0.8? true:false,
      speak: Math.random()>0.7? true:false
    };
    bus.emit('telemetry', tele);

    // sometimes emit a BP reading
    if(Math.random()>0.6){
      const sys = 110 + Math.floor(Math.random()*40);
      const dia = 70 + Math.floor(Math.random()*25);
      const pulse = 60 + Math.floor(Math.random()*40);
      bus.emit('bp', { userKey:key, sys, dia, pulse });
    }
  }, 1500);
  g.__simLoops[key] = { t };
  return new Response(JSON.stringify({ok:true}),{headers:{'Content-Type':'application/json'}});
}
