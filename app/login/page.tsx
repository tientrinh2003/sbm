'use client';
import { signIn } from 'next-auth/react'; import { useState } from 'react';
import { Input } from '@/components/ui/input'; import { Label } from '@/components/ui/label'; import { Button } from '@/components/ui/button'; import Link from 'next/link';
export default function Login(){
  const [loading,setLoading]=useState(false);
  async function onSubmit(e:React.FormEvent<HTMLFormElement>){ e.preventDefault(); setLoading(true);
    const fd=new FormData(e.currentTarget); const identifier=String(fd.get('identifier')||''); const password=String(fd.get('password')||'');
    await signIn('credentials',{ redirect:true, callbackUrl:'/', identifier, password }); setLoading(false);
  }
  return (<div className="mx-auto max-w-md"><div className="card space-y-4">
    <h1 className="text-xl font-semibold text-center">Đăng nhập</h1>
    <form onSubmit={onSubmit} className="space-y-3">
      <div><Label>Email / Số điện thoại</Label><Input name="identifier" placeholder="patient@smb.local" /></div>
      <div><Label>Mật khẩu</Label><Input name="password" type="password" placeholder="123456" /></div>
      <Button type="submit" className="w-full" disabled={loading}>{loading?'Đang đăng nhập...':'Đăng nhập'}</Button>
    </form>
    <div className="text-sm text-center">Chưa có tài khoản? <Link className="link" href="/register">Đăng ký</Link></div>
  </div></div>);
}
