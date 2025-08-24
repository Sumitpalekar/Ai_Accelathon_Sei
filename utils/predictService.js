// utils/predictService.js
import axios from "axios";

const tokenMap = {
  BTC: "bitcoin",
  ETH: "ethereum",
  SEI: "sei-network",
  SOL: "solana",
  MATIC: "matic-network",
};

export async function predictToken(symbol) {
  try {
    if (!symbol) {
      return { currentPrice: null, prediction: "❌ Please provide a token symbol (e.g., BTC, ETH, SEI)" };
    }

    const tokenId = tokenMap[symbol.toUpperCase()];
    if (!tokenId) {
      return { currentPrice: null, prediction: `⚠️ Unsupported token: ${symbol}` };
    }

    const url = `https://api.coingecko.com/api/v3/coins/${tokenId}/market_chart?vs_currency=usd&days=1`;
    console.log("🔗 Fetching:", url);

    const res = await axios.get(url);

    if (!res.data || !res.data.prices) {
      return { currentPrice: null, prediction: "⚠️ API returned empty data" };
    }

    const prices = res.data.prices;
    if (prices.length < 2) {
      return { currentPrice: null, prediction: "⚠️ Not enough market data" };
    }

    const prevPrice = prices[prices.length - 2][1];
    const currentPrice = prices[prices.length - 1][1];

    let prediction = "😐 Stable / unclear trend";
    if (currentPrice > prevPrice) prediction = `${symbol} likely to go UP 📈`;
    else if (currentPrice < prevPrice) prediction = `${symbol} likely to go DOWN 📉`;

    return { currentPrice, prediction };
  } catch (err) {
    console.error("❌ Error fetching prediction:", err.response?.data || err.message);
    return { currentPrice: null, prediction: "⚠️ Error fetching data from CoinGecko API" };
  }
}
