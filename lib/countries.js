// Top countries with flags and default currencies
export const COUNTRIES = [
  { code: 'AE', name: 'United Arab Emirates', flag: '🇦🇪', currency: 'AED', vatLabel: 'TRN' },
  { code: 'MA', name: 'Morocco', flag: '🇲🇦', currency: 'MAD', vatLabel: 'ICE' },
  { code: 'SA', name: 'Saudi Arabia', flag: '🇸🇦', currency: 'SAR', vatLabel: 'VAT Number' },
  { code: 'EG', name: 'Egypt', flag: '🇪🇬', currency: 'EGP', vatLabel: 'Tax ID' },
  { code: 'US', name: 'United States', flag: '🇺🇸', currency: 'USD', vatLabel: 'EIN' },
  { code: 'GB', name: 'United Kingdom', flag: '🇬🇧', currency: 'GBP', vatLabel: 'VAT Number' },
  { code: 'FR', name: 'France', flag: '🇫🇷', currency: 'EUR', vatLabel: 'SIRET' },
  { code: 'DE', name: 'Germany', flag: '🇩🇪', currency: 'EUR', vatLabel: 'USt-IdNr' },
  { code: 'IN', name: 'India', flag: '🇮🇳', currency: 'INR', vatLabel: 'GSTIN' },
  { code: 'PK', name: 'Pakistan', flag: '🇵🇰', currency: 'PKR', vatLabel: 'NTN' },
  { code: 'TR', name: 'Turkey', flag: '🇹🇷', currency: 'TRY', vatLabel: 'VKN' },
  { code: 'QA', name: 'Qatar', flag: '🇶🇦', currency: 'QAR', vatLabel: 'Tax ID' },
  { code: 'KW', name: 'Kuwait', flag: '🇰🇼', currency: 'KWD', vatLabel: 'Tax ID' },
  { code: 'BH', name: 'Bahrain', flag: '🇧🇭', currency: 'BHD', vatLabel: 'VAT Number' },
  { code: 'OM', name: 'Oman', flag: '🇴🇲', currency: 'OMR', vatLabel: 'VAT Number' },
  { code: 'JO', name: 'Jordan', flag: '🇯🇴', currency: 'JOD', vatLabel: 'Tax ID' },
  { code: 'LB', name: 'Lebanon', flag: '🇱🇧', currency: 'USD', vatLabel: 'Tax ID' },
  { code: 'TN', name: 'Tunisia', flag: '🇹🇳', currency: 'TND', vatLabel: 'Tax ID' },
  { code: 'DZ', name: 'Algeria', flag: '🇩🇿', currency: 'DZD', vatLabel: 'NIF' },
  { code: 'NG', name: 'Nigeria', flag: '🇳🇬', currency: 'NGN', vatLabel: 'TIN' },
  { code: 'ZA', name: 'South Africa', flag: '🇿🇦', currency: 'ZAR', vatLabel: 'VAT Number' },
  { code: 'KE', name: 'Kenya', flag: '🇰🇪', currency: 'KES', vatLabel: 'PIN' },
  { code: 'GH', name: 'Ghana', flag: '🇬🇭', currency: 'GHS', vatLabel: 'TIN' },
  { code: 'SN', name: 'Senegal', flag: '🇸🇳', currency: 'XOF', vatLabel: 'NINEA' },
  { code: 'CI', name: "Côte d'Ivoire", flag: '🇨🇮', currency: 'XOF', vatLabel: 'CC' },
  { code: 'CM', name: 'Cameroon', flag: '🇨🇲', currency: 'XAF', vatLabel: 'NIU' },
  { code: 'CN', name: 'China', flag: '🇨🇳', currency: 'CNY', vatLabel: 'Tax ID' },
  { code: 'JP', name: 'Japan', flag: '🇯🇵', currency: 'JPY', vatLabel: 'Tax ID' },
  { code: 'KR', name: 'South Korea', flag: '🇰🇷', currency: 'KRW', vatLabel: 'BRN' },
  { code: 'AU', name: 'Australia', flag: '🇦🇺', currency: 'AUD', vatLabel: 'ABN' },
  { code: 'CA', name: 'Canada', flag: '🇨🇦', currency: 'CAD', vatLabel: 'BN' },
  { code: 'BR', name: 'Brazil', flag: '🇧🇷', currency: 'BRL', vatLabel: 'CNPJ' },
  { code: 'MX', name: 'Mexico', flag: '🇲🇽', currency: 'MXN', vatLabel: 'RFC' },
  { code: 'IT', name: 'Italy', flag: '🇮🇹', currency: 'EUR', vatLabel: 'P.IVA' },
  { code: 'ES', name: 'Spain', flag: '🇪🇸', currency: 'EUR', vatLabel: 'NIF' },
  { code: 'NL', name: 'Netherlands', flag: '🇳🇱', currency: 'EUR', vatLabel: 'BTW' },
  { code: 'BE', name: 'Belgium', flag: '🇧🇪', currency: 'EUR', vatLabel: 'BTW' },
  { code: 'CH', name: 'Switzerland', flag: '🇨🇭', currency: 'CHF', vatLabel: 'UID' },
  { code: 'SE', name: 'Sweden', flag: '🇸🇪', currency: 'SEK', vatLabel: 'VAT Number' },
  { code: 'PL', name: 'Poland', flag: '🇵🇱', currency: 'PLN', vatLabel: 'NIP' },
  { code: 'RU', name: 'Russia', flag: '🇷🇺', currency: 'RUB', vatLabel: 'INN' },
  { code: 'SG', name: 'Singapore', flag: '🇸🇬', currency: 'SGD', vatLabel: 'GST Reg' },
  { code: 'MY', name: 'Malaysia', flag: '🇲🇾', currency: 'MYR', vatLabel: 'SST Reg' },
  { code: 'TH', name: 'Thailand', flag: '🇹🇭', currency: 'THB', vatLabel: 'Tax ID' },
  { code: 'PH', name: 'Philippines', flag: '🇵🇭', currency: 'PHP', vatLabel: 'TIN' },
  { code: 'ID', name: 'Indonesia', flag: '🇮🇩', currency: 'IDR', vatLabel: 'NPWP' },
  { code: 'BD', name: 'Bangladesh', flag: '🇧🇩', currency: 'BDT', vatLabel: 'BIN' },
  { code: 'LK', name: 'Sri Lanka', flag: '🇱🇰', currency: 'LKR', vatLabel: 'VAT Number' },
]

