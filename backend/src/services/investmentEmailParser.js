/**
 * Investment Email Parser
 * Detects broker trade confirmation emails from Zerodha, Groww, Paytm Money, Angel One etc.
 * and extracts investment details to auto-create portfolio entries.
 */

const BROKER_PATTERNS = [
  // Zerodha — "Contract Note" style (NSE/BSE trade confirmations)
  {
    broker: 'zerodha',
    senderPattern: /zerodha/i,
    subjectPattern: /contract note|trade confirmation|order executed/i,
    extractors: {
      symbol: [/symbol[:\s]+([A-Z]+(?:-[A-Z]+)*)/i, /scrip[:\s]+([A-Z0-9]+)/i],
      units: [/qty[:\s]+([\d,]+)/i, /quantity[:\s]+([\d,]+)/i],
      price: [/price[:\s]+[\d,]+\.?\d*|avg[.\s]?price[:\s]+([\d,]+\.?\d*)/i, /rate[:\s]+([\d,]+\.?\d*)/i],
      type: [/(buy|sell)/i],
    },
  },
  // Groww — Mutual fund purchase confirmations
  {
    broker: 'groww',
    senderPattern: /groww/i,
    subjectPattern: /order confirmed|purchase confirmed|investment confirmed|units allotted/i,
    extractors: {
      symbol: [/fund[:\s]+([A-Za-z0-9\s\-&]+?)(?:\s+plan|\s*\n)/i, /scheme[:\s]+([A-Za-z0-9\s\-&]+?)(?:\s*\n|,)/i],
      units: [/units[:\s]+([\d,]+\.?\d*)/i, /units allotted[:\s]+([\d,]+\.?\d*)/i],
      price: [/nav[:\s]+(?:Rs\.?|₹)?\s*([\d,]+\.?\d*)/i, /price[:\s]+(?:Rs\.?|₹)?\s*([\d,]+\.?\d*)/i],
      amount: [/amount[:\s]+(?:Rs\.?|₹)?\s*([\d,]+\.?\d*)/i, /invested[:\s]+(?:Rs\.?|₹)?\s*([\d,]+\.?\d*)/i],
    },
  },
  // Paytm Money
  {
    broker: 'paytm_money',
    senderPattern: /paytmmoney|paytm money/i,
    subjectPattern: /investment confirmed|order placed|purchase successful|sip|units allotted/i,
    extractors: {
      symbol: [/scheme[:\s]+([A-Za-z0-9\s\-&]+?)(?:\n|,)/i, /fund[:\s]+([A-Za-z0-9\s\-&]+?)(?:\n|,)/i],
      units: [/units[:\s]+([\d,]+\.?\d*)/i],
      price: [/nav[:\s]+(?:Rs\.?|₹)?\s*([\d,]+\.?\d*)/i],
      amount: [/amount[:\s]+(?:Rs\.?|₹)?\s*([\d,]+\.?\d*)/i, /₹\s*([\d,]+\.?\d*)/i],
    },
  },
  // Angel One (stocks)
  {
    broker: 'angel',
    senderPattern: /angelone|angel one|angel broking/i,
    subjectPattern: /trade confirmation|order executed|contract note/i,
    extractors: {
      symbol: [/symbol[:\s]+([A-Z0-9\-]+)/i],
      units: [/qty[:\s]+([\d,]+)/i, /quantity[:\s]+([\d,]+)/i],
      price: [/price[:\s]+([\d,]+\.?\d*)/i],
      type: [/(buy|sell)/i],
    },
  },
];

const tryExtract = (patterns, text) => {
  for (const p of patterns) {
    const match = text.match(p);
    if (match) return match[1]?.trim();
  }
  return null;
};

/**
 * Parse a broker email to extract investment details.
 * @param {Object} email - { id, subject, from, snippet, body }
 * @returns {Object|null} - Investment details or null
 */
const parseInvestmentEmail = (email) => {
  const fullText = `${email.subject} ${email.snippet} ${email.body}`;

  for (const broker of BROKER_PATTERNS) {
    // Check sender + subject match
    const matchesSender = broker.senderPattern.test(email.from) || broker.senderPattern.test(fullText);
    const matchesSubject = broker.subjectPattern.test(email.subject) || broker.subjectPattern.test(fullText);
    if (!matchesSender || !matchesSubject) continue;

    const e = broker.extractors;
    const symbol = tryExtract(e.symbol || [], fullText);
    const unitsRaw = tryExtract(e.units || [], fullText);
    const priceRaw = tryExtract(e.price || [], fullText);
    const amountRaw = tryExtract(e.amount || [], fullText);
    const tradeType = tryExtract(e.type || [], fullText)?.toLowerCase();

    const units = unitsRaw ? parseFloat(unitsRaw.replace(/,/g, '')) : null;
    const price = priceRaw ? parseFloat(priceRaw.replace(/,/g, '')) : null;
    const amount = amountRaw ? parseFloat(amountRaw.replace(/,/g, '')) : null;

    const amountInvested = amount || (units && price ? units * price : null);
    if (!symbol || !amountInvested) continue;

    // Determine if stock or MF
    const isMF = /fund|nav|scheme|sip|growth|direct/i.test(fullText);
    const isSell = tradeType === 'sell';

    return {
      name: symbol,
      type: isMF ? (email.subject?.toLowerCase().includes('sip') ? 'sip' : 'mutual_fund') : 'stock',
      assetClass: isMF ? 'debt' : 'equity',
      amountInvested: isSell ? 0 : amountInvested,
      units: units || 0,
      buyPrice: price || 0,
      currentPrice: price || 0,
      currentValue: amountInvested,
      broker: broker.broker,
      isSell,
      emailId: email.id,
      purchaseDate: email.date,
    };
  }

  return null;
};

module.exports = { parseInvestmentEmail };
