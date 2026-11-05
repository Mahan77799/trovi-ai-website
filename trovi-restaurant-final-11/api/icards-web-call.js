'use strict';

// iCards demo: ElevenLabs WebRTC token issuer. Do not expose the ElevenLabs key to browsers.
const ACCESS_CODE = '2027';
const MAX_BODY_SIZE = 1024;

module.exports = async function handler(req, res) {
  res.setHeader('Cache-Control', 'no-store');
  res.setHeader('X-Content-Type-Options', 'nosniff');

  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    return res.status(405).json({ error: 'Method not allowed.' });
  }

  const configuredOrigin = (process.env.ICARDS_DEMO_ORIGIN || '').trim();
  const origin = req.headers.origin;
  if (origin) {
    try {
      const parsed = new URL(origin);
      const requestedHost = String(req.headers['x-forwarded-host'] || req.headers.host || '').split(',')[0].trim();
      const permitted = parsed.protocol === 'https:' &&
        (parsed.host === requestedHost || (configuredOrigin && parsed.origin === configuredOrigin));
      if (!permitted) {
        return res.status(403).json({ error: 'Invalid origin.' });
      }
    } catch {
      return res.status(403).json({ error: 'Invalid origin.' });
    }
  }

  const bodyText = typeof req.body === 'string' ? req.body : JSON.stringify(req.body || {});
  if (bodyText.length > MAX_BODY_SIZE) {
    return res.status(413).json({ error: 'Invalid request.' });
  }
  let body = req.body || {};
  if (typeof body === 'string') {
    try { body = JSON.parse(body); } catch { return res.status(400).json({ error: 'Invalid request.' }); }
  }
  if (!body || body.accessCode !== ACCESS_CODE) {
    return res.status(403).json({ error: 'Invalid access code.' });
  }

  const agentId = process.env.ICARDS_ELEVENLABS_AGENT_ID;
  const apiKey = process.env.ELEVENLABS_API_KEY;
  if (!apiKey || !agentId) {
    return res.status(503).json({ error: 'The Fahad live demo has not been connected yet.' });
  }
  if (!/^agent_[a-zA-Z0-9]+$/.test(agentId)) {
    return res.status(503).json({ error: 'The Fahad live demo configuration needs attention.' });
  }

  try {
    const url = new URL('https://api.elevenlabs.io/v1/convai/conversation/token');
    url.searchParams.set('agent_id', agentId);

    const upstream = await fetch(url, {
      method: 'GET',
      headers: { 'xi-api-key': apiKey, 'Accept': 'application/json' },
      signal: AbortSignal.timeout(12000)
    });
    if (!upstream.ok) {
      console.error('iCards ElevenLabs token status:', upstream.status);
      return res.status(502).json({ error: 'Unable to start the live demo right now.' });
    }
    const data = await upstream.json();
    if (typeof data.token !== 'string' || !data.token) {
      return res.status(502).json({ error: 'Unable to start the live demo right now.' });
    }
    return res.status(200).json({ conversationToken: data.token });
  } catch (err) {
    console.error('iCards ElevenLabs token request failed:', err && err.message);
    return res.status(502).json({ error: 'Unable to connect to Fahad right now.' });
  }
};