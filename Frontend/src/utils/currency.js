// Currency Formatting & Conversion Utilities for LendGuard v2.0

export const CURRENCY_MAP = {
  INR: { symbol: '₹', name: 'Indian Rupee', label: 'INR (₹)' },
  USD: { symbol: '$', name: 'US Dollar', label: 'USD ($)' },
  EUR: { symbol: '€', name: 'Euro', label: 'EUR (€)' },
  GBP: { symbol: '£', name: 'British Pound', label: 'GBP (£)' },
  CAD: { symbol: 'CA$', name: 'Canadian Dollar', label: 'CAD (CA$)' },
  AUD: { symbol: 'AU$', name: 'Australian Dollar', label: 'AUD (AU$)' },
  AED: { symbol: 'AED ', name: 'UAE Dirham', label: 'AED (AED)' },
  SGD: { symbol: 'S$', name: 'Singapore Dollar', label: 'SGD (S$)' }
};

// Canonical Parity Reference (Base: INR per unit of currency)
export const INR_PER_UNIT = {
  INR: 1.0,
  USD: 90.0,
  EUR: 98.0,
  GBP: 115.0,
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
    localStorage.setItem('lendguard_currency', String(code).toUpperCase());
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

  const rate = customRate != null && Number(customRate) > 0
    ? Number(customRate)
    : getExchangeRate(src, dst);

  return Number((num * rate).toFixed(2));
};

export const isNumbersMasked = () => {
  return localStorage.getItem('lendguard_mask_numbers') === 'true';
};

export const setNumbersMasked = (masked) => {
  localStorage.setItem('lendguard_mask_numbers', masked ? 'true' : 'false');
};

export const formatMoney = (amount, currencyCode, isMasked = false) => {
  const symbol = getCurrencySymbol(currencyCode);
  if (isMasked) {
    return `${symbol}••••••`;
  }
  const num = Number(amount || 0);
  return `${symbol}${num.toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 2 })}`;
};

export const maskValue = (formattedString, isMasked = false) => {
  if (!isMasked) return formattedString;
  // If it contains a currency symbol, keep the symbol and mask the numbers
  return formattedString.replace(/[\d,]+(\.\d+)?/g, '••••••');
};
