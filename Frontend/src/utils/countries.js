// Comprehensive Global Dialing Codes and National Phone Digit Limits (ITU-T E.164 compliant)
export const GLOBAL_COUNTRY_PHONE_CONFIG = [
  // South Asia
  { code: '+91', country: 'IN', label: '🇮🇳 +91 (India)', name: 'India', digits: 10, placeholder: '98844 01234' },
  { code: '+92', country: 'PK', label: '🇵🇰 +92 (Pakistan)', name: 'Pakistan', digits: 10, placeholder: '300 1234567' },
  { code: '+880', country: 'BD', label: '🇧🇩 +880 (Bangladesh)', name: 'Bangladesh', digits: 10, placeholder: '1712 345678' },
  { code: '+94', country: 'LK', label: '🇱🇰 +94 (Sri Lanka)', name: 'Sri Lanka', digits: 9, placeholder: '71 234 5678' },
  { code: '+977', country: 'NP', label: '🇳🇵 +977 (Nepal)', name: 'Nepal', digits: 10, placeholder: '984 1234567' },

  // Middle East & Gulf
  { code: '+971', country: 'AE', label: '🇦🇪 +971 (UAE)', name: 'United Arab Emirates', digits: 9, placeholder: '50 123 4567' },
  { code: '+966', country: 'SA', label: '🇸🇦 +966 (Saudi Arabia)', name: 'Saudi Arabia', digits: 9, placeholder: '50 123 4567' },
  { code: '+974', country: 'QA', label: '🇶🇦 +974 (Qatar)', name: 'Qatar', digits: 8, placeholder: '3312 3456' },
  { code: '+965', country: 'KW', label: '🇰🇼 +965 (Kuwait)', name: 'Kuwait', digits: 8, placeholder: '5012 3456' },
  { code: '+968', country: 'OM', label: '🇴🇲 +968 (Oman)', name: 'Oman', digits: 8, placeholder: '9123 4567' },
  { code: '+973', country: 'BH', label: '🇧🇭 +973 (Bahrain)', name: 'Bahrain', digits: 8, placeholder: '3912 3456' },

  // North America
  { code: '+1', country: 'US', label: '🇺🇸 +1 (USA)', name: 'United States', digits: 10, placeholder: '202 555 0123' },
  { code: '+1', country: 'CA', label: '🇨🇦 +1 (Canada)', name: 'Canada', digits: 10, placeholder: '416 555 0123' },
  { code: '+52', country: 'MX', label: '🇲🇽 +52 (Mexico)', name: 'Mexico', digits: 10, placeholder: '55 1234 5678' },

  // Europe
  { code: '+44', country: 'GB', label: '🇬🇧 +44 (UK)', name: 'United Kingdom', digits: 10, placeholder: '7911 123456' },
  { code: '+49', country: 'DE', label: '🇩🇪 +49 (Germany)', name: 'Germany', digits: 11, placeholder: '151 12345678' },
  { code: '+33', country: 'FR', label: '🇫🇷 +33 (France)', name: 'France', digits: 9, placeholder: '6 12 34 56 78' },
  { code: '+39', country: 'IT', label: '🇮🇹 +39 (Italy)', name: 'Italy', digits: 10, placeholder: '312 345 6789' },
  { code: '+34', country: 'ES', label: '🇪🇸 +34 (Spain)', name: 'Spain', digits: 9, placeholder: '612 34 56 78' },
  { code: '+41', country: 'CH', label: '🇨🇭 +41 (Switzerland)', name: 'Switzerland', digits: 9, placeholder: '79 123 45 67' },
  { code: '+31', country: 'NL', label: '🇳🇱 +31 (Netherlands)', name: 'Netherlands', digits: 9, placeholder: '6 12345678' },
  { code: '+353', country: 'IE', label: '🇮🇪 +353 (Ireland)', name: 'Ireland', digits: 9, placeholder: '85 123 4567' },
  { code: '+46', country: 'SE', label: '🇸🇪 +46 (Sweden)', name: 'Sweden', digits: 9, placeholder: '70 123 45 67' },
  { code: '+47', country: 'NO', label: '🇳🇴 +47 (Norway)', name: 'Norway', digits: 8, placeholder: '412 34 567' },
  { code: '+45', country: 'DK', label: '🇩🇰 +45 (Denmark)', name: 'Denmark', digits: 8, placeholder: '20 12 34 56' },
  { code: '+90', country: 'TR', label: '🇹🇷 +90 (Turkey)', name: 'Turkey', digits: 10, placeholder: '532 123 4567' },

  // Asia Pacific
  { code: '+65', country: 'SG', label: '🇸🇬 +65 (Singapore)', name: 'Singapore', digits: 8, placeholder: '8123 4567' },
  { code: '+61', country: 'AU', label: '🇦🇺 +61 (Australia)', name: 'Australia', digits: 9, placeholder: '412 345 678' },
  { code: '+64', country: 'NZ', label: '🇳🇿 +64 (New Zealand)', name: 'New Zealand', digits: 9, placeholder: '21 123 4567' },
  { code: '+81', country: 'JP', label: '🇯🇵 +81 (Japan)', name: 'Japan', digits: 10, placeholder: '90 1234 5678' },
  { code: '+86', country: 'CN', label: '🇨🇳 +86 (China)', name: 'China', digits: 11, placeholder: '138 0013 8000' },
  { code: '+82', country: 'KR', label: '🇰🇷 +82 (South Korea)', name: 'South Korea', digits: 10, placeholder: '10 1234 5678' },
  { code: '+60', country: 'MY', label: '🇲🇾 +60 (Malaysia)', name: 'Malaysia', digits: 10, placeholder: '12 345 6789' },
  { code: '+62', country: 'ID', label: '🇮🇩 +62 (Indonesia)', name: 'Indonesia', digits: 11, placeholder: '812 3456 7890' },
  { code: '+63', country: 'PH', label: '🇵🇭 +63 (Philippines)', name: 'Philippines', digits: 10, placeholder: '917 123 4567' },
  { code: '+66', country: 'TH', label: '🇹🇭 +66 (Thailand)', name: 'Thailand', digits: 9, placeholder: '81 234 5678' },
  { code: '+84', country: 'VN', label: '🇻🇳 +84 (Vietnam)', name: 'Vietnam', digits: 9, placeholder: '90 123 4567' },

  // South America
  { code: '+55', country: 'BR', label: '🇧🇷 +55 (Brazil)', name: 'Brazil', digits: 11, placeholder: '11 91234 5678' },
  { code: '+54', country: 'AR', label: '🇦🇷 +54 (Argentina)', name: 'Argentina', digits: 10, placeholder: '11 1234 5678' },

  // Africa
  { code: '+27', country: 'ZA', label: '🇿🇦 +27 (South Africa)', name: 'South Africa', digits: 9, placeholder: '82 123 4567' },
  { code: '+234', country: 'NG', label: '🇳🇬 +234 (Nigeria)', name: 'Nigeria', digits: 10, placeholder: '802 123 4567' },
  { code: '+254', country: 'KE', label: '🇰🇪 +254 (Kenya)', name: 'Kenya', digits: 9, placeholder: '712 345678' },
  { code: '+20', country: 'EG', label: '🇪🇬 +20 (Egypt)', name: 'Egypt', digits: 10, placeholder: '100 123 4567' },

  // Other Global
  { code: '+', country: 'OTHER', label: '🌐 + Other International', name: 'Other International', digits: 15, placeholder: 'Enter phone digits' },
];
