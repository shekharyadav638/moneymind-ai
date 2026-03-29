const Transaction = require('../models/Transaction');
const User = require('../models/User');

// @desc    Get all transactions for user (with filters, pagination)
// @route   GET /transactions
// @access  Private
const getTransactions = async (req, res, next) => {
  try {
    const {
      page = 1,
      limit = 20,
      category,
      type,
      startDate,
      endDate,
      search,
      sort = '-date',
    } = req.query;

    // Build filter
    const filter = { userId: req.user.id };
    if (category) filter.category = category;
    if (type) filter.type = type;
    if (startDate || endDate) {
      filter.date = {};
      if (startDate) filter.date.$gte = new Date(startDate);
      if (endDate) filter.date.$lte = new Date(endDate);
    }
    if (search) {
      filter.$or = [
        { merchant: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } },
      ];
    }

    const skip = (parseInt(page) - 1) * parseInt(limit);
    const [transactions, total] = await Promise.all([
      Transaction.find(filter).sort(sort).skip(skip).limit(parseInt(limit)),
      Transaction.countDocuments(filter),
    ]);

    res.json({
      success: true,
      data: transactions,
      pagination: {
        total,
        page: parseInt(page),
        pages: Math.ceil(total / parseInt(limit)),
        limit: parseInt(limit),
      },
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Add a new transaction
// @route   POST /transactions
// @access  Private
const addTransaction = async (req, res, next) => {
  try {
    const { amount, type, category, merchant, description, date, tags, isRecurring } = req.body;

    const transaction = await Transaction.create({
      userId: req.user.id,
      amount,
      type: type || 'debit',
      category: category || 'Others',
      merchant: merchant || 'Unknown',
      description,
      date: date ? new Date(date) : new Date(),
      source: 'manual',
      tags,
      isRecurring,
    });

    res.status(201).json({ success: true, data: transaction });
  } catch (error) {
    next(error);
  }
};

// @desc    Update a transaction
// @route   PUT /transactions/:id
// @access  Private
const updateTransaction = async (req, res, next) => {
  try {
    const transaction = await Transaction.findOne({ _id: req.params.id, userId: req.user.id });
    if (!transaction) {
      return res.status(404).json({ success: false, message: 'Transaction not found.' });
    }

    const allowed = ['amount', 'category', 'merchant', 'description', 'date', 'type', 'tags'];
    allowed.forEach((field) => {
      if (req.body[field] !== undefined) transaction[field] = req.body[field];
    });

    await transaction.save();
    res.json({ success: true, data: transaction });
  } catch (error) {
    next(error);
  }
};

// @desc    Delete a transaction
// @route   DELETE /transactions/:id
// @access  Private
const deleteTransaction = async (req, res, next) => {
  try {
    const transaction = await Transaction.findOneAndDelete({ _id: req.params.id, userId: req.user.id });
    if (!transaction) {
      return res.status(404).json({ success: false, message: 'Transaction not found.' });
    }
    res.json({ success: true, message: 'Transaction deleted.' });
  } catch (error) {
    next(error);
  }
};

// @desc    Get financial summary (dashboard data)
// @route   GET /transactions/summary
// @access  Private
const getSummary = async (req, res, next) => {
  try {
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const startOfLastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    const endOfLastMonth = new Date(now.getFullYear(), now.getMonth(), 0, 23, 59, 59);

    const [
      thisMonthByCategory,
      lastMonthTotals,
      recentTransactions,
      monthlySeries,
    ] = await Promise.all([
      // This month's spending by category
      Transaction.getSpendingByCategory(req.user.id, startOfMonth, now),

      // Last month totals
      Transaction.aggregate([
        {
          $match: {
            userId: req.user._id,
            date: { $gte: startOfLastMonth, $lte: endOfLastMonth },
          },
        },
        {
          $group: {
            _id: '$type',
            total: { $sum: '$amount' },
          },
        },
      ]),

      // Recent 10 transactions
      Transaction.find({ userId: req.user.id })
        .sort('-date')
        .limit(10),

      // Last 6 months spending for chart
      Transaction.aggregate([
        {
          $match: {
            userId: req.user._id,
            type: 'debit',
            date: { $gte: new Date(now.getFullYear(), now.getMonth() - 5, 1) },
          },
        },
        {
          $group: {
            _id: {
              year: { $year: '$date' },
              month: { $month: '$date' },
            },
            total: { $sum: '$amount' },
          },
        },
        { $sort: { '_id.year': 1, '_id.month': 1 } },
      ]),
    ]);

    // Calculate this month totals
    const thisMonthSpend = thisMonthByCategory.reduce((sum, c) => sum + c.total, 0);
    const thisMonthIncome = await Transaction.aggregate([
      {
        $match: {
          userId: req.user._id,
          type: 'credit',
          date: { $gte: startOfMonth },
        },
      },
      { $group: { _id: null, total: { $sum: '$amount' } } },
    ]);

    const income = thisMonthIncome[0]?.total || req.user.monthlyIncome || 0;
    const savingsRate = income > 0 ? Math.round(((income - thisMonthSpend) / income) * 100) : 0;

    res.json({
      success: true,
      data: {
        thisMonth: {
          spending: thisMonthSpend,
          income,
          savingsRate,
          categoryBreakdown: thisMonthByCategory,
        },
        lastMonth: {
          spending: lastMonthTotals.find((t) => t._id === 'debit')?.total || 0,
          income: lastMonthTotals.find((t) => t._id === 'credit')?.total || 0,
        },
        recentTransactions,
        monthlySeries,
      },
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get derived bank balance (manual base + UPI/savings transactions only)
// @route   GET /transactions/balance
// @access  Private
const getDerivedBalance = async (req, res, next) => {
  try {
    const user = req.user;
    const baseBalance = user.bankBalance || 0;
    const since = user.bankBalanceLastSet || new Date(0);

    // Only count non-credit-card transactions since the balance was last manually set
    const txns = await Transaction.find({
      userId: user.id,
      date: { $gte: since },
      paymentSource: { $ne: 'credit_card' },
    });

    const delta = txns.reduce((acc, t) => {
      return t.type === 'credit' ? acc + t.amount : acc - t.amount;
    }, 0);

    res.json({
      success: true,
      data: {
        baseBalance,
        baseSetOn: since,
        delta: Math.round(delta * 100) / 100,
        currentBalance: Math.round((baseBalance + delta) * 100) / 100,
      },
    });
  } catch (error) {
    next(error);
  }
};

module.exports = { getTransactions, addTransaction, updateTransaction, deleteTransaction, getSummary, getDerivedBalance };
