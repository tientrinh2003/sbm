'use client';
import Link from 'next/link'; 
import { usePathname } from 'next/navigation';
import { signOut } from 'next-auth/react';
import { useState } from 'react';

export default function Navbar(){
  const pathname=usePathname();
  const [showConfirm, setShowConfirm] = useState(false);

  const handleSignOut = async () => {
    await signOut({ callbackUrl: '/login' });
  };

  return (
    <>
      <header className="border-b border-[--color-border] bg-white/70 backdrop-blur sticky top-0 z-40">
        <div className="container h-14 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Link href="/" className="font-semibold">SmartBP</Link>
          </div>
          <button 
            onClick={() => setShowConfirm(true)} 
            className="text-red-600 hover:underline"
          >
            Đăng xuất
          </button>
        </div>
      </header>

      {/* Custom Signout Confirmation Dialog */}
      {showConfirm && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-sm w-full mx-4 shadow-xl">
            <h3 className="text-xl font-semibold text-center mb-4">Đăng xuất</h3>
            <p className="text-center text-gray-600 mb-6">
              Bạn có chắc chắn muốn đăng xuất không?
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => setShowConfirm(false)}
                className="flex-1 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
              >
                Hủy
              </button>
              <button
                onClick={handleSignOut}
                className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                Đăng xuất
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
