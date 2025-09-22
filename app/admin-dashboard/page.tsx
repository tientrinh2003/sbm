import Sidebar from '@/components/Sidebar'; import { getServerSession } from 'next-auth'; import { authOptions } from '@/lib/auth'; import { prisma } from '@/lib/db'; import { redirect } from 'next/navigation';
export default async function Admin(){
  const s=await getServerSession(authOptions); const r=(s as any)?.role; if(!s) redirect('/login'); if(r!=='ADMIN') redirect('/forbidden');
  const users=await prisma.user.count(); const measures=await prisma.measurement.count();
  return (<div className="grid gap-6 md:grid-cols-[16rem_1fr]">
    <Sidebar role="ADMIN"/>
    <div className="grid gap-4 md:grid-cols-2">
      <div className="card"><div className="text-sm text-slate-500">Users</div><div className="text-2xl font-bold">{users}</div></div>
      <div className="card"><div className="text-sm text-slate-500">Measurements</div><div className="text-2xl font-bold">{measures}</div></div>
    </div>
  </div>);
}
