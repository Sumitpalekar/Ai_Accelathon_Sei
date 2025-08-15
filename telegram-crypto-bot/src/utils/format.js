export function fmtAmount(num) {
  try { return Number(num).toLocaleString(undefined, { maximumFractionDigits: 6 }); }
  catch { return String(num); }
}
