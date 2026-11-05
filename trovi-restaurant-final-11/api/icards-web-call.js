'use strict';
const AGENT_ID='agent_7901m5zew3zkegbvze1mbd6zjvcm';
module.exports=async function handler(req,res){
  res.setHeader('Cache-Control','no-store');
  res.setHeader('X-Content-Type-Options','nosniff');
  if(req.method!=='POST'){res.setHeader('Allow','POST');return res.status(405).json({error:'Method not allowed'});}
  let body=req.body||{};if(typeof body==='string'){try{body=JSON.parse(body)}catch(_){body={}}}
  if(body.accessCode!=='2027')return res.status(403).json({error:'Access code is required.'});
  const apiKey=process.env.ELEVENLABS_API_KEY;
  if(!apiKey){
    // Public-agent path only. ElevenLabs itself rejects the connection if this agent requires auth.
    return res.status(200).json({agentId:AGENT_ID});
  }
  try{
    const url='https://api.elevenlabs.io/v1/convai/conversation/token?agent_id='+encodeURIComponent(AGENT_ID);
    const upstream=await fetch(url,{headers:{'xi-api-key':apiKey},signal:AbortSignal.timeout(12000)});
    if(!upstream.ok){
      console.error('ElevenLabs token request returned status',upstream.status);
      return res.status(502).json({error:'Unable to connect to Fahad at the moment.'});
    }
    const json=await upstream.json();
    if(!json.token) return res.status(502).json({error:'Could not initialize the conversation.'});
    return res.status(200).json({conversationToken:json.token});
  }catch(e){
    console.error('ElevenLabs connection error',e?.message||e);
    return res.status(502).json({error:'Unable to reach the conversation service.'});
  }
};