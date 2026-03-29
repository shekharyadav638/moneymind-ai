const User = require('../models/User');
const Transaction = require('../models/Transaction');
const Investment = require('../models/Investment');
const { getAuthUrl, getTokensFromCode, fetchTransactionEmails } = require('../services/gmailService');
const { parseEmail } = require('../services/emailParser');
const { parseInvestmentEmail } = require('../services/investmentEmailParser');
const { parseTransactionEmail } = require('../services/claudeService');

// @desc    Get Gmail OAuth authorization URL
// @route   GET /email/auth-url
// @access  Private
const getGmailAuthUrl = (req, res) => {
  const authUrl = getAuthUrl(req.user.id);
  res.json({ success: true, authUrl });
};

// @desc    Handle Gmail OAuth callback
// @route   GET /email/callback
// @access  Public (called by Google redirect)
const handleGmailCallback = async (req, res, next) => {
  try {
    const { code, state } = req.query;
    // state should contain the userId (set when generating auth URL)
    if (!code || !state) {
      return res.status(400).json({ success: false, message: 'Missing code or state.' });
    }

    const tokens = await getTokensFromCode(code);

    // Save tokens to user
    await User.findByIdAndUpdate(state, {
      gmailConnected: true,
      gmailTokens: tokens,
    });

    // Redirect to app (deep link for mobile, falling back safely to profile)
    res.redirect(`moneymind://profile?success=true`);
  } catch (error) {
    next(error);
  }
};

// @desc    Sync emails and parse transactions
// @route   GET /email/sync
// @access  Private
const syncEmails = async (req, res, next) => {
  try {
    if (!req.user.gmailConnected || !req.user.gmailTokens) {
      return res.status(400).json({
        success: false,
        message: 'Gmail not connected. Please connect your Gmail first.',
      });
    }

    // Start sync in background to prevent Axios timeouts on large payloads
    (async () => {
      try {
        const emails = await fetchTransactionEmails(
          req.user.gmailTokens,
          500,
          req.user.lastEmailSync
        );

        let parsedTxns = 0, skippedTxns = 0;
        let parsedInv = 0, skippedInv = 0;

        for (const email of emails) {
          // 1. Try to parse as Transaction
          const existingTxn = await Transaction.findOne({ userId: req.user.id, emailId: email.id });
          if (!existingTxn) {
            const txn = await parseEmail(email, true, parseTransactionEmail);
            if (txn && txn.isTransaction) {
              try {
                await Transaction.create({ userId: req.user.id, ...txn });
                parsedTxns++;
              } catch (err) {}
            } else {
              skippedTxns++;
            }
          }

          // 2. Try to parse as Investment (Broker trade confirmation)
          const existingInv = await Investment.findOne({ userId: req.user.id, emailId: email.id });
          if (!existingInv) {
            const inv = parseInvestmentEmail(email);
            if (inv) {
              try {
                await Investment.create({ userId: req.user.id, ...inv });
                parsedInv++;
              } catch (err) {}
            } else {
              skippedInv++;
            }
          }
        }
        await User.findByIdAndUpdate(req.user.id, { lastEmailSync: new Date() });
        console.log(`Background sync complete: ${parsedTxns} Txns, ${parsedInv} Investments.`);
      } catch (err) {
        if (err.message?.includes('invalid_grant') || err.message?.includes('token')) {
          await User.findByIdAndUpdate(req.user.id, { gmailConnected: false, gmailTokens: null });
        }
        console.error('Background sync failed:', err);
      }
    })();

    res.status(202).json({
      success: true,
      message: 'Sync started in background. It may take a minute or two to process historical transactions. Please pull to refresh later.',
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Disconnect Gmail
// @route   DELETE /email/disconnect
// @access  Private
const disconnectGmail = async (req, res, next) => {
  try {
    await User.findByIdAndUpdate(req.user.id, {
      gmailConnected: false,
      gmailTokens: null,
      lastEmailSync: null,
    });
    res.json({ success: true, message: 'Gmail disconnected.' });
  } catch (error) {
    next(error);
  }
};

module.exports = { getGmailAuthUrl, handleGmailCallback, syncEmails, disconnectGmail };
