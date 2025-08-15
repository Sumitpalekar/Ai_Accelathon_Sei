import { createBot } from './bot.js';
import { log } from './logger.js';

const bot = createBot();
bot.launch().then(() => log('Bot started in polling mode. Press Ctrl+C to stop.'));

process.once('SIGINT', () => bot.stop('SIGINT'));
process.once('SIGTERM', () => bot.stop('SIGTERM'));
