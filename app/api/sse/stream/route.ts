import { streamFor } from '@/lib/sse';
export async function GET(req:Request){
  const { searchParams } = new URL(req.url);
  const userKey = searchParams.get('userKey')||''; if(!userKey) return new Response('Bad request',{status:400});
  const stream = streamFor(userKey);
  return new Response(stream, { headers: { "Content-Type":"text/event-stream", "Cache-Control":"no-cache", "Connection":"keep-alive" } });
}
