import fetch from 'node-fetch';

const BASE = 'https://api.coingecko.com/api/v3';

export async function simplePrice(ids, vs='usd') {
  const url = new URL(BASE + '/simple/price');
  url.searchParams.set('ids', ids);
  url.searchParams.set('vs_currencies', vs);
  const res = await fetch(url);
  if (!res.ok) throw new Error('CoinGecko error');
  return res.json();
}
