const { google } = require('googleapis');

/**
 * Create an OAuth2 client
 */
const createOAuth2Client = () => {
  return new google.auth.OAuth2(
    process.env.GOOGLE_CLIENT_ID,
    process.env.GOOGLE_CLIENT_SECRET,
    process.env.GOOGLE_REDIRECT_URI
  );
};

/**
 * Generate the Gmail OAuth authorization URL
 */
const getAuthUrl = (state) => {
  const oauth2Client = createOAuth2Client();
  return oauth2Client.generateAuthUrl({
    access_type: 'offline',
    scope: [
      'https://www.googleapis.com/auth/gmail.readonly',
      'https://www.googleapis.com/auth/userinfo.email',
    ],
    prompt: 'consent',
    state,
  });
};

/**
 * Exchange authorization code for tokens
 */
const getTokensFromCode = async (code) => {
  const oauth2Client = createOAuth2Client();
  const { tokens } = await oauth2Client.getToken(code);
  return tokens;
};

/**
 * Create an authenticated Gmail client from stored tokens
 */
const getGmailClient = (tokens) => {
  const oauth2Client = createOAuth2Client();
  oauth2Client.setCredentials(tokens);
  return google.gmail({ version: 'v1', auth: oauth2Client });
};

/**
 * Fetch transaction-related emails from Gmail
 * Searches for emails from banks and payment platforms
 */
const fetchTransactionEmails = async (tokens, maxResults = 50, afterDate = null) => {
  const gmail = getGmailClient(tokens);

  // Filter by known bank / payment-service senders so we don't scan unrelated emails.
  // Gmail supports partial-domain matching inside from:()
  const BANK_SENDER_TERMS = [
    // Indian banks
    'hdfcbank', 'sbi', 'onlinesbi', 'icicibank', 'axisbank', 'kotakbank',
    'bankofbaroda', 'bob', 'pnb', 'punjabnational', 'canarabank',
    'idfcfirstbank', 'indusind', 'yesbank', 'federalbank', 'rblbank',
    'unionbankofindia', 'bankofindia', 'centralbankofindia',
    // UPI / payment platforms
    'paytm', 'phonepe', 'gpay', 'googlepay', 'amazonpay', 'razorpay', 'bhim',
    // Common alert sender keywords used by banks
    'alerts', 'notify', 'noreply', 'donotreply',
  ];

  const fromQuery = `from:(${BANK_SENDER_TERMS.join(' OR ')})`;
  let query = `${fromQuery} (debit OR credit OR debited OR credited OR paid OR payment OR transaction OR spent OR UPI) `;
  if (afterDate) {
    // Use Unix timestamp (seconds) for second-level precision — avoids re-fetching
    // emails from earlier in the same day on incremental syncs
    const unixSeconds = Math.floor(new Date(afterDate).getTime() / 1000);
    query += `after:${unixSeconds}`;
  } else {
    // Default: first day of the current month
    const d = new Date();
    query += `after:${d.getFullYear()}/${d.getMonth() + 1}/01`;
  }

  try {
    // Paginate through ALL matching emails (Gmail returns max 500 per page)
    let allMessages = [];
    let pageToken = undefined;
    do {
      const listResponse = await gmail.users.messages.list({
        userId: 'me',
        q: query,
        maxResults: 500,
        pageToken,
      });
      const msgs = listResponse.data.messages || [];
      allMessages.push(...msgs);
      pageToken = listResponse.data.nextPageToken;
    } while (pageToken);

    const messages = allMessages;
    const emails = [];

    // Fetch each email's details (in batches to avoid rate limits)
    const batchSize = 10;
    for (let i = 0; i < messages.length; i += batchSize) {
      const batch = messages.slice(i, i + batchSize);
      const batchResults = await Promise.all(
        batch.map(async (msg) => {
          try {
            const detail = await gmail.users.messages.get({
              userId: 'me',
              id: msg.id,
              format: 'full',
            });
            return parseEmailPayload(detail.data);
          } catch {
            return null;
          }
        })
      );
      emails.push(...batchResults.filter(Boolean));
    }

    return emails;
  } catch (error) {
    throw new Error(`Gmail fetch failed: ${error.message}`);
  }
};

/**
 * Parse Gmail message payload into a usable object
 */
const parseEmailPayload = (message) => {
  const headers = message.payload.headers || [];
  const subject = headers.find((h) => h.name === 'Subject')?.value || '';
  const from = headers.find((h) => h.name === 'From')?.value || '';
  const date = headers.find((h) => h.name === 'Date')?.value || '';

  // Get email body (handles multipart)
  let body = '';
  const extractBody = (payload) => {
    if (payload.body?.data) {
      body += Buffer.from(payload.body.data, 'base64').toString('utf-8');
    }
    if (payload.parts) {
      payload.parts.forEach((part) => {
        if (part.mimeType === 'text/plain' || part.mimeType === 'text/html') {
          extractBody(part);
        }
      });
    }
  };
  extractBody(message.payload);

  // Strip HTML tags if present
  body = body.replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim();

  return {
    id: message.id,
    subject,
    from,
    date: new Date(date),
    body: body.slice(0, 2000), // Limit body size
    snippet: message.snippet || '',
  };
};

module.exports = {
  getAuthUrl,
  getTokensFromCode,
  fetchTransactionEmails,
};
