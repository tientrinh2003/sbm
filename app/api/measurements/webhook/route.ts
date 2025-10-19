import { prisma } from '@/lib/db';
import { Method } from '@prisma/client';

export async function POST(req:Request){
  const secret = process.env.WEBHOOK_SECRET||''; const auth=req.headers.get('authorization')||'';
  if(!auth.endsWith(secret)) return new Response('Unauthorized',{status:401});
  const b=await req.json();
  const { userKey, sys, dia, pulse, telemetry } = b;
  if(!userKey||!sys||!dia||!pulse) return new Response('Bad request',{status:400});
  const user = await prisma.user.findFirst({ where:{ OR:[{email:userKey},{phone:userKey},{id:userKey}] } });
  if(!user) return new Response('User not found',{status:404});
  const m = await prisma.measurement.create({ data:{ userId:user.id, sys, dia, pulse, method: Method.BLUETOOTH } });
  // Optionally write telemetry -> AuditLog/Notification
  await prisma.auditLog.create({ data:{ userId: user.id, action:'WEBHOOK_BP', meta: telemetry||{} } });
  return new Response(JSON.stringify({ ok:true, id:m.id }), { headers:{'Content-Type':'application/json'} });
}
