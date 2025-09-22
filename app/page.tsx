import { getServerSession } from 'next-auth'; import { authOptions } from '@/lib/auth'; import { redirect } from 'next/navigation';
export default async function Home(){
  const s=await getServerSession(authOptions); const r=(s as any)?.role;
  if(!s) redirect('/login');
  if(r==='PATIENT') redirect('/patient-dashboard');
  if(r==='DOCTOR') redirect('/doctor-dashboard');
  if(r==='ADMIN') redirect('/admin-dashboard');
  return null;
}
