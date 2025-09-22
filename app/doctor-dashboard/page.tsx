import Sidebar from '@/components/Sidebar'; import { getServerSession } from 'next-auth'; import { authOptions } from '@/lib/auth'; import { prisma } from '@/lib/db'; import { redirect } from 'next/navigation'; import Link from 'next/link';
export default async function DoctorDashboard(){
  const s=await getServerSession(authOptions); const r=(s as any)?.role; if(!s) redirect('/login'); if(r!=='DOCTOR') redirect('/forbidden');
  const me=await prisma.user.findUnique({ where:{ email: s.user?.email || '' } }); if(!me) redirect('/forbidden');
  const list=await prisma.assignment.findMany({ where:{ doctorId: me.id }, include:{ patient:true } });
  return (<div className="grid gap-6 md:grid-cols-[16rem_1fr]">
    <Sidebar role="DOCTOR"/>
    <div className="grid gap-4 md:grid-cols-3">
      {list.map(a=>(<Link key={a.id} href={`/doctor/patients/${a.patient.id}`} className="card hover:bg-slate-50"><div className="font-medium">{a.patient.name||a.patient.email}</div><div className="text-sm text-slate-500">{a.patient.email}</div></Link>))}
      {list.length===0 && <div className="text-sm text-slate-500">No patients.</div>}
    </div>
  </div>);
}
