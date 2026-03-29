/**
 * Rule-based email parser for Indian bank transaction emails
 * Handles HDFC, SBI, ICICI, UPI (Paytm, PhonePe, GPay)
 */

const { UPI_HANDLE_MAP, MERCHANT_CATEGORIES, TEXT_CATEGORY_PATTERNS } = require('../constants/parserConstants');

/**
 * Given a raw merchant string (may be a UPI ID or messy description),
 * return a clean, readable name.
 * e.g. "paytmqr65c79z@ptys"  → "Paytm"
 *      "7827731345@ybl"       → "PhonePe"
 *      "account 2125 to VPA playstore1" → "Playstore1"
 */
const cleanMerchantName = (rawMerchant) => {
  if (!rawMerchant || rawMerchant === 'Unknown') return 'Unknown';

  // UPI ID pattern: letters/numbers/dots/dashes @ letters
  const upiMatch = rawMerchant.match(/^([a-z0-9._-]+)@([a-z]+)$/i);
  if (upiMatch) {
    const handle = upiMatch[2].toLowerCase();
    const prefix = upiMatch[1].toLowerCase();

    // 1. Prefix starts with a known service name (e.g. paytmqr → Paytm)
    for (const [key, name] of Object.entries(UPI_HANDLE_MAP)) {
      if (prefix.startsWith(key)) return name;
    }

    // 2. Extract readable letters from prefix (e.g. "zomato123" → "Zomato")
    // Strip numbers, punctuation, and common noise like "qr" at the end
    const letterPrefix = prefix.replace(/\d+/g, '').replace(/[._-]/g, ' ').replace(/(?:qr|vpa|upi)$/i, '').trim();
    if (letterPrefix.length > 2 && !/^(account|merchant)$/i.test(letterPrefix)) {
      return letterPrefix.charAt(0).toUpperCase() + letterPrefix.slice(1);
    }

    // 3. Exact handle match (e.g. 9999999999@ybl → PhonePe)
    if (UPI_HANDLE_MAP[handle]) return UPI_HANDLE_MAP[handle];

    // 4. Fallback: capitalise the handle itself
    return handle.charAt(0).toUpperCase() + handle.slice(1) + ' Pay';
  }

  // "account 2125 to VPA playstore1" → recurse on the VPA part
  const vpaMatch = rawMerchant.match(/VPA\s+([a-zA-Z0-9@._-]+)/i);
  if (vpaMatch) return cleanMerchantName(vpaMatch[1]);

  // Generic cleanup: strip leading account noise, take first 4 words
  return rawMerchant
    .replace(/^account\s+\d+\s+to\s+/i, '')
    .replace(/\s+VPA\s+/i, ' ')
    .trim()
    .split(/\s+/)
    .slice(0, 4)
    .join(' ');
};

/**
 * Determine a transaction category from the merchant name + full email text.
 * Priority: merchant keyword map → full-text rules → 'Others'
 */
const getCategoryFromMerchant = (merchant, fullText, txnType) => {
  const ml = merchant.toLowerCase();
  for (const [key, cat] of Object.entries(MERCHANT_CATEGORIES)) {
    if (ml.includes(key)) return cat;
  }

  const tl = fullText.toLowerCase();
  for (const rule of TEXT_CATEGORY_PATTERNS) {
    if (rule.type && rule.type !== txnType) continue;
    // Use word boundaries \b to avoid substring false positives (e.g. 'current' matching 'rent')
    if (rule.keywords.some(kw => {
      // Need a custom regex because \b doesn't cleanly match spaces for strings like "train ticket"
      const regex = new RegExp(`(?:^|[^a-z0-9])${kw.trim()}(?:[^a-z0-9]|$)`, 'i');
      return regex.test(tl);
    })) {
      return rule.category;
    }
  }

  return 'Others';
};

/**
 * Rule-based parser: extract a transaction object from email fields.
 * Returns null if the email doesn't look like a transaction.
 */
