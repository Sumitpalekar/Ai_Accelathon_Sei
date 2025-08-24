import 'dotenv/config.js';
import TelegramBot from 'node-telegram-bot-api';
import { handleCommand } from './handlers.js';
import { processMessage } from './ai/agent.js';
import { elizaForward } from './eliza/elizaClientShim.js';
import { fetchSignal } from './signals.js';
import { getUser, setUser } from './users.js';   


const token = process.env.BOT_TOKEN;
if (!token) {
  console.error('❌ BOT_TOKEN not set in .env');
  process.exit(1);
}

const bot = new TelegramBot(token, { polling: true });
console.log('🤖 Sei Telegram Bot (AI-enabled) running...');

// /start
bot.onText(/\/start/, (msg) => {
  bot.sendMessage(msg.chat.id, '👋 Welcome! I can perform Sei actions. Type /help or speak naturally.');
});

// /help
bot.onText(/\/help/, (msg) => {
  bot.sendMessage(msg.chat.id, `🤖 *SEI Bot Commands* 🚀

💼 *Wallet*
/set_wallet <address> – Link wallet


📊 *Market*
/price <SYMBOL> – Token price
/predict <SYMBOL> – AI prediction
/signal <SYMBOL> – Trading signal

💸 *Tokens*
/send_token <to> <amt> [token] – Send
/swap_assets <in> <out> <amt> <to> – Swap

🖼️ *NFTs*
/nft_buy ... – Buy NFT
/nft_sell ... – Sell NFT
/nft_my ... – My NFTs

🧹 *Other*
/clear – Reset chat

💡 *Tip:* Natural language works too:
"price of SEI" | "send 1 SEI to 0x..." | "swap 10 USDC to SEI"
`)
});


// /set_wallet
bot.onText(/\/set_wallet (.+)/, (msg, match) => {
  const chatId = msg.chat.id;
  const wallet = match[1].trim();

  setUser(msg.from.id, { wallet }); // ✅ persist wallet in store
  bot.sendMessage(chatId, `✅ Wallet set to: ${wallet}`);
});

// /signal <SYMBOL>
bot.onText(/\/signal (.+)/, async (msg, match) => {
  const chatId = msg.chat.id;
  const symbol = match[1].trim().toUpperCase();
  try {
    const signal = await fetchSignal(symbol);
    await bot.sendMessage(chatId, `📊 Signal for ${symbol}: ${signal}`);
  } catch (err) {
    console.error('Signal error:', err);
    await bot.sendMessage(chatId, `⚠️ Error fetching signal for ${symbol}`);
  }
});



// General message handler
bot.on('message', async (msg) => {
  try {
    if (!msg.text) return;
    const text = msg.text.trim();

    // If explicit slash command -> parse intent and call handlers
    if (text.startsWith('/')) {
      const parts = text.slice(1).split(/\s+/);
      const command = parts[0].toLowerCase();
      const args = parts.slice(1);

      if (['signal', 'balance', 'set_wallet', 'help', 'start'].includes(command)) return; // already handled

      const intent = { command, args };
      const response = await handleCommand(intent, msg, bot);
      if (response) await bot.sendMessage(msg.chat.id, response);
      return;
    }

    // Eliza integration
    if (process.env.ELIZA_ENABLED === 'true') {
      const forwarded = await elizaForward(text, msg);
      if (forwarded) {
        if (forwarded.reply) {
          await bot.sendMessage(msg.chat.id, forwarded.reply);
          return;
        }
        if (forwarded.intent) {
          const response = await handleCommand(forwarded.intent, msg, bot);
          if (response) { await bot.sendMessage(msg.chat.id, response); return; }
        }
      }
    }

    // AI agent interpretation
    const aiResult = await processMessage(text, msg);
    if (aiResult?.reply) {
      await bot.sendMessage(msg.chat.id, aiResult.reply);
      return;
    }
    if (aiResult?.intent) {
      const response = await handleCommand(aiResult.intent, msg, bot);
      if (response) await bot.sendMessage(msg.chat.id, response);
      return;
    }

    // fallback
    await bot.sendMessage(msg.chat.id, "🤖 I'm not sure. Try a direct command or say 'help'.");
  } catch (err) {
    console.error('Handler error:', err);
    try { await bot.sendMessage(msg.chat.id, '⚠️ Error: ' + (err.message || String(err))); } catch(e){}
  }
});

bot.on('polling_error', (err) => console.error('polling_error', err));
