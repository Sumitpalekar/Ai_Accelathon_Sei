import { issueCode, verifyCode } from '../custody/mfa.js';
import { CUSTODIAL_PRIVATE_KEY } from '../config.js';

export function registerStart(bot) {
  bot.start(async (ctx) => {
    await ctx.reply('Welcome! This bot lets you check prices, send tokens, set allowances, and view NFTs.\n' +
      'Use /help to see commands. For value-moving actions in custodial mode, you will need an OTP.');
    if (CUSTODIAL_PRIVATE_KEY) {
      const code = issueCode(ctx.from.id);
      await ctx.reply(`Custodial mode enabled. Confirm your session with OTP: *${code}*`, { parse_mode: 'Markdown' });
    } else {
      await ctx.reply('Non-custodial mode (no hot wallet). I will prepare transactions for external signing.');
    }
  });

  bot.command('help', async (ctx) => {
    await ctx.reply([
      '/price <symbol>',
      '/send <amount> <asset> <address> [on <chain>]',
      '/approve <asset> <spender> <amount> [on <chain>]',
      '/allowances <asset> <spender> [on <chain>]',
      '/nft <collection> <id> [on <chain>]',
      '/setwebhook',
    ].join('\n'));
  });

  bot.command('setwebhook', async (ctx) => {
    await ctx.reply('If deployed on Vercel, webhook is set automatically on cold start. For local dev, use polling.');
  });
}