// All currencies (top 30)
export const CURRENCIES = [
  { code: 'AED', name: 'UAE Dirham', symbol: 'د.إ' },
  { code: 'MAD', name: 'Moroccan Dirham', symbol: 'MAD' },
  { code: 'USD', name: 'US Dollar', symbol: '$' },
  { code: 'EUR', name: 'Euro', symbol: '€' },
  { code: 'GBP', name: 'British Pound', symbol: '£' },
  { code: 'SAR', name: 'Saudi Riyal', symbol: 'ر.س' },
  { code: 'EGP', name: 'Egyptian Pound', symbol: 'E£' },
  { code: 'INR', name: 'Indian Rupee', symbol: '₹' },
  { code: 'PKR', name: 'Pakistani Rupee', symbol: '₨' },
  { code: 'QAR', name: 'Qatari Riyal', symbol: 'ر.ق' },
  { code: 'KWD', name: 'Kuwaiti Dinar', symbol: 'د.ك' },
  { code: 'BHD', name: 'Bahraini Dinar', symbol: 'BD' },
  { code: 'OMR', name: 'Omani Rial', symbol: 'ر.ع' },
  { code: 'JOD', name: 'Jordanian Dinar', symbol: 'JD' },
  { code: 'TRY', name: 'Turkish Lira', symbol: '₺' },
  { code: 'NGN', name: 'Nigerian Naira', symbol: '₦' },
  { code: 'ZAR', name: 'South African Rand', symbol: 'R' },
  { code: 'KES', name: 'Kenyan Shilling', symbol: 'KSh' },
  { code: 'GHS', name: 'Ghanaian Cedi', symbol: 'GH₵' },
  { code: 'XOF', name: 'CFA Franc BCEAO', symbol: 'CFA' },
  { code: 'XAF', name: 'CFA Franc BEAC', symbol: 'FCFA' },
  { code: 'CNY', name: 'Chinese Yuan', symbol: '¥' },
  { code: 'JPY', name: 'Japanese Yen', symbol: '¥' },
  { code: 'AUD', name: 'Australian Dollar', symbol: 'A$' },
  { code: 'CAD', name: 'Canadian Dollar', symbol: 'C$' },
  { code: 'CHF', name: 'Swiss Franc', symbol: 'CHF' },
  { code: 'SGD', name: 'Singapore Dollar', symbol: 'S$' },
  { code: 'BRL', name: 'Brazilian Real', symbol: 'R$' },
  { code: 'MXN', name: 'Mexican Peso', symbol: 'MX$' },
  { code: 'TND', name: 'Tunisian Dinar', symbol: 'DT' },
  { code: 'DZD', name: 'Algerian Dinar', symbol: 'DA' },
]

export function getCountryByCode(code) {
  return COUNTRIES.find(c => c.code === code)
}

export function getVatLabel(countryCode) {
  const country = getCountryByCode(countryCode)
  return country?.vatLabel || 'Tax ID'
}

export function getDefaultCurrency(countryCode) {
  const country = getCountryByCode(countryCode)
  return country?.currency || 'AED'
}
