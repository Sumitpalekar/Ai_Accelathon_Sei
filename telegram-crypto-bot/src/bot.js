import { Telegraf } from 'telegraf';
import { TELEGRAM_BOT_TOKEN } from './config.js';
import { log } from './logger.js';

import { registerStart } from './commands/start.js';
import { registerPrice } from './commands/price.js';
import { registerSend } from './commands/send.js';
import { registerApprove } from './commands/approve.js';
import { registerAllowances } from './commands/allowances.js';
import { registerNft } from './commands/nft.js';

if (!TELEGRAM_BOT_TOKEN) {
  throw new Error('Missing TELEGRAM_BOT_TOKEN');
}

export function createBot() {
  const bot = new Telegraf(TELEGRAM_BOT_TOKEN);

  registerStart(bot);
  registerPrice(bot);
  registerSend(bot);
  registerApprove(bot);
  registerAllowances(bot);
  registerNft(bot);

  bot.catch((err, ctx) => {
    log('Bot error:', err);
    ctx.reply?.('Unexpected error. Please try again.');
  });

  return bot;
}
