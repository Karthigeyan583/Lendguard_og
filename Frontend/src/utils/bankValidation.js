/**
 * Global Banking Mandates & Compliance Configuration (Bible v2.0)
 * Supports up to 3 bank accounts per contact with strict national validation rules.
 */

export const COUNTRY_BANK_MANDATES = [
  {
    code: 'IN',
    name: 'India',
    flag: '🇮🇳',
    currency: 'INR',
    fields: [
      { key: 'bank_name', label: 'Bank Name', placeholder: 'e.g. HDFC Bank / State Bank of India', required: true },
      { key: 'account_holder_name', label: 'Account Beneficiary Name', placeholder: 'e.g. Rahul Sharma', required: true },
      { key: 'account_number', label: 'Account Number', placeholder: '9 to 18 digits (e.g. 50100234567890)', required: true, type: 'text', maxLength: 18 },
      { key: 'ifsc_code', label: 'IFSC Code', placeholder: '11 characters (e.g. HDFC0001234)', required: true, type: 'text', maxLength: 11, uppercase: true },
      { key: 'upi_id', label: 'UPI ID / VPA (Optional)', placeholder: 'e.g. name@okhdfcbank', required: false, type: 'text' },
      { key: 'account_type', label: 'Account Type', type: 'select', options: [{ value: 'savings', label: 'Savings Account' }, { value: 'current', label: 'Current Account' }, { value: 'salary', label: 'Salary Account' }] }
    ]
  },
  {
    code: 'GB',
    name: 'United Kingdom',
    flag: '🇬🇧',
    currency: 'GBP',
    fields: [
      { key: 'bank_name', label: 'Bank Name', placeholder: 'e.g. Barclays / HSBC UK / Lloyds', required: true },
      { key: 'account_holder_name', label: 'Account Holder Name', placeholder: 'e.g. Johnathan Smith', required: true },
      { key: 'sort_code', label: 'Sort Code', placeholder: '6 digits (e.g. 20-45-77)', required: true, maxLength: 8 },
      { key: 'account_number', label: 'Account Number', placeholder: '8 digits (e.g. 12345678)', required: true, maxLength: 8 },
      { key: 'iban', label: 'IBAN (Optional for International)', placeholder: 'e.g. GB29NWBK60161331926819', required: false, uppercase: true }
    ]
  },
  {
    code: 'US',
    name: 'United States',
    flag: '🇺🇸',
    currency: 'USD',
    fields: [
      { key: 'bank_name', label: 'Bank Name', placeholder: 'e.g. JPMorgan Chase / Bank of America', required: true },
      { key: 'account_holder_name', label: 'Account Holder Name', placeholder: 'e.g. Michael Miller', required: true },
      { key: 'routing_number', label: 'ABA Routing Transit Number', placeholder: '9 digits (e.g. 021000021)', required: true, maxLength: 9 },
      { key: 'account_number', label: 'Account Number', placeholder: '4 to 17 digits (e.g. 9876543210)', required: true, maxLength: 17 },
      { key: 'account_type', label: 'Account Type', type: 'select', options: [{ value: 'checking', label: 'Checking Account' }, { value: 'savings', label: 'Savings Account' }] }
    ]
  },
  {
    code: 'EU',
    name: 'European Union (SEPA)',
    flag: '🇪🇺',
    currency: 'EUR',
    fields: [
      { key: 'bank_name', label: 'Bank Name', placeholder: 'e.g. BNP Paribas / Deutsche Bank', required: true },
      { key: 'account_holder_name', label: 'Beneficiary Name', placeholder: 'e.g. Jean Dupont', required: true },
      { key: 'iban', label: 'IBAN (International Bank Account Number)', placeholder: 'e.g. FR1420041010050500013M02606', required: true, uppercase: true, maxLength: 34 },
      { key: 'swift_bic', label: 'BIC / SWIFT Code', placeholder: '8 or 11 characters (e.g. BNPAFR22XXX)', required: false, uppercase: true, maxLength: 11 }
    ]
  },
  {
    code: 'AE',
    name: 'United Arab Emirates',
    flag: '🇦🇪',
    currency: 'AED',
    fields: [
      { key: 'bank_name', label: 'Bank Name', placeholder: 'e.g. Emirates NBD / First Abu Dhabi Bank', required: true },
      { key: 'account_holder_name', label: 'Beneficiary Name', placeholder: 'e.g. Ahmed Al Mansoori', required: true },
      { key: 'iban', label: 'UAE IBAN (Starts with AE)', placeholder: '23 characters (e.g. AE070330000000123456789)', required: true, uppercase: true, maxLength: 23 },
      { key: 'swift_bic', label: 'SWIFT / BIC Code', placeholder: '8 or 11 characters (e.g. ENBDAEADXXX)', required: false, uppercase: true, maxLength: 11 }
    ]
  },
  {
    code: 'CA',
    name: 'Canada',
    flag: '🇨🇦',
    currency: 'CAD',
    fields: [
      { key: 'bank_name', label: 'Bank Name', placeholder: 'e.g. Royal Bank of Canada (RBC) / TD Bank', required: true },
      { key: 'account_holder_name', label: 'Account Holder Name', placeholder: 'e.g. David Wilson', required: true },
      { key: 'transit_number', label: 'Branch Transit Number', placeholder: '5 digits (e.g. 12345)', required: true, maxLength: 5 },
      { key: 'institution_number', label: 'Institution Number', placeholder: '3 digits (e.g. 003)', required: true, maxLength: 3 },
      { key: 'account_number', label: 'Account Number', placeholder: '7 to 12 digits (e.g. 1234567)', required: true, maxLength: 12 }
    ]
  },
  {
    code: 'AU',
    name: 'Australia',
    flag: '🇦🇺',
    currency: 'AUD',
    fields: [
      { key: 'bank_name', label: 'Bank Name', placeholder: 'e.g. Commonwealth Bank / ANZ Bank', required: true },
      { key: 'account_holder_name', label: 'Account Name', placeholder: 'e.g. Liam Taylor', required: true },
      { key: 'bsb_number', label: 'BSB Number', placeholder: '6 digits (e.g. 062-000)', required: true, maxLength: 7 },
      { key: 'account_number', label: 'Account Number', placeholder: '6 to 9 digits (e.g. 12345678)', required: true, maxLength: 9 }
    ]
  },
  {
    code: 'OTHER',
    name: 'International / Other',
    flag: '🌐',
    currency: 'USD',
    fields: [
      { key: 'bank_name', label: 'Bank Name', placeholder: 'Financial Institution Name', required: true },
      { key: 'account_holder_name', label: 'Beneficiary Name', placeholder: 'Full Name on Account', required: true },
      { key: 'account_number', label: 'Account Number / IBAN', placeholder: 'Account Number or Local Identifier', required: true },
      { key: 'swift_bic', label: 'SWIFT / BIC Code', placeholder: '8 or 11 characters (e.g. CHASUS33XXX)', required: false, uppercase: true }
    ]
  }
];

