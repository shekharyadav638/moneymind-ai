const cron = require('node-cron');
const Investment = require('../models/Investment');
const User = require('../models/User');
const Transaction = require('../models/Transaction');
const { fetchInvestmentPrice } = require('./priceService');

/**
 * Initialize all scheduled background jobs
 */
const initCronJobs = () => {
  console.log('🗓️  Initializing cron jobs...');

  // 1. SIP Auto-Deduction (Runs daily at 8:00 AM)
  cron.schedule('0 8 * * *', async () => {
    console.log('⏰ Running daily SIP deduction check...');
    try {
      const today = new Date().getDate(); // 1 to 31

      // Find all active SIP investments where deduction day is today
      const sipsDue = await Investment.find({
        type: 'sip',
        isActive: true,
        sipDeductionDay: today,
        sipAmount: { $gt: 0 }
      });

      console.log(`Found ${sipsDue.length} SIPs due for deduction today (Day ${today})`);

      for (const sip of sipsDue) {
        // Increment invested amount
        sip.amountInvested += sip.sipAmount;
        
        // Compute new current value and absolute returns
        if (sip.units && sip.currentPrice) {
           // We can't automatically know how many units the sip amount buys since price varies daily
           // But value goes up by the sip amount as a reasonable approximation until actual units are updated
           sip.currentValue += sip.sipAmount;
        } else {
           sip.currentValue = sip.amountInvested;
        }

        sip.absoluteReturn = sip.currentValue - sip.amountInvested;
        if (sip.amountInvested > 0) {
          sip.returns = ((sip.absoluteReturn / sip.amountInvested) * 100).toFixed(2);
        }

        await sip.save();

        console.log(`✅ Processed SIP deduction for ${sip.name}: ₹${sip.sipAmount}`);
      }
    } catch (error) {
      console.error('❌ Error running SIP cron:', error.message);
    }
  });

  // 2. Live Portfolio Pricing (Runs daily at 11:30 PM after market close)
  cron.schedule('30 15 * * *', async () => {
    console.log('📈 Running daily portfolio pricing update...');
    try {
      // Find all active stocks and mutual funds
      const investments = await Investment.find({
        type: { $in: ['stock', 'mutual_fund', 'sip'] },
        isActive: true,
      });

      console.log(`Found ${investments.length} investments to price check`);

      for (const inv of investments) {
        const currentPrice = await fetchInvestmentPrice(inv);
        
        if (currentPrice && currentPrice > 0) {
          inv.currentPrice = currentPrice;
          
          if (inv.units > 0) {
            inv.currentValue = inv.units * currentPrice;
          }

          inv.absoluteReturn = inv.currentValue - inv.amountInvested;
          if (inv.amountInvested > 0) {
            inv.returns = ((inv.absoluteReturn / inv.amountInvested) * 100).toFixed(2);
          }

          await inv.save();
          console.log(`  Updated ${inv.name}: Current Price ₹${currentPrice}`);
        }
      }
    } catch (error) {
      console.error('❌ Error running Pricing cron:', error.message);
    }
  });
};

module.exports = { initCronJobs };
