import { providerFor, signerFor, erc20, parseUnits } from '../chain/evm.js';
import { parseAmount, parseChainHint } from '../utils/validation.js';
import { fmtAmount } from '../utils/format.js';

const TOKENS = {
  ethereum: { USDC: '0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48' },
  polygon: { USDC: '0x2791Bca1f2de4661ED88A30C99A7a9449Aa84174' },
  sei:     { USDC: '0x0000000000000000000000000000000000000000' }
};

export function registerApprove(bot) {
  bot.command('approve', async (ctx) => {
    try {
      // /approve USDC 0xRouter 1000 on ethereum
      const m = ctx.message.text.match(/^\/approve\s+(\S+)\s+(0x[a-fA-F0-9]{40})\s+(\S+)(.*)$/);
      if (!m) return ctx.reply('Usage: /approve <asset> <spender> <amount> [on <chain>]');
      const [_, assetSym, spender, amountStr, rest] = m;
      const asset = assetSym.toUpperCase();
      const amount = parseAmount(amountStr);
      const chain = parseChainHint(rest);

      const signer = signerFor(chain);
      if (!signer) return ctx.reply('Custodial key not configured.');

      const tokenAddr = TOKENS[chain]?.[asset];
      if (!tokenAddr) return ctx.reply(`Unknown token for chain=${chain}: ${asset}`);
      const token = erc20(tokenAddr, signer);
      const decimals = await token.decimals();
      const tx = await token.approve(spender, parseUnits(amount, decimals));
      await ctx.reply(`Approving ${fmtAmount(amount)} ${asset} for ${spender} on ${chain}...\nTx: ${tx.hash}`);
      const rec = await tx.wait();
      await ctx.reply(`✅ Confirmed in block ${rec.blockNumber}`);
    } catch (e) {
      await ctx.reply('Approve failed: ' + (e?.message || e));
    }
  });
}
