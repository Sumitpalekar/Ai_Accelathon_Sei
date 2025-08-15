export function parseAmount(input) {
  const n = Number(input);
  if (!isFinite(n) || n <= 0) throw new Error('Invalid amount');
  return n;
}

export function ensureAddress(addr) {
  if (!/^0x[a-fA-F0-9]{40}$/.test(addr)) throw new Error('Invalid EVM address');
  return addr;
}

export function parseChainHint(text, fallback='sei') {
  const m = text.match(/\bon\s+(ethereum|polygon|sei)\b/i);
  return (m ? m[1].toLowerCase() : fallback);
}
