// src/ai/agent.js
import axios from "axios";
import dotenv from "dotenv";
dotenv.config();

/**
 * processMessage(text, msg)
 * - returns { intent: { command, args } } if a recognized intent was parsed
 * - returns { reply: "..." } if we should reply conversationally
 * - returns null if nothing to do (rare)
 *
 * Behavior:
 * 1) quick canned small-talk handling (hi/hello/thanks/bye)
 * 2) pattern-based intent extraction (send, price, swap, buy nft, my nfts, predict)
 * 3) if no pattern matched and OPENAI_API_KEY present -> call OpenAI for a natural reply
 * 4) if no pattern and no API key -> fallback polite message
 */

// helper: quick normalize
function norm(s = "") {
  return String(s).trim();
}

const GREETINGS = [
  "hi", "hello", "hey", "hii", "hiya", "good morning", "good afternoon", "good evening"
];

export async function processMessage(text, msg) {
  const raw = norm(text);
  if (!raw) return null;
  const lower = raw.toLowerCase();

  // 1) small talk - greetings
  for (const g of GREETINGS) {
    if (lower === g || lower.startsWith(g + " ") || lower === `${g}!`) {
      return { reply: `👋 ${raw.split(" ")[0][0].toUpperCase() + raw.slice(1)}! I can help with SEI actions (try /help) — or just tell me what you'd like to do.` };
    }
  }

  // thanks / bye
  if (/\b(thanks|thank you|thx)\b/i.test(lower)) {
    return { reply: "You’re welcome! 😊 Anything else I can do?" };
  }
  if (/\b(bye|goodbye|see ya|see you)\b/i.test(lower)) {
    return { reply: "Bye 👋 — ping me anytime." };
  }

  // 2) pattern-based intents (keep same patterns you had)
  let m;

  // send pattern: "send 1 SEI to 0x..."
  m = lower.match(/send\s+(\d+(?:\.\d+)?)\s+\w*\s+to\s+(0x[a-f0-9]{40}|sei1[a-z0-9]{38,})/i);
  if (m) {
    const amount = m[1];
    const to = m[2];
    return { intent: { command: "send_token", args: [to, amount] } };
  }

  // price: "price of SEI" or "what's the price of SEI"
  m = lower.match(/price\s+of\s+([A-Za-z0-9_-]+)/i) || lower.match(/what('?s| is) the price of\s+([A-Za-z0-9_-]+)/i);
  if (m) {
    const sym = (m[1] || m[2]).toUpperCase();
    return { intent: { command: "price", args: [sym] } };
  }

  // swap: "swap 10 USDC to SEI for 0x..."
  m = lower.match(/swap\s+(\d+(?:\.\d+)?)\s+([A-Za-z0-9_-]+)\s+to\s+([A-Za-z0-9_-]+)\s+for\s+(0x[a-f0-9]{40}|sei1[a-z0-9]{38,})/i);
  if (m) {
    const amount = m[1];
    const tokenIn = m[2];
    const tokenOut = m[3];
    const recipient = m[4];
    return { intent: { command: "swap_assets", args: [tokenIn, tokenOut, amount, recipient] } };
  }

  // nft buy: "buy nft 1 from 0xMarket 0xNFT for 100"
  m = lower.match(/buy\s+nft\s+(\d+)\s+from\s+(0x[a-f0-9]{40}|sei1[a-z0-9]{38,})\s+(0x[a-f0-9]{40}|sei1[a-z0-9]{38,})\s+for\s+(\d+(?:\.\d+)?)/i);
  if (m) {
    const tokenId = m[1];
    const market = m[2];
    const nftContract = m[3];
    const price = m[4];
    return { intent: { command: "nft_buy", args: [market, nftContract, tokenId, price] } };
  }

  // my nfts: "my nfts in 0xNFT for 0xOwner"
  m = lower.match(/my\s+nfts\s+in\s+(0x[a-f0-9]{40}|sei1[a-z0-9]{38,})\s+for\s+(0x[a-f0-9]{40}|sei1[a-z0-9]{38,})/i);
  if (m) {
    const nftContract = m[1];
    const owner = m[2];
    return { intent: { command: "nft_my", args: [nftContract, owner] } };
  }

  // predict: "predict 1 on 0xMarket choose yes with 50"
  m = lower.match(/predict\s+(\d+)\s+on\s+(0x[a-f0-9]{40}|sei1[a-z0-9]{38,})\s+choose\s+(\w+)\s+with\s+(\d+(?:\.\d+)?)/i);
  if (m) {
    const marketId = m[1];
    const marketContract = m[2];
    const option = m[3];
    const amount = m[4];
    return { intent: { command: "predict", args: [marketContract, marketId, option, amount] } };
  }

  // 3) If no intent matched and OpenAI key present -> conversational reply
  if (process.env.OPENAI_API_KEY) {
    try {
      const system = `You are a friendly Telegram assistant that helps users with Sei blockchain tasks (get prices, send tokens, swap, buy NFTs, view NFTs, prediction markets). 
If the user asks for an on-chain action, output nothing here (the bot will parse and call actions separately). Otherwise answer conversationally and help the user. Keep replies short (1-3 sentences).`;
      // use chat completions endpoint via axios
      const resp = await axios.post(
        "https://api.openai.com/v1/chat/completions",
        {
          model: "gpt-3.5-turbo",
          messages: [
            { role: "system", content: system },
            { role: "user", content: raw }
          ],
          max_tokens: 150,
          temperature: 0.6
        },
        { headers: { Authorization: `Bearer ${process.env.OPENAI_API_KEY}` } }
      );

      const reply = resp?.data?.choices?.[0]?.message?.content;
      if (reply && reply.trim()) return { reply: reply.trim() };
    } catch (e) {
      console.error("OpenAI fallback failed:", e?.message || e);
      // fall through to fallback message
    }
  }

  // 4) fallback if no API key or LLM failed
  return { reply: "I didn't quite get that. You can use /help or say things like 'send 1 SEI to 0x...' or 'price of SEI'." };
}
