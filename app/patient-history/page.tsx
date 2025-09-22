import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { redirect } from 'next/navigation';

export default async function PatientHistory() {
  const session = await getServerSession(authOptions);
  
  if (!session) {
    redirect('/login');
  }
  
  if ((session as any).role !== 'PATIENT') {
    redirect('/forbidden');
  }

  return (
    <div>
      <h1 className="text-2xl font-bold mb-4">Measurement History</h1>
      <p>View your blood pressure measurement history</p>
    </div>
  );
}