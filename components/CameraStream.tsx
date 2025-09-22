'use client';
import { useEffect, useState } from 'react';
export default function CameraStream(){
  const [url,setUrl]=useState('');
  useEffect(()=>{ const ls=localStorage.getItem('pi_stream'); setUrl(ls||process.env.NEXT_PUBLIC_PI_STREAM||''); },[]);
  return (<div className='space-y-2'>
    <img src={url} alt="Pi camera" className="w-full rounded-xl bg-black aspect-video object-contain"/>
    <div className="text-xs text-slate-500 break-all">URL: {url||'Chưa cấu hình'}</div>
  </div>);
}