const ruleBasedParse = (subject, body, snippet) => {
  const fullText = `${subject} ${snippet} ${body}`;
  const fullTextLower = fullText.toLowerCase();

  // Quick gate: must contain at least one transaction keyword
  const transactionKeywords = ['debit', 'credit', 'spent', 'paid', 'received', 'transaction', 'transfer', 'payment', 'rs.', 'inr', '₹'];
  if (!transactionKeywords.some(kw => fullTextLower.includes(kw))) return null;

  // Infer debit / credit direction
  const isDebit  = /debited|spent|paid|deducted|sent|withdrawn|purchase/i.test(fullText);
  const isCredit = /credited|received|deposited|refund|cashback/i.test(fullText);
  if (!isDebit && !isCredit) return null;
  const type = isDebit ? 'debit' : 'credit';

  // Extract amount (Indian currency patterns)
  let amount = null;
  const amountPatterns = [
    /(?:Rs|INR|₹)\.?\s*([\d,]+(?:\.\d{1,2})?)/i,
    /([\d,]+(?:\.\d{1,2})?)\s*(?:Rs|INR|₹)/i,
    /(?:amount|amt)(?:\s+of)?\s*:?\s*(?:Rs|INR|₹)?\.?\s*([\d,]+(?:\.\d{1,2})?)/i,
  ];
  for (const pattern of amountPatterns) {
    const match = `${subject} ${snippet}`.match(pattern);
    if (match) { amount = parseFloat(match[1].replace(/,/g, '')); break; }
  }
  if (!amount || amount <= 0) return null;

  // Extract raw merchant string (prioritize 'at' > 'to' > 'for' to avoid capturing 'for Axis Bank Credit Card')
  let rawMerchant = 'Unknown';
  const merchantPatterns = [
    /VPA\s+([a-zA-Z0-9@._-]+)/i,                               // UPI format 1
    /account\s+\d+\s+to\s+VPA\s+([a-zA-Z0-9@._-]+)/i,          // UPI format 2
    /(?:to|at)\s+([a-zA-Z0-9@._-]+@[a-zA-Z]+)/i,               // UPI ID: xxx@yyy
    /(?:merchant|payee|beneficiary|info):\s*([A-Za-z0-9\s&._-]+)/i,
    /at\s+([A-Z][A-Za-z0-9\s&._-]{2,30}?)(?:\s+on|\s+via|\s+using|[.,\n])/i,
    /to\s+([A-Z][A-Za-z0-9\s&._-]{2,30}?)(?:\s+on|\s+via|\s+using|[.,\n])/i,
    /for\s+([A-Z][A-Za-z0-9\s&._-]{2,30}?)(?:\s+on|\s+via|\s+using|[.,\n])/i,
  ];
  for (const pattern of merchantPatterns) {
    const match = `${subject} ${snippet}`.match(pattern);
    if (match) {
      const extracted = match[1].trim();
      // Skip false positives where the subject line "Transaction for Axis Bank Credit Card" captured the card name
      if (/credit card|debit card|bank/i.test(extracted)) continue;
      
      rawMerchant = extracted;
      break;
    }
  }

  const merchant = cleanMerchantName(rawMerchant);
  const category = getCategoryFromMerchant(merchant, fullText, type);

  // Detect payment source for bank-balance calculations
  let paymentSource = 'other';
  if (/credit card/i.test(fullText)) paymentSource = 'credit_card';
  else if (/hdfc/i.test(fullText) && /debited from account|from account \d+/i.test(fullText)) paymentSource = 'hdfc_savings';
  else if (/upi|vpa|upi txn/i.test(fullText)) paymentSource = 'upi';

  return { isTransaction: true, amount, type, merchant, category, paymentSource };
};

/**
 * Main entry point — rule-based first, optional AI fallback
 */
const parseEmail = async (email, useAI = false, claudeParser = null) => {
  const ruleResult = ruleBasedParse(email.subject, email.body, email.snippet);
  if (ruleResult) {
    return { ...ruleResult, date: email.date, source: 'email', emailId: email.id, rawEmailSubject: email.subject };
  }

  if (useAI && claudeParser) {
    const aiResult = await claudeParser(email.subject, email.snippet || email.body.slice(0, 500));
    if (aiResult.isTransaction) {
      return { ...aiResult, date: email.date || new Date(), source: 'email', emailId: email.id, rawEmailSubject: email.subject };
    }
  }

  return null;
};

module.exports = { parseEmail, ruleBasedParse, cleanMerchantName, getCategoryFromMerchant };