export const createDefaultBankAccount = (countryCode = 'IN', isPrimary = true) => ({
  country: countryCode,
  bank_name: '',
  account_holder_name: '',
  account_number: '',
  account_type: 'savings',
  is_primary: isPrimary,
  ifsc_code: '',
  upi_id: '',
  sort_code: '',
  routing_number: '',
  iban: '',
  swift_bic: '',
  transit_number: '',
  institution_number: '',
  bsb_number: ''
});

export const validateBankAccount = (account) => {
  const country = account.country || 'IN';
  const errors = {};

  if (!account.bank_name || !account.bank_name.trim()) {
    errors.bank_name = 'Bank name is required.';
  }

  if (!account.account_holder_name || !account.account_holder_name.trim()) {
    errors.account_holder_name = 'Account holder name is required.';
  }

  if (country === 'IN') {
    const cleanAcc = (account.account_number || '').replace(/[\s\-]/g, '');
    if (!cleanAcc) {
      errors.account_number = 'Account number is required.';
    } else if (!/^\d{9,18}$/.test(cleanAcc)) {
      errors.account_number = 'Indian bank account number must be 9 to 18 digits.';
    }

    const ifsc = (account.ifsc_code || '').trim().toUpperCase();
    if (!ifsc) {
      errors.ifsc_code = '11-character IFSC code is mandatory.';
    } else if (!/^[A-Z]{4}0[A-Z0-9]{6}$/.test(ifsc)) {
      errors.ifsc_code = 'Invalid IFSC code (e.g. HDFC0001234, 5th character must be 0).';
    }
  } else if (country === 'GB') {
    const cleanSort = (account.sort_code || '').replace(/[\s\-]/g, '');
    if (!cleanSort || !/^\d{6}$/.test(cleanSort)) {
      errors.sort_code = 'UK Sort code must be 6 digits (e.g. 20-45-77).';
    }

    const cleanAcc = (account.account_number || '').replace(/[\s\-]/g, '');
    if (!cleanAcc || !/^\d{6,8}$/.test(cleanAcc)) {
      errors.account_number = 'UK account number must be 6 to 8 digits.';
    }
  } else if (country === 'US') {
    const routing = (account.routing_number || '').replace(/[\s\-]/g, '');
    if (!routing || !/^\d{9}$/.test(routing)) {
      errors.routing_number = 'US ABA Routing number must be exactly 9 digits.';
    }

    const cleanAcc = (account.account_number || '').replace(/[\s\-]/g, '');
    if (!cleanAcc || !/^\d{4,17}$/.test(cleanAcc)) {
      errors.account_number = 'US account number must be 4 to 17 digits.';
    }
  } else if (country === 'EU') {
    const iban = (account.iban || account.account_number || '').replace(/[\s\-]/g, '').toUpperCase();
    if (!iban || iban.length < 15 || iban.length > 34) {
      errors.iban = 'Valid SEPA IBAN (15-34 characters) is required.';
    }
  } else if (country === 'AE') {
    const iban = (account.iban || account.account_number || '').replace(/[\s\-]/g, '').toUpperCase();
    if (!iban || !iban.startsWith('AE') || iban.length !== 23) {
      errors.iban = 'UAE IBAN must start with AE and be exactly 23 characters.';
    }
  } else if (country === 'CA') {
    const transit = (account.transit_number || '').replace(/[\s\-]/g, '');
    const inst = (account.institution_number || '').replace(/[\s\-]/g, '');
    const acc = (account.account_number || '').replace(/[\s\-]/g, '');

    if (!transit || !/^\d{5}$/.test(transit)) errors.transit_number = '5-digit Transit number is required.';
    if (!inst || !/^\d{3}$/.test(inst)) errors.institution_number = '3-digit Institution number is required.';
    if (!acc || !/^\d{7,12}$/.test(acc)) errors.account_number = 'Account number must be 7 to 12 digits.';
  } else if (country === 'AU') {
    const bsb = (account.bsb_number || '').replace(/[\s\-]/g, '');
    const acc = (account.account_number || '').replace(/[\s\-]/g, '');

    if (!bsb || !/^\d{6}$/.test(bsb)) errors.bsb_number = '6-digit BSB number is required (e.g. 062-000).';
    if (!acc || !/^\d{6,9}$/.test(acc)) errors.account_number = 'Account number must be 6 to 9 digits.';
  } else {
    const acc = (account.account_number || '').trim();
    if (!acc) errors.account_number = 'Account number or identifier is required.';
  }

  return {
    isValid: Object.keys(errors).length === 0,
    errors
  };
};
