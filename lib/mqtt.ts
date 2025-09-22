import mqtt from 'mqtt';
let client: mqtt.MqttClient | null = null;
function ensure(){ if(client) return client;
  const host = process.env.MQTT_TCP_HOST; const port = process.env.MQTT_TCP_PORT;
  if(!host||!port) throw new Error('MQTT host/port not configured');
  client = mqtt.connect(`mqtt://${host}:${port}`); return client;
}
export const serverMqtt = {
  publish: async (topic:string, payload:string, qos: 0|1|2 = 1)=>{
    try{ const c=ensure(); await new Promise<void>((res,rej)=>c.publish(topic, payload, { qos }, (e)=>e?rej(e):res())); return true; }catch{ return false; }
  }
};
