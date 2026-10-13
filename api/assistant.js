// Vercel serverless function: forwards assistant requests to Anthropic with the team key kept on the server.
// Set ANTHROPIC_API_KEY in the Vercel project (Settings › Environment Variables).
// Optional: set ASSISTANT_PASSCODE to require a passcode (entered once in the assistant's ⚙ settings).
const MODELS = ['claude-sonnet-5-5', 'claude-opus-5-5', 'claude-haiku-5-5'];

module.exports = async (req, res) => {
  if (req.method !== 'POST') { res.statusCode = 405; return res.end(JSON.stringify({ error: { message: 'POST only' } })); }
  const key = process.env.ANTHROPIC_API_KEY;
  res.setHeader('content-type', 'application/json');
  if (!key) { res.statusCode = 500; return res.end(JSON.stringify({ error: { message: 'The site has no ANTHROPIC_API_KEY set (Vercel › Settings › Environment Variables). Or add your own key in the assistant settings.' } })); }
  const pass = process.env.ASSISTANT_PASSCODE;
  if (pass && req.headers['x-gb-pass'] !== pass) { res.statusCode = 401; return res.end(JSON.stringify({ error: { message: 'Wrong or missing team passcode (assistant ⚙ settings).' } })); }
  let body = req.body;
  if (typeof body === 'string') { try { body = JSON.parse(body); } catch (e) { body = {}; } }
  if (!body || typeof body !== 'object') body = {};
  const payload = {
    model: MODELS.includes(body.model) ? body.model : MODELS[0],
    max_tokens: Math.min(Number(body.max_tokens) || 2048, 4096),
    system: body.system,
    messages: body.messages || [],
    tools: body.tools
  };
  try {
    const r = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: { 'content-type': 'application/json', 'x-api-key': key, 'anthropic-version': '2023-06-01' },
      body: JSON.stringify(payload)
    });
    res.statusCode = r.status;
    res.end(await r.text());
  } catch (e) {
    res.statusCode = 502;
    res.end(JSON.stringify({ error: { message: 'Could not reach Anthropic: ' + e.message } }));
  }
};
