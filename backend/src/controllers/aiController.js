const Transaction = require('../models/Transaction');
const Investment = require('../models/Investment');
const { buildFinancialContext, generateInsights, chatWithFinanceAI } = require('../services/claudeService');

// @desc    Generate AI financial insights
// @route   POST /ai/insights
// @access  Private
const getInsights = async (req, res, next) => {
  try {
    // Fetch user's financial data
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 60); // 2 months of data

    const [transactions, investments] = await Promise.all([
      Transaction.find({
        userId: req.user.id,
        date: { $gte: thirtyDaysAgo },
      }).sort('-date'),
      Investment.find({ userId: req.user.id, isActive: true }),
    ]);

    // Build structured context for Claude
    const context = buildFinancialContext(req.user, transactions, investments);

    // Generate insights via Claude
    const insights = await generateInsights(context);

    res.json({
      success: true,
      data: insights,
      generatedAt: new Date(),
    });
  } catch (error) {
    if (error.message?.includes('API')) {
      return res.status(503).json({ success: false, message: 'AI service temporarily unavailable.' });
    }
    next(error);
  }
};

// @desc    AI chat — answer financial questions
// @route   POST /ai/chat
// @access  Private
const chat = async (req, res, next) => {
  try {
    const { message, chatHistory = [] } = req.body;

    if (!message?.trim()) {
      return res.status(400).json({ success: false, message: 'Message is required.' });
    }

    // Fetch financial data for context
    const sixtyDaysAgo = new Date();
    sixtyDaysAgo.setDate(sixtyDaysAgo.getDate() - 60);

    const [transactions, investments] = await Promise.all([
      Transaction.find({
        userId: req.user.id,
        date: { $gte: sixtyDaysAgo },
      }).sort('-date').limit(100),
      Investment.find({ userId: req.user.id, isActive: true }),
    ]);

    const context = buildFinancialContext(req.user, transactions, investments);

    // Validate and sanitize chat history (limit to last 10 messages)
    const recentHistory = chatHistory.slice(-10).filter(
      (msg) => msg.role && msg.content && ['user', 'assistant'].includes(msg.role)
    );

    // Get AI response
    const response = await chatWithFinanceAI(message, context, recentHistory);

    res.json({
      success: true,
      data: {
        message: response,
        timestamp: new Date(),
      },
    });
  } catch (error) {
    if (error.message?.includes('API')) {
      return res.status(503).json({ success: false, message: 'AI service temporarily unavailable.' });
    }
    next(error);
  }
};

// @desc    Get AI net worth summary (with historical trend)
// @route   GET /ai/networth
// @access  Private
const getNetWorth = async (req, res, next) => {
  try {
    const investments = await Investment.find({ userId: req.user.id, isActive: true });
    const currentPortfolioValue = investments.reduce((s, i) => s + (i.currentValue || i.amountInvested), 0);

    const netWorth = (req.user.bankBalance || 0) + currentPortfolioValue - (req.user.liabilities || 0);

    res.json({
      success: true,
      data: {
        netWorth,
        breakdown: {
          bankBalance: req.user.bankBalance || 0,
          investments: currentPortfolioValue,
          liabilities: req.user.liabilities || 0,
        },
      },
    });
  } catch (error) {
    next(error);
  }
};

module.exports = { getInsights, chat, getNetWorth };
