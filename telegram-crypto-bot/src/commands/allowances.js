import { providerFor, erc20 } from '../chain/evm.js';
import { parseChainHint } from '../utils/validation.js';

const TOKENS = {
  ethereum: { USDC: '0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48' },
  polygon: { USDC: '0x2791Bca1f2de4661ED88A30C99A7a9449Aa84174' },
  sei:     { USDC: '0x0000000000000000000000000000000000000000' }
};

export function registerAllowances(bot) {
  bot.command('allowances', async (ctx) => {
    try {
      // /allowances USDC 0xRouter on ethereum
      const m = ctx.message.text.match(/^\/allowances\s+(\S+)\s+(0x[a-fA-F0-9]{40})(.*)$/);
      if (!m) return ctx.reply('Usage: /allowances <asset> <spender> [on <chain>]');
      const [_, assetSym, spender, rest] = m;
      const asset = assetSym.toUpperCase();
      const chain = parseChainHint(rest);
      const provider = providerFor(chain);

      // For demo, require ENV private key address (hot wallet owner)
      const owner = (await provider.getSigner?.())?.address || '0x0000000000000000000000000000000000000000';
      const tokenAddr = TOKENS[chain]?.[asset];
      if (!tokenAddr) return ctx.reply(`Unknown token for chain=${chain}: ${asset}`);
      const token = erc20(tokenAddr, provider);
      const allowance = await token.allowance(owner, spender);
      await ctx.reply(`Allowance of ${asset} for ${spender} on ${chain}: ${allowance.toString()}`);
    } catch (e) {
      await ctx.reply('Allowance lookup failed: ' + (e?.message || e));
    }
  });
}
