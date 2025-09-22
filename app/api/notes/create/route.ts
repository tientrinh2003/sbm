import { prisma } from '@/lib/db'; import { getServerSession } from 'next-auth'; import { authOptions } from '@/lib/auth';
export async function POST(req:Request){ const s=await getServerSession(authOptions); if(!s?.user?.email) return new Response('Unauthorized',{status:401});
  const me=await prisma.user.findUnique({ where:{ email: s.user.email } }); if(me?.role!=='DOCTOR') return new Response('Forbidden',{status:403});
  const { patientId, measurementId, content } = await req.json();
  const note = await prisma.note.create({ data:{ doctorId: me.id, patientId, measurementId, content } });
  return new Response(JSON.stringify(note),{headers:{'Content-Type':'application/json'}});
}
