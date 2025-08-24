import axios from 'axios';
const SYMBOL_TO_ID = { SEI: 'sei', BTC: 'bitcoin', ETH: 'ethereum', USDT: 'tether', SOL: 'solana', MATIC: 'matic-network' };
export async function getPrice(symbol) {
  const s = symbol.toUpperCase();
  const id = SYMBOL_TO_ID[s] || s.toLowerCase();
  const ids = [id]; if (s === 'SEI') ids.push('sei-network');
  const url = 'https://api.coingecko.com/api/v3/simple/price';
  const res = await axios.get(url, { params: { ids: ids.join(','), vs_currencies: 'usd' } });
  for (const k of ids) { if (res.data[k] && res.data[k].usd !== undefined) return res.data[k].usd; }
  throw new Error('Symbol not found on CoinGecko.');
}
