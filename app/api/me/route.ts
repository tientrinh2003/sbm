import { getServerSession } from 'next-auth'; import { authOptions } from '@/lib/auth';
export async function GET(){ const s=await getServerSession(authOptions); return new Response(JSON.stringify(s||null),{headers:{'Content-Type':'application/json'}}); }
