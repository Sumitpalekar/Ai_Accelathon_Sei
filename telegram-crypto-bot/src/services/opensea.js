import fetch from 'node-fetch';
import { OPENSEA_API_KEY } from '../config.js';

const BASE = 'https://api.opensea.io/api/v2';

function headers() {
  const h = { 'accept': 'application/json' };
  if (OPENSEA_API_KEY) h['x-api-key'] = OPENSEA_API_KEY;
  return h;
}

export async function getAsset(chain='ethereum', collection, tokenId) {
  const url = new URL(`${BASE}/chain/${chain}/collection/${collection}/nfts/${tokenId}`);
  const res = await fetch(url, { headers: headers() });
  if (!res.ok) throw new Error('OpenSea error');
  return res.json();
}
