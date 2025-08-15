import http from 'http';
import { createBot } from './bot.js';
import { log } from './logger.js';

const bot = createBot();
const webhookCb = bot.webhookCallback('/webhook');

const server = http.createServer((req, res) => {
  if (req.method === 'POST' && req.url === '/webhook') {
    webhookCb(req, res);
  } else {
    res.statusCode = 200;
    res.end('OK');
  }
});

server.listen(3000, () => log('Local webhook listening on http://localhost:3000/webhook'));
