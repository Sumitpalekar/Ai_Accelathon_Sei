import { getPrice } from './utils/priceService.js';
import { getBalanceSEI, sendSEINative, sendERC20, normalizeAddress } from './utils/seiService.js';
import { swapExactTokensForTokens } from './utils/swapService.js';
import { listNFTForSale, buyNFT, getMyNFTs } from './utils/nftService.js';
import { predictToken } from './utils/predictService.js';
import { getUser, setUser } from './users.js';  // ✅ central user store

export async function handleCommand(intent, msg, bot) {
  const cmd = intent.command.toLowerCase();
  const args = intent.args || [];
  const userId = String(msg.from.id);

  try {
    switch (cmd) {
      case 'price': {
        if (!args[0]) return 'Usage: /price <SYMBOL>';
        const price = await getPrice(args[0]);
        return `💰 ${args[0].toUpperCase()} price: $${price}`;
      }

      case 'balance': {
        const user = getUser(userId);
        const addr = args[0] || user?.wallet || process.env.SEI_ADDRESS;
        if (!addr) return 'Usage: /balance <address>';
        const bal = await getBalanceSEI(normalizeAddress(addr));
        return `💰 Balance of ${addr}: ${bal} SEI`;
      }

      case 'send_token': {
        const to = args[0];
        const amount = args[1];
        const tokenAddr = args[2] || null;
        if (!to || !amount) return 'Usage: /send_token <to> <amount> [tokenAddress]';
        const toN = normalizeAddress(to);
        if (!tokenAddr) {
          const tx = await sendSEINative(toN, amount);
          return `✅ Sent ${amount} SEI. Tx: ${tx}`;
        } else {
          const tx = await sendERC20(tokenAddr, toN, amount);
          return `✅ Sent ${amount} tokens to ${toN}. Tx: ${tx}`;
        }
      }

      case 'swap_assets': {
        if (args.length < 4) return 'Usage: /swap_assets <tokenIn> <tokenOut> <amount> <recipient>';
        const [tokenIn, tokenOut, amount, recipient] = args;
        const tx = await swapExactTokensForTokens(tokenIn, tokenOut, amount, recipient);
        return `🔄 Swap submitted. Tx: ${tx}`;
      }

      case 'nft_buy': {
        if (args.length < 4) return 'Usage: /nft_buy <market> <nftContract> <tokenId> <priceSEI>';
        const [market, nftContract, tokenId, price] = args;
        const tx = await buyNFT(market, nftContract, tokenId, price);
        return `🛒 NFT bought. Tx: ${tx}`;
      }

      case 'nft_sell': {
        if (args.length < 4) return 'Usage: /nft_sell <market> <nftContract> <tokenId> <priceSEI>';
        const [market, nftContract, tokenId, price] = args;
        const tx = await listNFTForSale(market, nftContract, tokenId, price);
        return `📤 NFT listed. Tx: ${tx}`;
      }

      case 'nft_my': {
        const user = getUser(userId);
        if (args.length < 1 && !user?.wallet) return 'Usage: /nft_my <nftContract> [walletAddress]';
        const nftContract = args[0];
        const owner = args[1] || user?.wallet || process.env.SEI_ADDRESS;
        const ids = await getMyNFTs(nftContract, owner);
        return ids.length ? `🖼️ NFTs: ${ids.join(', ')}` : 'No NFTs found.';
      }

      case 'predict': {
        if (!args[0]) return 'Usage: /predict <coinGeckoTokenId>';
        const tokenId = args[0].toLowerCase();
        const { currentPrice, prediction } = await predictToken(tokenId);
        if (!currentPrice) return prediction;
        return `💰 ${tokenId} price: $${currentPrice}\n🔮 Prediction: ${prediction}`;
      }

      case 'myaddress': {
        const user = getUser(userId);
        const myAddr = user?.wallet || process.env.SEI_ADDRESS;
        if (!myAddr) return '⚠️ No wallet set. Use /set_address <address>';
        return `🏦 Your wallet: \`${myAddr}\``;
      }

      case 'set_address':
      case 'set_wallet': {
        if (args.length < 1) return `Usage: /${cmd} <walletAddress>`;
        setUser(userId, { wallet: args[0] });
        return `✅ Wallet set: ${args[0]}`;
      }

      case 'clear': {
        try {
          await bot.telegram.deleteMessage(msg.chat.id, msg.message_id);
        } catch (e) {
          console.error("⚠️ Clear error:", e.message);
        }
        return "🧹 Chat cleared!";
      }

      default:
        return '⚠️ Unknown command. Type /help for list of commands.';
    }
  } catch (err) {
    console.error('handler error', err);
    return '⚠️ Error: ' + (err?.shortMessage || err?.message || String(err));
  }
}
