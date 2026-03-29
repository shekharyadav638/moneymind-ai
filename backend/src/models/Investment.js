const mongoose = require('mongoose');

const INVESTMENT_TYPES = ['stock', 'mutual_fund', 'sip', 'fd', 'ppf', 'gold', 'real_estate', 'crypto', 'other'];
const ASSET_CLASSES = ['equity', 'debt', 'hybrid', 'commodity', 'real_estate', 'alternative', 'cash'];

const investmentSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    name: {
      type: String,
      required: [true, 'Investment name is required'],
      trim: true,
    },
    type: {
      type: String,
      enum: INVESTMENT_TYPES,
      required: true,
    },
    assetClass: {
      type: String,
      enum: ASSET_CLASSES,
      default: 'equity',
    },
    // Purchase details
    amountInvested: {
      type: Number,
      required: [true, 'Amount invested is required'],
      min: 0,
    },
    units: {
      type: Number,
      default: 0,
    },
    buyPrice: {
      type: Number,
      default: 0,
    },
    // Current value
    currentPrice: {
      type: Number,
      default: 0,
    },
    currentValue: {
      type: Number,
      default: 0,
    },
    // For SIPs
    sipAmount: {
      type: Number,
    },
    sipFrequency: {
      type: String,
      enum: ['monthly', 'weekly', 'quarterly'],
    },
    sipStartDate: {
      type: Date,
    },
    sipDeductionDay: {
      type: Number,
      min: 1,
      max: 28,
    },
    // Email ID for deduplication when auto-imported from broker emails
    emailId: {
      type: String,
      sparse: true,
    },
    // Performance
    returns: {
      type: Number,
      default: 0, // Percentage return
    },
    absoluteReturn: {
      type: Number,
      default: 0, // Rupee return
    },
    // Metadata
    ticker: {
      type: String,
    },
    exchange: {
      type: String,
    },
    purchaseDate: {
      type: Date,
      default: Date.now,
    },
    notes: {
      type: String,
    },
    isActive: {
      type: Boolean,
      default: true,
    },
  },
  { timestamps: true }
);

// Virtual: Calculate current value and returns before saving
investmentSchema.pre('save', function (next) {
  if (this.units && this.currentPrice) {
    this.currentValue = this.units * this.currentPrice;
  } else {
    this.currentValue = this.amountInvested;
  }
  this.absoluteReturn = this.currentValue - this.amountInvested;
  if (this.amountInvested > 0) {
    this.returns = ((this.absoluteReturn / this.amountInvested) * 100).toFixed(2);
  }
  next();
});

// Static: Get portfolio summary
investmentSchema.statics.getPortfolioSummary = async function (userId) {
  return await this.aggregate([
    {
      $match: {
        userId: new mongoose.Types.ObjectId(userId),
        isActive: true,
      },
    },
    {
      $group: {
        _id: '$assetClass',
        totalInvested: { $sum: '$amountInvested' },
        currentValue: { $sum: '$currentValue' },
        count: { $sum: 1 },
      },
    },
  ]);
};

module.exports = mongoose.model('Investment', investmentSchema);
