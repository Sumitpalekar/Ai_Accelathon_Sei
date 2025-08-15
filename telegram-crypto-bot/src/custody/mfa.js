const store = new Map(); // key: userId, value: { code, exp }

export function issueCode(userId, ttlMs = 2 * 60 * 1000) {
  const code = Math.floor(100000 + Math.random() * 900000).toString();
  const exp = Date.now() + ttlMs;
  store.set(String(userId), { code, exp });
  return code;
}

export function verifyCode(userId, code) {
  const rec = store.get(String(userId));
  if (!rec) return false;
  const ok = rec.code === code && rec.exp >= Date.now();
  if (ok) store.delete(String(userId));
  return ok;
}
