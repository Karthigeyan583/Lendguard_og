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
  SGD: 68.0
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
