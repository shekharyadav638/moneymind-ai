const axios = require('axios');
const User = require('../models/User');
const Transaction = require('../models/Transaction');
const Investment = require('../models/Investment');
const { getAuthUrl, getTokensFromCode, fetchTransactionEmails } = require('../services/gmailService');
const { parseEmail } = require('../services/emailParser');
const { parseInvestmentEmail } = require('../services/investmentEmailParser');
const { parseTransactionEmail } = require('../services/claudeService');
const { generateToken } = require('../middleware/auth');

// @desc    Get Gmail OAuth authorization URL
// @route   GET /email/auth-url
// @access  Private
const getGmailAuthUrl = (req, res) => {
  const state = JSON.stringify({ flow: 'sync', userId: req.user.id });
  const authUrl = getAuthUrl(state);
  res.json({ success: true, authUrl });
};

// @desc    Handle Gmail OAuth callback (shared by auth sign-in and email sync flows)
// @route   GET /email/callback
// @access  Public (called by Google redirect)
const handleGmailCallback = async (req, res, next) => {
  try {
    const { code, state } = req.query;
    if (!code || !state) {
      return res.status(400).json({ success: false, message: 'Missing code or state.' });
    }

    // State may be plain userId (legacy sync flow) or JSON { flow, userId? }
    let parsedState = null;
    try {
      parsedState = JSON.parse(state);
    } catch {
      // Legacy: raw userId string from the old sync flow
      parsedState = { flow: 'sync', userId: state };
    }

    const tokens = await getTokensFromCode(code);

    if (parsedState.flow === 'auth') {
      // ── Google Sign-In / Sign-Up flow ──────────────────────────────────────
      // Fetch user's Google profile using the access token
      const profileRes = await axios.get('https://www.googleapis.com/oauth2/v2/userinfo', {
        headers: { Authorization: `Bearer ${tokens.access_token}` },
      });
      const { email, name } = profileRes.data;

      // Find existing user or create a new one
      let user = await User.findOne({ email });
      if (user) {
        // Update tokens and mark gmail connected even if already registered
        user.gmailConnected = true;
        user.gmailTokens = tokens;
        await user.save();
      } else {
        user = await User.create({
          name: name || email.split('@')[0],
          email,
          authProvider: 'google',
          gmailConnected: true,
          gmailTokens: tokens,
        });
      }

      const token = generateToken(user._id);
      const userPayload = encodeURIComponent(JSON.stringify({
        id: user._id,
        name: user.name,
        email: user.email,
        monthlyIncome: user.monthlyIncome,
        bankBalance: user.bankBalance,
        liabilities: user.liabilities,
        currency: user.currency,
        gmailConnected: user.gmailConnected,
      }));

      const deepLink = `moneymind:///callback?token=${token}&user=${userPayload}`;
      return res.send(`<!DOCTYPE html>
<html>
<head><meta charset="utf-8"><title>Signing you in...</title></head>
<body style="background:#0A0A1A;color:#fff;font-family:sans-serif;display:flex;align-items:center;justify-content:center;height:100vh;margin:0;flex-direction:column;gap:16px;">
  <p style="font-size:18px;">Signing you in to MoneyMind AI...</p>
  <a id="deeplink" href="${deepLink}" style="display:none;">open</a>
  <script>
    document.getElementById('deeplink').click();
  </script>
</body>
</html>`);
    }

    // ── Email sync flow (existing behaviour) ────────────────────────────────
    const userId = parsedState.userId;
    await User.findByIdAndUpdate(userId, {
      gmailConnected: true,
      gmailTokens: tokens,
    });

    const syncDeepLink = `moneymind:///profile?success=true`;
    return res.send(`<!DOCTYPE html>
<html>
<head><meta charset="utf-8"><title>Gmail Connected</title></head>
<body style="background:#0A0A1A;color:#fff;font-family:sans-serif;display:flex;align-items:center;justify-content:center;height:100vh;margin:0;flex-direction:column;gap:16px;">
  <p style="font-size:18px;">Gmail connected! Returning to app...</p>
  <p style="font-size:13px;color:#888;">If the app doesn't open, <a href="${syncDeepLink}" style="color:#6C63FF;">tap here</a>.</p>
  <script>window.location.href = "${syncDeepLink}";</script>
</body>
</html>`);
  } catch (error) {
    next(error);
  }
};

/**
 * Find-or-merge investment from an email parse result.
 *
 * Rules:
 *  - SIP:         find existing SIP with same name → accumulate amountInvested + units
 *  - Stock/MF:    find existing holding with same name + type → accumulate units & amount,
 *                 recalculate weighted-average buy price
 *  - Sell:        subtract units & amount from existing (don't go below 0)
 *  - Not found:   create new
 *
 * The emailId on the EXISTING record is NOT overwritten — we track the
 * first email that created it. The new emailId is stored on the transaction
 * dedup check above, so the email won't be re-processed.
 */
const upsertInvestment = async (userId, inv) => {
  // Normalise name for matching (lowercase, trim extra spaces)
  const normalizedName = inv.name?.trim().toLowerCase();

  // Find an existing active investment with the same name and type
  const existing = await Investment.findOne({
    userId,
    isActive: { $ne: false },
    $expr: {
      $eq: [{ $toLower: { $trim: { input: '$name' } } }, normalizedName],
    },
    type: inv.type,
  });

  if (!existing) {
    return Investment.create({ userId, ...inv });
  }

  if (inv.isSell) {
    // Reduce position on sell
    existing.units = Math.max(0, (existing.units || 0) - (inv.units || 0));
    existing.amountInvested = Math.max(0, (existing.amountInvested || 0) - (inv.amountInvested || 0));
  } else {
    // Accumulate: weighted-average buy price for stocks/MFs
    const prevUnits = existing.units || 0;
    const newUnits = inv.units || 0;
    const totalUnits = prevUnits + newUnits;

    if (totalUnits > 0 && inv.buyPrice) {
      existing.buyPrice = (
        (prevUnits * (existing.buyPrice || 0) + newUnits * inv.buyPrice) / totalUnits
      );
    }

    existing.units = totalUnits;
    existing.amountInvested = (existing.amountInvested || 0) + (inv.amountInvested || 0);
  }

  // Always update current price if we got a fresher one
  if (inv.currentPrice) existing.currentPrice = inv.currentPrice;

  return existing.save();
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
          // Skip if this exact email was already processed
          const alreadyProcessed = await Investment.findOne({ userId: req.user.id, emailId: email.id });
          if (!alreadyProcessed) {
            const inv = parseInvestmentEmail(email);
            if (inv) {
              try {
                await upsertInvestment(req.user.id, inv);
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
