const mongoose = require('mongoose');

const CATEGORIES = ['Food', 'Rent', 'Travel', 'Shopping', 'Bills', 'Entertainment', 'Health', 'Education', 'Investment', 'Income', 'Others'];
const SOURCES = ['manual', 'email', 'auto'];
const TYPES = ['debit', 'credit'];
const PAYMENT_SOURCES = ['credit_card', 'hdfc_savings', 'upi', 'other'];

const transactionSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    amount: {
      type: Number,
      required: [true, 'Amount is required'],
      min: [0.01, 'Amount must be positive'],
    },
    type: {
      type: String,
      enum: TYPES,
      default: 'debit',
    },
    category: {
      type: String,
      enum: CATEGORIES,
      default: 'Others',
    },
    merchant: {
      type: String,
      trim: true,
      default: 'Unknown',
    },
    description: {
      type: String,
      trim: true,
    },
    date: {
      type: Date,
      required: true,
      default: Date.now,
      index: true,
    },
    source: {
      type: String,
      enum: SOURCES,
      default: 'manual',
    },
    // Email metadata (when parsed from email)
    emailId: {
      type: String,
      sparse: true,
    },
    rawEmailSubject: {
      type: String,
    },
    // Bank/card info
    bank: {
      type: String,
    },
    lastFourDigits: {
      type: String,
    },
    // Tags for flexible categorization
    tags: [String],
    isRecurring: {
      type: Boolean,
      default: false,
    },
    // Distinguishes bank transactions from credit card spends (for bank balance derivation)
    paymentSource: {
      type: String,
      enum: PAYMENT_SOURCES,
      default: 'other',
    },
  },
  { timestamps: true }
);

// Compound index for efficient user + date queries
transactionSchema.index({ userId: 1, date: -1 });
transactionSchema.index({ userId: 1, category: 1 });

// Static method: Get monthly summary
transactionSchema.statics.getMonthlySummary = async function (userId, year, month) {
  const start = new Date(year, month - 1, 1);
  const end = new Date(year, month, 0, 23, 59, 59);

  return await this.aggregate([
    {
      $match: {
        userId: new mongoose.Types.ObjectId(userId),
        date: { $gte: start, $lte: end },
      },
    },
    {
      $group: {
        _id: { type: '$type', category: '$category' },
        total: { $sum: '$amount' },
        count: { $sum: 1 },
      },
    },
  ]);
};

// Static method: Get spending by category
transactionSchema.statics.getSpendingByCategory = async function (userId, startDate, endDate) {
  return await this.aggregate([
    {
      $match: {
        userId: new mongoose.Types.ObjectId(userId),
        type: 'debit',
        date: { $gte: startDate, $lte: endDate },
      },
    },
    {
      $group: {
        _id: '$category',
        total: { $sum: '$amount' },
        count: { $sum: 1 },
      },
    },
    { $sort: { total: -1 } },
  ]);
};

module.exports = mongoose.model('Transaction', transactionSchema);
module.exports.CATEGORIES = CATEGORIES;
