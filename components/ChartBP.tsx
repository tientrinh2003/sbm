'use client';
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, Legend } from 'recharts';

// Custom Tooltip component
const CustomTooltip = ({ active, payload }: any) => {
  if (active && payload && payload.length) {
    const data = payload[0].payload;
    return (
      <div className="bg-white border border-gray-200 rounded-lg shadow-lg p-3">
        <p className="text-sm font-medium text-gray-600 mb-2">{data.fullDate}</p>
        {payload.map((entry: any, index: number) => (
          <p key={index} className="text-sm" style={{ color: entry.color }}>
            {entry.name}: {entry.value}
          </p>
        ))}
      </div>
    );
  }
  return null;
};

export default function ChartBP({data}:{data:{takenAt:string, fullDate:string, sys:number, dia:number, pulse:number}[]}){
  return (<div className="h-72"><ResponsiveContainer width="100%" height="100%">
    <LineChart data={data}>
      <XAxis dataKey="takenAt" hide={false} tick={{ fontSize: 11 }} angle={-45} textAnchor="end" height={60} />
      <YAxis />
      <Tooltip content={<CustomTooltip />} />
      <Legend />
      <Line type="monotone" dataKey="sys" stroke="#ef4444" dot={false} name="SYS"/>
      <Line type="monotone" dataKey="dia" stroke="#3b82f6" dot={false} name="DIA"/>
      <Line type="monotone" dataKey="pulse" stroke="#10b981" dot={false} name="Pulse"/>
    </LineChart>
  </ResponsiveContainer></div>);
}
