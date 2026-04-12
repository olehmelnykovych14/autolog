/**
 * Formats cost to Ukrainian locale
 */
const fmtCost = (v) => v ? Number(v).toLocaleString('uk-UA') : '0';

/**
 * Safe date parsing to match Dashboard logic (ignoring TZ shifts)
 */
const parseDateSafe = (dateStr) => {
  if (!dateStr) return new Date();
  if (dateStr.includes('T')) return new Date(dateStr);
  
  let y, m, d;
  if (dateStr.includes('-')) {
    [y, m, d] = dateStr.split('-').map(Number);
  } else if (dateStr.includes('.')) {
    [d, m, y] = dateStr.split('.').map(Number);
  } else {
    return new Date(dateStr);
  }
  return new Date(y, m - 1, d);
};

/**
 * Normalize plate to handle Latin/Cyrillic mix (e.g., P vs П, A vs А)
 */
const normPlate = (p) => {
  if (!p) return '';
  const map = { 'A':'А','B':'В','C':'С','E':'Е','H':'Н','K':'К','M':'М','P':'П','T':'Т','X':'Х','O':'О' };
  return String(p).toUpperCase().trim().split('').map(c => map[c] || c).join('');
};

module.exports = {
  fmtCost,
  parseDateSafe,
  normPlate
};
