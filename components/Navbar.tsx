'use client';
import Link from 'next/link'; import { usePathname } from 'next/navigation';
export default function Navbar(){
  const pathname=usePathname();
  return (<header className="border-b border-[--color-border] bg-white/70 backdrop-blur sticky top-0 z-40">
    <div className="container h-14 flex items-center justify-between">
      <div className="flex items-center gap-3">
        <Link href="/" className="font-semibold">SmartBP</Link>
        <span className="hidden md:inline text-slate-400">/</span>
        <span className="hidden md:inline text-sm text-slate-500">{pathname}</span>
      </div>
      <form action="/api/auth/signout" method="post"><button className="text-red-600 hover:underline">Logout</button></form>
    </div>
  </header>);
}
