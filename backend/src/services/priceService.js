/**
 * Price Service
 * Fetches live stock prices from Yahoo Finance (free, no API key)
 * Fetches MF NAVs from MFAPI.in (free, no API key)
 */

const https = require('https');

/**
 * Simple HTTP GET helper
 */
const httpGet = (url) =>
  new Promise((resolve, reject) => {
    https.get(url, { headers: { 'User-Agent': 'MoneyMind/1.0' } }, (res) => {
      let data = '';
      res.on('data', (chunk) => (data += chunk));
      res.on('end', () => {
        try {
          resolve(JSON.parse(data));
        } catch {
          resolve(null);
        }
      });
    }).on('error', reject);
  });

/**
 * Fetch stock price from Yahoo Finance (free, no key)
 * Ticker format for NSE: "RELIANCE.NS", BSE: "RELIANCE.BO"
 * @param {string} ticker - e.g. "RELIANCE.NS"
 * @returns {number|null} Current price
 */
const fetchStockPrice = async (ticker) => {
  try {
    const url = `https://query1.finance.yahoo.com/v8/finance/chart/${encodeURIComponent(ticker)}?interval=1d&range=1d`;
    const data = await httpGet(url);
    const price = data?.chart?.result?.[0]?.meta?.regularMarketPrice;
    return price ? Math.round(price * 100) / 100 : null;
  } catch {
    return null;
  }
};

/**
 * Search for a stock ticker by company name on Yahoo Finance
 * @param {string} companyName
 * @param {string} preferredExchange - 'NSE' or 'BSE'
 * @returns {string|null} Official Yahoo Finance symbol
 */
const findStockTicker = async (companyName, preferredExchange = 'NSE') => {
  try {
    const url = `https://query2.finance.yahoo.com/v1/finance/search?q=${encodeURIComponent(companyName.substring(0, 30))}`;
    const searchData = await httpGet(url);
    if (!searchData?.quotes || searchData.quotes.length === 0) return null;

    // Prioritize exact symbol matches over Yahoo's arbitrary scoring tie-breakers
    const safeQuery = companyName.substring(0, 15).toUpperCase().replace(/\s+/g, '');
    searchData.quotes.sort((a, b) => {
      const aExact = a.symbol.split('.')[0].toUpperCase() === safeQuery;
      const bExact = b.symbol.split('.')[0].toUpperCase() === safeQuery;
      if (aExact && !bExact) return -1;
      if (!aExact && bExact) return 1;
      return 0;
    });

    // Try to match preferred exchange (NSI = NSE for Yahoo)
    const exCode = preferredExchange === 'BSE' ? 'BSE' : 'NSI';
    const match = searchData.quotes.find(q => q.exchange === exCode);
    
    // Fallback to first Indian exchange result, then just first result overall
    if (match) return match.symbol;
    const anyIndian = searchData.quotes.find(q => q.exchange === 'NSI' || q.exchange === 'BSE');
    return anyIndian ? anyIndian.symbol : searchData.quotes[0].symbol;
  } catch {
    return null;
  }
};

/**
 * Search for a mutual fund scheme code by name on MFAPI.in
 * @param {string} schemeName
 * @returns {string|null} scheme code
 */
const findMFSchemeCode = async (schemeName) => {
  try {
    // Strip common filler words and use core brand keywords
    const fillerWords = new Set(['direct', 'regular', 'growth', 'plan', 'option', 'fund', 'scheme', 'dividend', 'idcw', 'reinvestment', 'payout']);
    const words = schemeName
      .split(/[\s\-]+/)
      .filter(w => w.length > 2 && !fillerWords.has(w.toLowerCase()));
    const query = encodeURIComponent(words.slice(0, 3).join(' '));
    console.log(`🔍 MF search query: "${decodeURIComponent(query)}" from "${schemeName}"`);
    
    const data = await httpGet(`https://api.mfapi.in/mf/search?q=${query}`);
    if (!data || data.length === 0) {
      console.log(`❌ No MF results for: ${schemeName}`);
      return null;
    }
    
    // Prefer Direct Plan + Growth
    const directGrowth = data.find(s =>
      s.schemeName.toLowerCase().includes('direct') &&
      (s.schemeName.toLowerCase().includes('growth') || s.schemeName.toLowerCase().includes('idcw') === false)
    );
    const chosen = directGrowth || data[0];
    console.log(`✅ Matched MF: "${chosen.schemeName}" (code: ${chosen.schemeCode})`);
    return chosen.schemeCode.toString();
  } catch (err) {
    console.error(`MF search error for ${schemeName}:`, err.message);
    return null;
  }
};

/**
 * Fetch current NAV for a mutual fund by scheme name
 * @param {string} schemeName
 * @returns {{ nav: number, date: string }|null}
 */
const fetchMFNav = async (schemeName) => {
  try {
    const schemeCode = await findMFSchemeCode(schemeName);
    if (!schemeCode) return null;
    const data = await httpGet(`https://api.mfapi.in/mf/${schemeCode}/latest`);
    const nav = parseFloat(data?.data?.[0]?.nav);
    return nav && !isNaN(nav) ? { nav, date: data?.data?.[0]?.date, schemeCode } : null;
  } catch {
    return null;
  }
};

/**
 * Fetch price for any investment (stock or MF)
 * @param {Object} investment - Mongoose Investment doc
 * @returns {number|null} current price
 */
const fetchInvestmentPrice = async (investment) => {
  console.log("🚀 ~ fetchInvestmentPrice ~ investment:", investment.name);
  if (investment.type === 'stock') {
    let ticker = investment.ticker;

    // If ticker missing, use Yahoo Search API to find it automatically using the name
    if (!ticker) {
      ticker = await findStockTicker(investment.name, investment.exchange);
      if (ticker) {
        // Save it back to db reference so we don't have to search again next time
        investment.ticker = ticker; 
        console.log(`🔍 Discovered ticker for ${investment.name}: ${ticker}`);
      } else {
        // Absolute fallback: blindly append exchange suffix
        const baseTicker = investment.name.substring(0, 15).toUpperCase().replace(/\s+/g, '');
        const suffix = investment.exchange === 'BSE' ? '.BO' : '.NS';
        ticker = baseTicker.includes('.') ? baseTicker : `${baseTicker}${suffix}`;
      }
    }

    const price = await fetchStockPrice(ticker);
    console.log("🚀 ~ fetchInvestmentPrice ~ price:", price);
    
    if (price) return price;

    // Final Fallback: Test alternative Indian exchange extension
    const altTicker = ticker.endsWith('.NS') ? ticker.replace('.NS', '.BO') : (ticker.endsWith('.BO') ? ticker.replace('.BO', '.NS') : ticker);
    if (altTicker !== ticker) {
       return await fetchStockPrice(altTicker);
    }
    return null;
  }

  if (investment.type === 'mutual_fund' || investment.type === 'sip') {
    const result = await fetchMFNav(investment.name);
    return result?.nav || null;
  }

  return null;
};

module.exports = { fetchStockPrice, fetchMFNav, fetchInvestmentPrice };
