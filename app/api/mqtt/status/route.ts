export async function GET(){ return new Response(JSON.stringify({ connected:false }),{headers:{'Content-Type':'application/json'}}); }
