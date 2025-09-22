import { prisma } from '@/lib/db'; import { getServerSession } from 'next-auth'; import { authOptions } from '@/lib/auth';
export async function POST(req:Request){ const s=await getServerSession(authOptions); if(!s?.user?.email) return new Response('Unauthorized',{status:401});
  const b=await req.json(); const { sys, dia, pulse, method } = b; if(!sys||!dia||!pulse) return new Response('Bad request',{status:400});
  const u=await prisma.user.findUnique({ where:{ email: s.user.email } }); if(!u) return new Response('Unauthorized',{status:401});
  const m=await prisma.measurement.create({ data:{ userId: u.id, sys:Number(sys), dia:Number(dia), pulse:Number(pulse), method: method==='BLUETOOTH'?'BLUETOOTH':'MANUAL' } });
  return new Response(JSON.stringify(m),{headers:{'Content-Type':'application/json'}});
}
