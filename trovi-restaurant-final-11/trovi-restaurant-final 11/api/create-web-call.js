const AGENTS = {
  restaurant: 'agent_d865eb26699b6685dca729ba9e',
  dental: 'agent_4fe9f465656f8029b5ba54ac2c',
  accounting: 'agent_22cc7eb05b4a0733d2b4b50c3a',
  salon: 'agent_f0a6ea2f63d7c98f7a29b55b82'
};

module.exports = async function handler(req, res) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    return res.status(405).json({ error: 'Method not allowed' });
  }

  if (!process.env.RETELL_API_KEY) {
    return res.status(500).json({ error: 'Retell is not configured on this deployment.' });
  }

  let body = req.body || {};
  if (typeof body === 'string') {
    try { body = JSON.parse(body); } catch (_) { body = {}; }
  }

  const demo = String(body.demo || '').toLowerCase();
  const agentId = AGENTS[demo];
  if (!agentId) {
    return res.status(400).json({ error: 'Unknown demo.' });
  }

  try {
    const retellResponse = await fetch('https://api.retellai.com/v2/create-web-call', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${process.env.RETELL_API_KEY}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        agent_id: agentId,
        metadata: { source: 'troviai.com', demo }
      })
    });

    const data = await retellResponse.json().catch(() => ({}));
    if (!retellResponse.ok || !data.access_token) {
      console.error('Retell create-web-call failed', retellResponse.status, data);
      return res.status(502).json({ error: 'Unable to start the live demo right now.' });
    }

    return res.status(200).json({
      accessToken: data.access_token,
      callId: data.call_id,
      demo
    });
  } catch (error) {
    console.error('Retell web call error', error);
    return res.status(500).json({ error: 'Unable to start the live demo right now.' });
  }
};
