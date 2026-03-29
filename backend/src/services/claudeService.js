const Anthropic = require('@anthropic-ai/sdk');

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

/**
 * Build a structured financial context from user data
 * This is sent to Claude as context for all AI features
 */
const buildFinancialContext = (user, transactions, investments) => {
  const now = new Date();
  const currentMonth = now.getMonth();
  const currentYear = now.getFullYear();

  // Filter this month's transactions
  const thisMonthTxns = transactions.filter((t) => {
    const d = new Date(t.date);
    return d.getMonth() === currentMonth && d.getFullYear() === currentYear;
  });

  // Filter last month's transactions
  const lastMonthTxns = transactions.filter((t) => {
    const d = new Date(t.date);
    const lastMonth = currentMonth === 0 ? 11 : currentMonth - 1;
    const lastMonthYear = currentMonth === 0 ? currentYear - 1 : currentYear;
    return d.getMonth() === lastMonth && d.getFullYear() === lastMonthYear;
  });

  // Calculate totals
  const thisMonthSpend = thisMonthTxns
    .filter((t) => t.type === 'debit')
    .reduce((sum, t) => sum + t.amount, 0);

  const thisMonthIncome = thisMonthTxns
    .filter((t) => t.type === 'credit')
    .reduce((sum, t) => sum + t.amount, 0);

  const lastMonthSpend = lastMonthTxns
    .filter((t) => t.type === 'debit')
    .reduce((sum, t) => sum + t.amount, 0);

  // Spending by category this month
  const categorySpend = {};
  thisMonthTxns
    .filter((t) => t.type === 'debit')
    .forEach((t) => {
      categorySpend[t.category] = (categorySpend[t.category] || 0) + t.amount;
    });

  // Investment summary
  const totalInvested = investments.reduce((sum, i) => sum + i.amountInvested, 0);
  const currentPortfolioValue = investments.reduce((sum, i) => sum + (i.currentValue || i.amountInvested), 0);

  // Net worth
  const netWorth = (user.bankBalance || 0) + currentPortfolioValue - (user.liabilities || 0);
  const savingsRate = thisMonthIncome > 0
    ? (((thisMonthIncome - thisMonthSpend) / thisMonthIncome) * 100).toFixed(1)
    : 0;

  return {
    user: {
      name: user.name,
      monthlyIncome: user.monthlyIncome,
      bankBalance: user.bankBalance,
      liabilities: user.liabilities,
      currency: user.currency || 'INR',
    },
    currentMonth: {
      spending: thisMonthSpend,
      income: thisMonthIncome || user.monthlyIncome,
      savingsRate: `${savingsRate}%`,
      categoryBreakdown: categorySpend,
      transactionCount: thisMonthTxns.length,
    },
    lastMonth: {
      spending: lastMonthSpend,
    },
    investments: {
      totalInvested,
      currentValue: currentPortfolioValue,
      returns: totalInvested > 0
        ? `${(((currentPortfolioValue - totalInvested) / totalInvested) * 100).toFixed(2)}%`
        : '0%',
      count: investments.length,
    },
    netWorth,
    recentTransactions: transactions.slice(0, 10).map((t) => ({
      amount: t.amount,
      type: t.type,
      category: t.category,
      merchant: t.merchant,
      date: t.date,
    })),
  };
};

/**
 * Generate weekly AI financial insights
 */
const generateInsights = async (financialContext) => {
  const prompt = `You are MoneyMind AI, a personal finance advisor. Analyze the following financial data and provide 3-5 actionable insights.

Financial Data:
${JSON.stringify(financialContext, null, 2)}

Generate insights in this exact JSON format:
{
  "summary": "A 2-3 sentence overview of the user's financial health",
  "insights": [
    {
      "type": "warning|positive|tip|alert",
      "title": "Short title",
      "message": "Detailed actionable insight (2-3 sentences)",
      "icon": "emoji"
    }
  ],
  "savingsAdvice": "Specific advice about savings rate",
  "topSpendingAlert": "Alert about the highest spending category if concerning"
}

Be specific with numbers. Use the user's currency (${financialContext.user.currency}).
Keep messages concise, friendly, and actionable. Do NOT give generic advice.`;

  const response = await client.messages.create({
    model: 'claude-sonnet-4-6',
    max_tokens: 1024,
    messages: [{ role: 'user', content: prompt }],
  });

  try {
    const text = response.content[0].text;
    // Extract JSON from response (Claude might add explanation text)
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      return JSON.parse(jsonMatch[0]);
    }
    return JSON.parse(text);
  } catch {
    return {
      summary: response.content[0].text,
      insights: [],
    };
  }
};

