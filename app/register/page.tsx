'use client';
import { Input } from '@/components/ui/input'; import { Label } from '@/components/ui/label'; import { Button } from '@/components/ui/button'; import { useState } from 'react';
export default function Register(){
  const [msg,setMsg]=useState('');
  async function onSubmit(e:React.FormEvent<HTMLFormElement>){ e.preventDefault(); const fd=new FormData(e.currentTarget);
    const res=await fetch('/api/auth/register',{ method:'POST', body:fd }); setMsg(res.ok?'Registered! You can login now.':'Failed');
  }
  return (<div className="mx-auto max-w-md"><div className="card space-y-4">
    <h1 className="text-xl font-semibold text-center">Register (Patient)</h1>
    {msg && <div className="text-sm text-green-700 bg-green-50 border border-green-200 rounded-xl p-2">{msg}</div>}
    <form onSubmit={onSubmit} className="space-y-3">
      <div><Label>Full name</Label><Input name="name" required/></div>
      <div><Label>Email</Label><Input name="email" type="email" required/></div>
      <div><Label>Phone</Label><Input name="phone"/></div>
      <div><Label>Password</Label><Input name="password" type="password" required/></div>
      <Button className="w-full">Create account</Button>
    </form>
  </div></div>);
}
