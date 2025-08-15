import { createBot } from '../src/bot.js';
import { PUBLIC_URL } from '../src/config.js';

const bot = createBot();
const handler = bot.webhookCallback('/api/telegram');

// Attempt to set webhook on cold start (best-effort)
if (PUBLIC_URL) {
  try { await bot.telegram.setWebhook(`${PUBLIC_URL}/api/telegram`); } catch {}
}

export default function(req, res) {
  if (req.method !== 'POST') {
    res.status(200).send('OK');
    return;
  }
  return handler(req, res);
}
