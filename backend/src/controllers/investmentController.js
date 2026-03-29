const Investment = require('../models/Investment');
const { fetchInvestmentPrice } = require('../services/priceService');

// @desc    Get all investments + portfolio summary
// @route   GET /investments
// @access  Private
const getInvestments = async (req, res, next) => {
  try {
    const [investments, portfolioSummary, portfolioByType] = await Promise.all([
      Investment.find({ userId: req.user.id, isActive: true }).sort('-createdAt'),
      Investment.getPortfolioSummary(req.user.id),
      Investment.aggregate([
        { $match: { userId: req.user._id || require('mongoose').Types.ObjectId(req.user.id), isActive: true } },
        { $group: { _id: '$type', totalInvested: { $sum: '$amountInvested' }, currentValue: { $sum: '$currentValue' }, count: { $sum: 1 } } },
      ]),
    ]);

    const totalInvested = investments.reduce((s, i) => s + i.amountInvested, 0);
    const currentValue = investments.reduce((s, i) => s + (i.currentValue || i.amountInvested), 0);
    const totalReturns = currentValue - totalInvested;
    const returnsPercent = totalInvested > 0 ? ((totalReturns / totalInvested) * 100).toFixed(2) : 0;

    res.json({
      success: true,
      data: {
        investments,
        summary: {
          totalInvested,
          currentValue,
          totalReturns,
          returnsPercent: parseFloat(returnsPercent),
          portfolioByAssetClass: portfolioSummary,
          portfolioByType,
        },
      },
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Add a new investment
// @route   POST /investments
// @access  Private
const addInvestment = async (req, res, next) => {
  try {
    const {
      name, type, assetClass, amountInvested, units, buyPrice,
      currentPrice, sipAmount, sipFrequency, sipStartDate,
      ticker, exchange, purchaseDate, notes,
    } = req.body;

    const investment = await Investment.create({
      userId: req.user.id,
      name,
      type,
      assetClass: assetClass || 'equity',
      amountInvested,
      units: units || 0,
      buyPrice: buyPrice || 0,
      currentPrice: currentPrice || buyPrice || 0,
      sipAmount,
      sipFrequency,
      sipStartDate,
      ticker,
      exchange,
      purchaseDate: purchaseDate ? new Date(purchaseDate) : new Date(),
      notes,
    });

    res.status(201).json({ success: true, data: investment });
  } catch (error) {
    next(error);
  }
};

// @desc    Update an investment (e.g., current price)
// @route   PUT /investments/:id
// @access  Private
const updateInvestment = async (req, res, next) => {
  try {
    const investment = await Investment.findOne({ _id: req.params.id, userId: req.user.id });
    if (!investment) {
      return res.status(404).json({ success: false, message: 'Investment not found.' });
    }

    const allowed = ['name', 'currentPrice', 'amountInvested', 'units', 'notes', 'isActive'];
    allowed.forEach((field) => {
      if (req.body[field] !== undefined) investment[field] = req.body[field];
    });

    // Recalculate derived value fields natively if units or price was edited
    if (investment.units > 0 && investment.currentPrice) {
      investment.currentValue = investment.units * investment.currentPrice;
      investment.absoluteReturn = investment.currentValue - investment.amountInvested;
      if (investment.amountInvested > 0) {
        investment.returns = ((investment.absoluteReturn / investment.amountInvested) * 100).toFixed(2);
      }
    }
    await investment.save();
    res.json({ success: true, data: investment });
  } catch (error) {
    next(error);
  }
};

// @desc    Delete an investment
// @route   DELETE /investments/:id
// @access  Private
const deleteInvestment = async (req, res, next) => {
  try {
    const investment = await Investment.findOneAndDelete({ _id: req.params.id, userId: req.user.id });
    if (!investment) {
      return res.status(404).json({ success: false, message: 'Investment not found.' });
    }
    res.json({ success: true, message: 'Investment removed.' });
  } catch (error) {
    next(error);
  }
};

// @desc    Refresh live prices for all active investments
// @route   POST /investments/refresh-prices
// @access  Private
const refreshPrices = async (req, res, next) => {
  try {
    const investments = await Investment.find({
      userId: req.user.id,
      type: { $in: ['stock', 'mutual_fund', 'sip'] },
      isActive: true,
    });

    let updatedCount = 0;
    for (const inv of investments) {
      const currentPrice = await fetchInvestmentPrice(inv);
      if (currentPrice && currentPrice > 0) {
        inv.currentPrice = currentPrice;
        
        // Auto-infer units if the user skipped entering them during setup
        if ((!inv.units || inv.units === 0) && inv.amountInvested > 0) {
           inv.buyPrice = currentPrice; // Assuming bought at current NAV for baseline
           inv.units = inv.amountInvested / currentPrice;
        }

        if (inv.units > 0) {
          inv.currentValue = inv.units * currentPrice;
        }
        
        inv.absoluteReturn = inv.currentValue - inv.amountInvested;
        if (inv.amountInvested > 0) {
          inv.returns = ((inv.absoluteReturn / inv.amountInvested) * 100).toFixed(2);
        }
        
        await inv.save();
        updatedCount++;
      }
    }

    res.json({ success: true, message: `Successfully updated prices for ${updatedCount} investments.` });
  } catch (error) {
    next(error);
  }
};

module.exports = { getInvestments, addInvestment, updateInvestment, deleteInvestment, refreshPrices };
