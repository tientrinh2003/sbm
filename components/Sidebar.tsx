'use client';
import Link from 'next/link'; import { usePathname } from 'next/navigation';
type Role='PATIENT'|'DOCTOR'|'ADMIN';
function Item({href,label}:{href:string;label:string}){ const p=usePathname(); const active=p.startsWith(href); return <Link href={href} className={`block rounded-xl px-3 py-2 text-sm ${active?'bg-[--color-primary]/10 text-[--color-primary]':'hover:bg-slate-100 text-slate-700'}`}>{label}</Link>; }
export default function Sidebar({role}:{role:Role}){
  const items = role==='PATIENT' ? [
    {href:'/patient/dashboard',label:'Bảng điều khiển'},
    {href:'/patient/monitoring',label:'Bắt đầu đo'},
    {href:'/patient/history',label:'Lịch sử'},
    {href:'/patient/chat',label:'Trợ lý AI'},
    {href:'/tutorial',label:'Hướng dẫn'}
  ] : role==='DOCTOR' ? [
    {href:'/doctor/dashboard',label:'Bảng điều khiển'},
    {href:'/doctor/patients',label:'Bệnh nhân'},
    {href:'/doctor/assignments',label:'Phân công'},
    {href:'/doctor/chat',label:'AI Lâm sàng'}
  ] : [
    {href:'/admin/dashboard',label:'Tổng quan'},
    {href:'/admin/users',label:'Người dùng'},
    {href:'/admin/chat',label:'AI Hệ thống'}
  ];
  return <aside className="sidebar"><div className="text-xs uppercase text-slate-500 mb-2">Điều hướng</div>{items.map(i=><Item key={i.href} {...i}/>)}</aside>;
}
