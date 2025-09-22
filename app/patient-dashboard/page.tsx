import Sidebar from '@/components/Sidebar'; import { getServerSession } from 'next-auth'; import { authOptions } from '@/lib/auth'; import { prisma } from '@/lib/db'; import { redirect } from 'next/navigation'; import Link from 'next/link'; import { Button } from '@/components/ui/button';
export default async function PatientDashboard(){
  const s=await getServerSession(authOptions); const r=(s as any)?.role; if(!s) redirect('/login'); if(r!=='PATIENT') redirect('/forbidden');
  const u = await prisma.user.findUnique({ where:{ email: s.user?.email || '' } });
  const latest = u ? await prisma.measurement.findFirst({ where:{ userId:u.id }, orderBy:{ takenAt:'desc' } }) : null;
  const count = u ? await prisma.measurement.count({ where:{ userId:u.id } }) : 0;
  return (<div className="grid gap-6 md:grid-cols-[16rem_1fr]">
    <Sidebar role="PATIENT"/>
    <div className="space-y-4">
      <div className="grid gap-4 md:grid-cols-3">
        <div className="card"><div className="text-sm text-slate-500">Patient</div><div className="text-lg font-semibold">{u?.name||s.user?.email}</div></div>
        <div className="card"><div className="text-sm text-slate-500">Measurements</div><div className="text-2xl font-bold">{count}</div></div>
        <div className="card"><div className="text-sm text-slate-500">Last result</div><div className="text-2xl font-bold">{latest? `${latest.sys}/${latest.dia} · ${latest.pulse} bpm`:'—'}</div></div>
      </div>
      <div className="card flex items-center justify-between"><div>Start your blood pressure monitoring</div><Link href="/patient/monitoring"><Button>Start</Button></Link></div>
    </div>
  </div>);
}
