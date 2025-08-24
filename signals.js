import fetch from 'node-fetch';

export async function fetchSignal(symbol = 'BTC') {
  try {
    // Map symbols to CoinGecko IDs
    const mapping = { BTC: 'bitcoin', ETH: 'ethereum', SEI: 'sei-network', USDC: 'usd-coin' };
    const id = mapping[symbol.toUpperCase()] || symbol.toLowerCase();

    const url = `https://api.coingecko.com/api/v3/simple/price?ids=${id}&vs_currencies=usd&include_24hr_change=true`;
    const res = await fetch(url);
    const data = await res.json();

    if (!data[id]) throw new Error('Invalid symbol or not supported.');

    const change = data[id].usd_24h_change;
    return change > 0 ? '📈 UP (Bullish)' : '📉 DOWN (Bearish)';
  } catch (err) {
    console.error('fetchSignal error:', err);
    return '❌ Unable to fetch signal';
  }
}
