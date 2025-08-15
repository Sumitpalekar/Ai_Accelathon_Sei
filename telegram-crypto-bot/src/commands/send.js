import { providerFor, signerFor, erc20, parseUnits } from '../chain/evm.js';
import { parseAmount, ensureAddress, parseChainHint } from '../utils/validation.js';
import { fmtAmount } from '../utils/format.js';

// Minimal token registry (address per chain). Extend as needed.
const TOKENS = {
  ethereum: { USDC: '0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48' },
  polygon: { USDC: '0x2791Bca1f2de4661ED88A30C99A7a9449Aa84174' },
  sei:     { USDC: '0x0000000000000000000000000000000000000000' } // TODO: replace with actual
};

export function registerSend(bot) {
  bot.command('send', async (ctx) => {
    try {
      const text = ctx.message.text;
      // /send 10 USDC 0xabc... on polygon
      const m = text.match(/^\/send\s+(\S+)\s+(\S+)\s+(0x[a-fA-F0-9]{40})(.*)$/);
      if (!m) return ctx.reply('Usage: /send <amount> <asset> <address> [on <chain>]');
      const [_, amountStr, assetSym, to, rest] = m;
      const amount = parseAmount(amountStr);
      const asset = assetSym.toUpperCase();
      const chain = parseChainHint(rest);

      const provider = providerFor(chain);
      const signer = signerFor(chain);
      if (!signer) return ctx.reply('Custodial key not configured. Provide CUSTODIAL_PRIVATE_KEY or implement non-custodial signing.');

      if (asset === 'ETH' || asset === 'MATIC' || asset === 'SEI') {
        const tx = await signer.sendTransaction({ to, value: (await provider.getFeeData(), 0), }); // placeholder value set below
      }

      // assume ERC-20
      const tokenAddr = TOKENS[chain]?.[asset];
      if (!tokenAddr) return ctx.reply(`Unknown token for chain=${chain}: ${asset}`);
      const token = erc20(tokenAddr, signer);
      const decimals = await token.decimals();
      const tx = await token.transfer(to, parseUnits(amount, decimals));
      await ctx.reply(`Sending ${fmtAmount(amount)} ${asset} on ${chain}...\nTx: ${tx.hash}`);
      const rec = await tx.wait();
      await ctx.reply(`✅ Confirmed in block ${rec.blockNumber}`);
    } catch (e) {
      await ctx.reply('Send failed: ' + (e?.message || e));
    }
  });
}
