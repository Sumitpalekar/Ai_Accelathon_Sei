
import fetch from 'node-fetch';

export async function fetchBalance(walletAddress) {
  try {
    const res = await fetch(`https://sei-api.example.com/balance/${walletAddress}`); 
    const data = await res.json();

    if (!data || !data.balances) return 'No balances found';

    return data.balances.map(b => `${b.amount} ${b.denom}`).join('\n');
  } catch (err) {
    console.error('❌ fetchBalance error:', err);
    throw new Error('Balance fetch failed');
  }
}
