import { getServerSession } from 'next-auth'; import { authOptions } from '@/lib/auth';
declare global { var __simLoops: Record<string,{t:any}>|undefined }
const g:any = globalThis as any;
if(!g.__simLoops) g.__simLoops = {};

export async function POST(){
  const s=await getServerSession(authOptions); const email=s?.user?.email||''; if(!email) return new Response('Unauthorized',{status:401});
  const key = email; const it = g.__simLoops[key];
  if(it){ clearInterval(it.t); delete g.__simLoops[key]; }
  return new Response(JSON.stringify({stopped:true}),{headers:{'Content-Type':'application/json'}});
}
