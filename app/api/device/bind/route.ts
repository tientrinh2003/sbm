import { prisma } from '@/lib/db'; import { getServerSession } from 'next-auth'; import { authOptions } from '@/lib/auth';
export async function POST(req:Request){ const s=await getServerSession(authOptions); if(!s?.user?.email) return new Response('Unauthorized',{status:401});
  const { mac, piHost } = await req.json(); const u=await prisma.user.findUnique({ where:{ email: s.user.email } }); if(!u) return new Response('Unauthorized',{status:401});
  await prisma.deviceBinding.upsert({ where:{ userId: u.id }, update:{ mac, piHost }, create:{ userId: u.id, mac, piHost } });
  return new Response('OK');
}
