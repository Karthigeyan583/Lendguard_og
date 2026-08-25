// Currency Formatting Utilities for LendGuard v2.0

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

export const getDefaultCurrency = () => {
  return localStorage.getItem('lendguard_currency') || 'INR';
};

export const getCurrencySymbol = (currencyCode) => {
  if (!currencyCode) {
    const def = getDefaultCurrency();
    return CURRENCY_MAP[def]?.symbol || '₹';
  }
  const code = String(currencyCode).toUpperCase().trim();
  return CURRENCY_MAP[code]?.symbol || `${code} `;
};

export const formatMoney = (amount, currencyCode) => {
  const num = Number(amount || 0);
  const symbol = getCurrencySymbol(currencyCode);
  return `${symbol}${num.toLocaleString(undefined, { maximumFractionDigits: 2 })}`;
};
