import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { redirect } from 'next/navigation';

export default async function AdminUsers() {
  const session = await getServerSession(authOptions);
  
  if (!session) {
    redirect('/login');
  }
  
  if ((session as any).role !== 'ADMIN') {
    redirect('/forbidden');
  }

  return (
    <div>
      <h1 className="text-2xl font-bold mb-4">User Management</h1>
      <p>Admin users management page</p>
    </div>
  );
}