import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { redirect } from 'next/navigation';

export default async function PatientMonitoring() {
  const session = await getServerSession(authOptions);
  
  if (!session) {
    redirect('/login');
  }
  
  if ((session as any).role !== 'PATIENT') {
    redirect('/forbidden');
  }

  return (
    <div>
      <h1 className="text-2xl font-bold mb-4">Blood Pressure Monitoring</h1>
      <p>Start your blood pressure monitoring session</p>
    </div>
  );
}