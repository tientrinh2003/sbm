'use client';
import Link from 'next/link'; import { usePathname } from 'next/navigation';
type Role='PATIENT'|'DOCTOR'|'ADMIN';
function Item({href,label}:{href:string;label:string}){ const p=usePathname(); const active=p.startsWith(href); return <Link href={href} className={`block rounded-xl px-3 py-2 text-sm ${active?'bg-[--color-primary]/10 text-[--color-primary]':'hover:bg-slate-100 text-slate-700'}`}>{label}</Link>; }
export default function Sidebar({role}:{role:Role}){
  const items = role==='PATIENT' ? [
    {href:'/patient-dashboard',label:'Dashboard'},
    {href:'/patient-monitoring',label:'Start Monitoring'},
    {href:'/patient-history',label:'History'},
    {href:'/tutorial',label:'Tutorial'}
  ] : role==='DOCTOR' ? [
    {href:'/doctor-dashboard',label:'Dashboard'}
  ] : [
    {href:'/admin-dashboard',label:'Overview'},
    {href:'/admin-users',label:'Users'}
  ];
  return <aside className="sidebar"><div className="text-xs uppercase text-slate-500 mb-2">Navigation</div>{items.map(i=><Item key={i.href} {...i}/>)}</aside>;
}
