// Currency Formatting & Conversion Utilities for LendGuard v2.0

export const CURRENCY_MAP = {
  INR: { symbol: '₹', name: 'Indian Rupee', label: 'INR (₹)', flag: '🇮🇳' },
  USD: { symbol: '$', name: 'US Dollar', label: 'USD ($)', flag: '🇺🇸' },
  EUR: { symbol: '€', name: 'Euro', label: 'EUR (€)', flag: '🇪🇺' },
  GBP: { symbol: '£', name: 'British Pound', label: 'GBP (£)', flag: '🇬🇧' },
  AED: { symbol: 'AED ', name: 'UAE Dirham', label: 'AED (د.إ)', flag: '🇦🇪' },
  SGD: { symbol: 'S$', name: 'Singapore Dollar', label: 'SGD (S$)', flag: '🇸🇬' },
  CHF: { symbol: 'Fr ', name: 'Swiss Franc', label: 'CHF (Fr)', flag: '🇨🇭' },
  CAD: { symbol: 'CA$', name: 'Canadian Dollar', label: 'CAD (CA$)', flag: '🇨🇦' },
  AUD: { symbol: 'AU$', name: 'Australian Dollar', label: 'AUD (AU$)', flag: '🇦🇺' },
  SAR: { symbol: 'SAR ', name: 'Saudi Riyal', label: 'SAR (﷼)', flag: '🇸🇦' },
  QAR: { symbol: 'QAR ', name: 'Qatari Riyal', label: 'QAR (ر.ق)', flag: '🇶🇦' },
  KWD: { symbol: 'KWD ', name: 'Kuwaiti Dinar', label: 'KWD (د.ك)', flag: '🇰🇼' },
  JPY: { symbol: '¥', name: 'Japanese Yen', label: 'JPY (¥)', flag: '🇯🇵' },
  NZD: { symbol: 'NZ$', name: 'New Zealand Dollar', label: 'NZD (NZ$)', flag: '🇳🇿' },
  ZAR: { symbol: 'R ', name: 'South African Rand', label: 'ZAR (R)', flag: '🇿🇦' },
  MYR: { symbol: 'RM ', name: 'Malaysian Ringgit', label: 'MYR (RM)', flag: '🇲🇾' },
  PHP: { symbol: '₱', name: 'Philippine Peso', label: 'PHP (₱)', flag: '🇵🇭' },
  THB: { symbol: '฿', name: 'Thai Baht', label: 'THB (฿)', flag: '🇹🇭' },
  IDR: { symbol: 'Rp ', name: 'Indonesian Rupiah', label: 'IDR (Rp)', flag: '🇮🇩' },
  BRL: { symbol: 'R$', name: 'Brazilian Real', label: 'BRL (R$)', flag: '🇧🇷' },
  MXN: { symbol: 'Mex$', name: 'Mexican Peso', label: 'MXN (Mex$)', flag: '🇲🇽' },
  NOK: { symbol: 'kr ', name: 'Norwegian Krone', label: 'NOK (kr)', flag: '🇳🇴' },
  SEK: { symbol: 'kr ', name: 'Swedish Krona', label: 'SEK (kr)', flag: '🇸🇪' },
  DKK: { symbol: 'kr ', name: 'Danish Krone', label: 'DKK (kr)', flag: '🇩🇰' },
};

// Canonical Parity Reference (Base: INR per unit of currency)
export const INR_PER_UNIT = {
  INR: 1.0,
  USD: 90.0,
  EUR: 98.0,
  GBP: 115.0,
  CHF: 102.5,
  CAD: 65.0,
  AUD: 58.0,
  AED: 24.5,
  SGD: 68.0,
  SAR: 24.0,
  QAR: 24.7,
  KWD: 295.0,
  JPY: 0.60,
  NZD: 53.0,
  ZAR: 5.0,
  MYR: 20.5,
  PHP: 1.6,
  THB: 2.6,
  IDR: 0.0056,
  BRL: 16.5,
  MXN: 4.8,
  NOK: 8.5,
  SEK: 8.5,
  DKK: 13.0
};

export const getDefaultCurrency = () => {
  return localStorage.getItem('lendguard_currency') || 'INR';
};

export const setDefaultCurrency = (code) => {
  if (code) {
    const formatted = String(code).toUpperCase().trim();
    localStorage.setItem('lendguard_currency', formatted);
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('lendguard_currency_changed', { detail: { currency: formatted } }));
    }
  }
};

export const getCurrencySymbol = (currencyCode) => {
  if (!currencyCode) {
    const def = getDefaultCurrency();
    return CURRENCY_MAP[def]?.symbol || '₹';
  }
  const code = String(currencyCode).toUpperCase().trim();
  return CURRENCY_MAP[code]?.symbol || `${code} `;
};

export const getExchangeRate = (fromCurrency, toCurrency) => {
  const src = String(fromCurrency || 'INR').toUpperCase().trim();
  const dst = String(toCurrency || 'INR').toUpperCase().trim();

  if (src === dst) return 1.0;

  const srcInr = INR_PER_UNIT[src] || 1.0;
  const dstInr = INR_PER_UNIT[dst] || 1.0;

  if (dstInr === 0) return 1.0;
  return Number((srcInr / dstInr).toFixed(6));
};

export const convertCurrency = (amount, fromCurrency, toCurrency, customRate = null) => {
  const num = Number(amount || 0);
  const src = String(fromCurrency || 'INR').toUpperCase().trim();
  const dst = String(toCurrency || 'INR').toUpperCase().trim();

  if (src === dst) return num;

  if (customRate && !isNaN(customRate) && Number(customRate) > 0) {
    return num * Number(customRate);
  }

  const rate = getExchangeRate(src, dst);
  return num * rate;
};

// Masking utilities for privacy mode
export const isNumbersMasked = () => {
  return localStorage.getItem('lendguard_masked') === 'true';
};

export const setNumbersMasked = (val) => {
  localStorage.setItem('lendguard_masked', val ? 'true' : 'false');
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent('lendguard_mask_toggled', { detail: { isMasked: !!val } }));
  }
};

export const maskValue = (val, isMasked) => {
  if (isMasked) return '••••••';
  return val;
};

export const formatMoney = (amount, currencyCode, isMasked = false) => {
  if (isMasked) return '••••••';
  const num = Number(amount || 0);
  const symbol = getCurrencySymbol(currencyCode);
  const formatted = num.toLocaleString('en-US', {
    minimumFractionDigits: num % 1 !== 0 ? 2 : 0,
    maximumFractionDigits: 2
  });
  return `${symbol}${formatted}`;
};