/**
 * AI Chatbot — answer user questions about their finances
 */
const chatWithFinanceAI = async (userMessage, financialContext, chatHistory = []) => {
  const systemPrompt = `You are MoneyMind AI, a smart and friendly personal finance assistant.
You have access to the user's complete financial data below.

Financial Summary:
- Name: ${financialContext.user.name}
- Monthly Income: ₹${financialContext.user.monthlyIncome?.toLocaleString()}
- Bank Balance: ₹${financialContext.user.bankBalance?.toLocaleString()}
- Net Worth: ₹${financialContext.netWorth?.toLocaleString()}
- This Month Spending: ₹${financialContext.currentMonth.spending?.toLocaleString()}
- This Month Income: ₹${financialContext.currentMonth.income?.toLocaleString()}
- Savings Rate: ${financialContext.currentMonth.savingsRate}
- Total Investments: ₹${financialContext.investments.totalInvested?.toLocaleString()}
- Portfolio Value: ₹${financialContext.investments.currentValue?.toLocaleString()}
- Spending by Category: ${JSON.stringify(financialContext.currentMonth.categoryBreakdown)}

Recent Transactions:
${financialContext.recentTransactions.map((t) => `- ${t.type === 'debit' ? '💸' : '💰'} ₹${t.amount} at ${t.merchant} (${t.category}) on ${new Date(t.date).toLocaleDateString()}`).join('\n')}

Rules:
1. Answer questions based on ACTUAL user data above — never make up numbers
2. Be concise, warm, and helpful — like a knowledgeable friend
3. When asked about affordability, factor in savings rate and monthly surplus
4. Use ₹ (Indian Rupee) symbol for amounts
5. Format numbers with commas for readability
6. Keep responses under 200 words unless detailed analysis is requested
7. If you don't have specific data, say so clearly`;

  // Build messages array with history
  const messages = [
    ...chatHistory.map((msg) => ({
      role: msg.role,
      content: msg.content,
    })),
    { role: 'user', content: userMessage },
  ];

  const response = await client.messages.create({
    model: 'claude-sonnet-4-6',
    max_tokens: 512,
    system: systemPrompt,
    messages,
  });

  return response.content[0].text;
};

/**
 * Parse a transaction email using Claude
 * Returns structured transaction data
 */
const parseTransactionEmail = async (emailSubject, emailBody) => {
  const prompt = `Parse this bank/payment transaction email and extract transaction details.

Subject: ${emailSubject}
Body: ${emailBody}

Return ONLY a JSON object in this exact format (no explanation):
{
  "isTransaction": true/false,
  "amount": number or null,
  "type": "debit" or "credit",
  "merchant": "merchant name or null",
  "category": "Food|Rent|Travel|Shopping|Bills|Entertainment|Health|Education|Investment|Income|Others",
  "bank": "bank name or null",
  "lastFourDigits": "last 4 digits or null",
  "date": "ISO date string or null",
  "description": "brief description"
}

Examples:
- "Rs. 1,200 debited for Swiggy" → {"isTransaction":true,"amount":1200,"type":"debit","merchant":"Swiggy","category":"Food"...}
- "Your salary of Rs 85,000 credited" → {"isTransaction":true,"amount":85000,"type":"credit","merchant":"Employer","category":"Income"...}
- If not a transaction email, return {"isTransaction":false}`;

  try {
    const response = await client.messages.create({
      model: 'claude-haiku-4-5-20251001', // Use faster model for parsing
      max_tokens: 256,
      messages: [{ role: 'user', content: prompt }],
    });

    const text = response.content[0].text;
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      return JSON.parse(jsonMatch[0]);
    }
    return { isTransaction: false };
  } catch {
    return { isTransaction: false };
  }
};

module.exports = {
  buildFinancialContext,
  generateInsights,
  chatWithFinanceAI,
  parseTransactionEmail,
};
