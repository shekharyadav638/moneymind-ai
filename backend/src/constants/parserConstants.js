/**
 * Parser Constants
 * Centralised lookup tables for UPI handle → merchant name,
 * merchant keyword → category, and full-text → category rules.
 * Import these in emailParser.js and any future parsers.
 */

// ─── UPI Handle (@suffix) → Readable Merchant Name ────────────────────
const UPI_HANDLE_MAP = {
  // Paytm
  ptys: 'Paytm', paytm: 'Paytm', paytmqr: 'Paytm',
  // PhonePe
  ybl: 'PhonePe', axl: 'PhonePe', ibl: 'PhonePe', ptsbi: 'PhonePe',
  // Google Pay
  oksbi: 'Google Pay', okaxis: 'Google Pay', okicici: 'Google Pay', okhdfcbank: 'Google Pay',
  // Amazon Pay
  apl: 'Amazon Pay', amazonpay: 'Amazon Pay',
  // Others
  upi: 'UPI Transfer', bhim: 'BHIM UPI',
  razorpay: 'Razorpay', rzp: 'Razorpay',
  sbi: 'SBI Transfer', hdfc: 'HDFC Transfer', icici: 'ICICI Transfer',
  axis: 'Axis Bank', kotak: 'Kotak',
  airtel: 'Airtel', jupiteraxis: 'Jupiter', fampay: 'FamPay',
  timecosmos: 'CRED', cred: 'CRED', indus: 'IndusInd',
};

// ─── Merchant Keyword → Category ───────────────────────────────────────
const MERCHANT_CATEGORIES = {
  // Food & Dining
  swiggy: 'Food', zomato: 'Food', dominos: 'Food', 'pizza hut': 'Food',
  mcdonalds: 'Food', mcdonald: 'Food', starbucks: 'Food', kfc: 'Food',
  dunkin: 'Food', subway: 'Food', barbeque: 'Food', haldiram: 'Food',
  bigbasket: 'Food', blinkit: 'Food', grofers: 'Food', zepto: 'Food',
  dunzo: 'Food', instamart: 'Food', jiomart: 'Food',
  // Travel
  uber: 'Travel', ola: 'Travel', rapido: 'Travel', irctc: 'Travel',
  indigo: 'Travel', spicejet: 'Travel', vistara: 'Travel',
  makemytrip: 'Travel', yatra: 'Travel', redbus: 'Travel', goibibo: 'Travel',
  fastag: 'Travel', nhai: 'Travel', metro: 'Travel',
  // Shopping
  amazon: 'Shopping', flipkart: 'Shopping', myntra: 'Shopping',
  ajio: 'Shopping', meesho: 'Shopping', nykaa: 'Shopping',
  snapdeal: 'Shopping', decathlon: 'Shopping', ikea: 'Shopping',
  // Bills & Utilities
  airtel: 'Bills', jio: 'Bills', vodafone: 'Bills', vi: 'Bills',
  bsnl: 'Bills', bescom: 'Bills', adani: 'Bills', 'tata power': 'Bills',
  electricity: 'Bills', recharge: 'Bills', tatasky: 'Bills', d2h: 'Bills',
  'mahanagar gas': 'Bills', broadband: 'Bills',
  // Entertainment
  netflix: 'Entertainment', hotstar: 'Entertainment', spotify: 'Entertainment',
  prime: 'Entertainment', zee5: 'Entertainment', bookmyshow: 'Entertainment',
  pvr: 'Entertainment', inox: 'Entertainment', gaana: 'Entertainment',
  // Health
  apollo: 'Health', practo: 'Health', pharmeasy: 'Health',
  netmeds: 'Health', '1mg': 'Health', medplus: 'Health',
  cultfit: 'Health', thyrocare: 'Health', 'star health': 'Health',
  care: 'Health', 'health insurance': 'Health', 'policybazaar': 'Health',
  // Education
  udemy: 'Education', coursera: 'Education', byju: 'Education', byjus: 'Education',
  unacademy: 'Education', vedantu: 'Education',
  // Rent & Housing
  nobroker: 'Rent', housing: 'Rent',
  // Investment
  zerodha: 'Investment', groww: 'Investment', upstox: 'Investment', kuvera: 'Investment',
  'paytm money': 'Investment', 'angel broking': 'Investment',
};

// ─── Full-text Keyword Rules → Category Fallback ───────────────────────
// Used when merchant name alone doesn't match any keyword above.
// Rules are evaluated in order; first match wins.
const TEXT_CATEGORY_PATTERNS = [
  { keywords: ['salary', 'payroll', 'stipend'],              type: 'credit', category: 'Income' },
  { keywords: ['refund', 'cashback', 'reversal'],            type: 'credit', category: 'Income' },
  { keywords: ['emi', 'loan', 'mortgage', 'equated monthly'],               category: 'Bills' },
  { keywords: ['rent', 'landlord', 'pg ', 'hostel'],         type: 'debit',  category: 'Rent' },
  { keywords: ['insurance', 'premium', 'lic ', 'hdfc life', 'sbi life'],    category: 'Bills' },
  { keywords: ['mutual fund', 'sip', 'nps', 'elss', 'ppf'], type: 'debit',  category: 'Investment' },
  { keywords: ['fuel', 'petrol', 'diesel', 'hpcl', 'bpcl', 'iocl'],        category: 'Travel' },
  { keywords: ['hospital', 'clinic', 'medical', 'doctor', 'pharmacy'],      category: 'Health' },
  { keywords: ['school', 'college', 'tuition', 'coaching'],  type: 'debit', category: 'Education' },
  { keywords: ['restaurant', 'cafe', 'food', 'kitchen', 'bakery', 'dhaba'], type: 'debit', category: 'Food' },
  { keywords: ['recharge', 'postpaid', 'broadband', 'fiber', 'internet'],   category: 'Bills' },
  { keywords: ['flight', 'airline', 'airport', 'train ticket', 'bus ticket'],category: 'Travel' },
];

module.exports = { UPI_HANDLE_MAP, MERCHANT_CATEGORIES, TEXT_CATEGORY_PATTERNS };
