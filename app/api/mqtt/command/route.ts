import { serverMqtt } from '@/lib/mqtt';
export async function POST(req:Request){
  const b=await req.json(); const { topic, payload, qos=1 } = b;
  if(!topic) return new Response('Bad request',{status:400});
  const ok = await serverMqtt.publish(topic, JSON.stringify(payload||{}), qos).catch(()=>false);
  return new Response(JSON.stringify({ ok: !!ok }),{headers:{'Content-Type':'application/json'}});
}
