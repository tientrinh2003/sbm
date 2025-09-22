'use client';
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, Legend } from 'recharts';
export default function ChartBP({data}:{data:{takenAt:string, sys:number, dia:number, pulse:number}[]}){
  return (<div className="h-72"><ResponsiveContainer width="100%" height="100%">
    <LineChart data={data}>
      <XAxis dataKey="takenAt" hide />
      <YAxis />
      <Tooltip />
      <Legend />
      <Line type="monotone" dataKey="sys" stroke="#ef4444" dot={false} name="SYS"/>
      <Line type="monotone" dataKey="dia" stroke="#3b82f6" dot={false} name="DIA"/>
      <Line type="monotone" dataKey="pulse" stroke="#10b981" dot={false} name="Pulse"/>
    </LineChart>
  </ResponsiveContainer></div>);
}
