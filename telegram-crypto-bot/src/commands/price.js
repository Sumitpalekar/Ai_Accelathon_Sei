import { simplePrice } from '../services/coingecko.js';
import { fmtAmount } from '../utils/format.js';

export function registerPrice(bot) {
  bot.command('price', async (ctx) => {
    const parts = ctx.message.text.trim().split(/\s+/);
    const symbol = (parts[1] || '').toLowerCase();
    if (!symbol) return ctx.reply('Usage: /price <symbol> e.g. /price sei');
    try {
      // naive mapping; extend with ids as needed
      const idMap = { eth: 'ethereum', sei: 'sei-network', matic: 'polygon-ecosystem-token', polygon: 'polygon-ecosystem-token', usdc: 'usd-coin' };
      const id = idMap[symbol] || symbol;
      const data = await simplePrice(id, 'usd');
      const price = data[id]?.usd;
      if (price == null) return ctx.reply('Symbol not found on CoinGecko.');
      await ctx.reply(`${symbol.toUpperCase()}: $${fmtAmount(price)} USD`);
    } catch (e) {
      await ctx.reply('Error fetching price.');
    }
  });
}
