import { prisma } from '@/lib/db';
import { Method } from '@prisma/client'; 
import { getServerSession } from 'next-auth'; 
import { authOptions } from '@/lib/auth';

export async function POST(req: Request) {
  const s = await getServerSession(authOptions); 
  if (!s?.user?.email) return new Response('Unauthorized', { status: 401 });
  
  const b = await req.json(); 
  const { sys, dia, pulse, method, piData, aiAnalysis, speechData, piTimestamp, deviceId } = b;
  
  if (!sys || !dia || !pulse) return new Response('Bad request', { status: 400 });
  
  const u = await prisma.user.findUnique({ where: { email: s.user.email } }); 
  if (!u) return new Response('Unauthorized', { status: 401 });
  
  // Determine measurement method using Prisma enum
  let measurementMethod: Method = Method.MANUAL;
  if (method === 'BLUETOOTH') measurementMethod = Method.BLUETOOTH;
  // PI_AUTOMATED will be available after migration
  // if (method === 'PI_AUTOMATED' || piData) measurementMethod = Method.PI_AUTOMATED;
  
  const m = await prisma.measurement.create({ 
    data: { 
      userId: u.id, 
      sys: Number(sys), 
      dia: Number(dia), 
      pulse: Number(pulse), 
      method: measurementMethod
      // Pi fields - will be available after migration
      // deviceId: deviceId || piData?.deviceId || null,
      // aiAnalysis: aiAnalysis || null,
      // speechData: speechData || aiAnalysis?.speechData || null,
      // piTimestamp: piTimestamp ? new Date(piTimestamp) : (piData?.timestamp ? new Date(piData.timestamp) : null)
    } 
  });
  
  return new Response(JSON.stringify({ success: true, measurement: m }), { 
    headers: { 'Content-Type': 'application/json' } 
  });
}
