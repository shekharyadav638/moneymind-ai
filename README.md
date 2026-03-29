# MoneyMind AI — AI-Powered Personal Finance App

A production-ready mobile app for intelligent personal finance management. MoneyMind AI combines automated transaction tracking, investment portfolio management, and Claude-powered financial insights into a single, beautifully designed app.

**Stack:** React Native (Expo) · Node.js/Express · MongoDB · Anthropic Claude AI · Gmail OAuth2

---

## Features

### 1. Smart Dashboard

The home screen gives you an instant financial pulse with all key metrics in one place.

- **Net Worth Card** — Shows your total net worth calculated as: bank balance + investment portfolio value − liabilities. Updates in real time as you add transactions or investments.
- **Spending Summary** — Compares this month's spending against last month, so you can see whether you're spending more or less at a glance.
- **Savings Rate** — Automatically calculates what percentage of your income you're saving. A green rate means you're on track; a warning fires when savings drop.
- **Spending Breakdown Pie Chart** — Category-wise visualization (Food, Transport, Shopping, etc.) so you can see exactly where your money goes each month.
- **Monthly Trend Line Chart** — A 6-month historical view of your income vs. expenses, helping you spot seasonal patterns or lifestyle inflation.
- **Recent Transactions Feed** — The latest few transactions shown directly on the dashboard so nothing slips past you.

> **Why it's useful:** Most people have no idea of their real net worth or savings rate without manually calculating in a spreadsheet. This dashboard makes that visible in seconds, every time you open the app.

---

### 2. Transaction Tracking

Full CRUD management for all money movements.

- **Manual Entry** — Add any transaction with amount, category, merchant, payment source (bank/credit card/UPI), and date. Supports both debit (expenses) and credit (income) types.
- **Payment Source Tracking** — Classifies transactions by source: HDFC Savings, credit card, UPI, or other. Credit card transactions don't affect your bank balance calculation, keeping your balance accurate.
- **Smart Filtering** — Filter transactions by category, type (debit/credit), date range, or merchant name. Useful when reviewing a specific category like "Dining" before the month ends.
- **Monthly Summary** — Aggregated view of total income, total expenses, net flow, and breakdown by category for any given month.
- **Recurring Flags & Tags** — Mark transactions as recurring (rent, subscriptions) and add custom tags for better organization.
- **Derived Bank Balance** — Instead of requiring you to manually update your balance after every purchase, the app derives your current balance from a manual base amount plus all subsequent transactions.

> **Why it's useful:** Manually tracking every expense is tedious. MoneyMind combines auto-imported email transactions with manual entry as a fallback, reducing the burden while keeping your records complete.

---

### 3. Gmail Auto-Import

The most powerful automation feature — automatically pulls financial transactions from your inbox.

**How it works:**
1. Tap "Connect Gmail" on the Profile screen.
2. Authorize read-only access on Google's consent screen (the app never reads personal emails — only transaction alerts).
3. Tap "Sync Now" any time to import new transactions.
4. The backend scans your inbox for bank/UPI alert emails, parses the amounts and merchants, and creates transactions automatically.

**Supported email patterns:**
- HDFC Bank debit/credit alerts
- SBI transaction notifications
- UPI payment confirmations (PhonePe, Google Pay, Paytm)
- General debit/credit bank notification keywords

**Two-tier parsing pipeline:**
- **Rule-based parser** — Handles known Indian bank and UPI email formats instantly with zero API cost.
- **Claude Haiku fallback** — For unrecognized email patterns, Claude AI reads the email and extracts: amount, type, merchant, category, bank, and date. Fast and cost-effective.

**Deduplication:** Each email is tracked by its unique Gmail ID, so re-syncing never creates duplicate transactions.

**Background sync:** Sync runs asynchronously. The app polls for completion so you're never left staring at a spinner.

> **Why it's useful:** For anyone who gets bank/UPI SMS-style email alerts, this feature eliminates manual data entry entirely. You connect once and your transactions appear automatically — including older history.

---

### 4. Investment Portfolio Management

Track all your investments in one unified portfolio view.

**Supported investment types:**
| Type | Description |
|------|-------------|
| Stock | Listed equity shares |
| Mutual Fund | NAV-based fund units |
| SIP | Systematic Investment Plans with deduction tracking |
| Fixed Deposit | FDs with maturity tracking |
| PPF | Public Provident Fund |
| Gold | Physical or digital gold |
| Real Estate | Property investments |
| Crypto | Cryptocurrency holdings |
| Other | Any other asset |

**Supported asset classes:** Equity, Debt, Hybrid, Commodity, Real Estate, Alternative, Cash

**Key capabilities:**
- **Portfolio Summary** — Total amount invested, current portfolio value, and overall returns (percentage and absolute) all in one card.
- **Investment Breakdown Pie Chart** — Visualizes your asset allocation by investment type. Spot if you're over-concentrated in one asset class.
- **Returns Calculation** — Auto-computes `(currentValue - amountInvested) / amountInvested × 100` for each holding and the total portfolio.
- **Live Price Refresh** — Tap "Refresh Prices" to fetch current market prices for stocks, mutual funds, and SIPs.
- **SIP Tracking** — Records SIP amount, frequency (monthly/quarterly), start date, and deduction day so you know upcoming SIP deductions.
- **Investment Import from Email** — Broker confirmation emails (trade executions, allotments) can also be imported via Gmail sync.
- **Edit & Delete** — Update units or invested amount anytime, or mark an investment as inactive without deleting history.

> **Why it's useful:** Most Indians have investments spread across stocks, mutual funds, FDs, and PPF with no single place to see total portfolio value. MoneyMind unifies all of these with actual return calculations — something broker apps don't do across asset classes.

---

### 5. AI Financial Insights (Claude Sonnet)

Powered by `claude-sonnet-4-6`, this feature analyzes your complete financial picture and surfaces personalized advice.

**What it generates:**
- **Executive Summary** — A 1-2 sentence overview of your financial health this month.
- **3–5 Categorized Insights** — Each insight is tagged as one of:
  - `warning` — Something needs your attention (e.g., "You spent 40% more on dining this month")
  - `positive` — Something going well (e.g., "Your savings rate improved to 28%")
  - `tip` — An actionable suggestion (e.g., "Consider moving idle savings to a liquid fund")
  - `alert` — Urgent flag (e.g., "You have no emergency fund equivalent in liquid assets")
- **Savings Advice** — Specific guidance based on your income and current savings rate.
- **Top Spending Alert** — Flags your highest-spend category with context.

The AI receives your actual numbers — real spending by category, actual income, real portfolio value — so insights are grounded in your data, not generic platitudes.

> **Why it's useful:** A financial advisor would charge thousands to review your finances monthly. This feature gives you the same analytical depth for free, whenever you want it, tailored to your actual numbers.

---

### 6. AI Finance Chatbot (Claude Sonnet)

A conversational financial assistant that knows your complete financial profile.

**Quick prompts built-in:**
- "How much did I spend this month?"
- "Am I saving enough?"
- "What's my biggest expense?"
- "What's my net worth?"
- "Can I afford a ₹50,000 purchase?"
- "Where can I cut costs?"

**How it works:**
- Your full financial context (bank balance, monthly spending by category, investment portfolio, recent transactions, income) is passed as the system prompt.
- Supports multi-turn conversation — the chatbot remembers the last 8 messages in the session so you can ask follow-up questions naturally.
- Answers use your actual numbers, not estimates.

**Example interaction:**
```
You: How much did I spend on food this month?
AI:  You've spent ₹8,240 on food this month across 23 transactions.
     That's 18% of your total monthly spending and slightly above your
     3-month average of ₹7,100.

You: What if I cut that to ₹6,000?
AI:  Reducing food spend by ₹2,240 would raise your savings rate from
     22% to 27% — crossing the 25% healthy threshold financial planners
     typically recommend.
```

> **Why it's useful:** Unlike generic AI assistants, this chatbot has your real financial data. It answers questions that would normally require opening multiple apps or spreadsheets, in plain conversational language.

---

### 7. User Profile & Settings

Manage your financial baseline and app preferences.

- **Monthly Income** — Set your income so savings rate and financial health calculations are accurate.
- **Bank Balance** — Set your current bank balance as a starting point; subsequent transactions adjust it automatically.
- **Liabilities** — Record outstanding loans or credit card balances to get an accurate net worth.
- **Currency** — Configurable currency (defaults to INR).
- **Net Worth Breakdown** — Profile screen shows: bank balance, total investments, liabilities, and final net worth.
- **Gmail Connection Status** — See whether Gmail is connected and when the last sync ran.

---

### 8. Authentication & Security

- **Email/Password Auth** — Standard sign-up and login with bcrypt password hashing (12 rounds).
- **JWT Sessions** — Secure 7-day JWT tokens stored on device; auto-logout on expiry.
- **Rate Limiting** — Global 500 req/15min; AI endpoints limited to 20 req/15min per user to prevent abuse.
- **Helmet.js** — Security headers on all API responses.
- **Input Validation** — All inputs validated server-side; malformed requests rejected early.
- **OAuth2 Scopes** — Gmail access is read-only (`gmail.readonly`); the app cannot send emails or modify your inbox.

---

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Mobile Framework | React Native (Expo SDK 51) |
| Routing | Expo Router v3 (file-based) |
| State Management | Zustand v4 |
| Data Fetching | TanStack React Query v5 |
| Charts | React Native SVG (custom) |
| Backend | Node.js + Express v4 |
| Database | MongoDB (Mongoose ODM) |
| AI | Anthropic Claude (`sonnet-4-6` + `haiku-4-5`) |
| Auth | JWT + bcrypt |
| Email | Google Gmail API (OAuth2) |
| Security | Helmet.js, CORS, express-rate-limit |

---

## Quick Start

### Prerequisites
- Node.js 18+
- MongoDB (local or Atlas)
- Expo CLI: `npm install -g expo`
- Anthropic API key
- Google Cloud project with Gmail API enabled and OAuth2 credentials

### Backend Setup

```bash
cd backend
npm install
cp .env.example .env
# Fill in your credentials (see below)
npm run dev
```

**Required `.env` values:**
```env
PORT=5000
NODE_ENV=development
MONGODB_URI=mongodb://localhost:27017/moneymind
JWT_SECRET=<random 32+ character string>
JWT_EXPIRE=7d
ANTHROPIC_API_KEY=sk-ant-...
GOOGLE_CLIENT_ID=<from Google Cloud Console>
GOOGLE_CLIENT_SECRET=<from Google Cloud Console>
GOOGLE_REDIRECT_URI=http://localhost:5000/email/callback
FRONTEND_URL=http://localhost:8081
```

### Frontend Setup

```bash
cd frontend
npm install
cp .env.example .env
# Set EXPO_PUBLIC_API_URL=http://localhost:5000
# For physical device testing: use your machine's local IP instead of localhost
npx expo start
```

Press `i` for iOS simulator, `a` for Android emulator, or scan the QR code with Expo Go on a physical device.

---

## Project Structure

```
moneymind-ai/
├── backend/
│   └── src/
│       ├── models/              # MongoDB schemas (User, Transaction, Investment)
│       ├── routes/              # Express route definitions
│       ├── controllers/         # Request handlers and business logic
│       ├── middleware/          # JWT auth, error handler
│       └── services/
│           ├── claudeService.js       # AI insights, chatbot, email parsing
│           ├── gmailService.js        # OAuth2 flow, email fetching
│           ├── emailParser.js         # Rule-based bank email parser
│           ├── investmentEmailParser.js # Broker email parser
│           ├── priceService.js        # Live investment price fetching
│           └── cronService.js         # Background scheduled jobs
└── frontend/
    ├── app/
    │   ├── (auth)/              # Login, Signup screens
    │   ├── (tabs)/              # Dashboard, Transactions, Investments, Chat, Profile
    │   ├── add-transaction.tsx  # Add transaction modal
    │   └── add-investment.tsx   # Add investment modal
    ├── components/
    │   ├── ui/                  # GlassCard, GradientButton, StyledInput
    │   ├── charts/              # SpendingPieChart, SpendingLineChart
    │   └── cards/               # NetWorthCard, TransactionCard, InsightCard
    ├── store/                   # Zustand stores (auth, transactions, investments)
    └── services/                # Axios API client with interceptors
```

---

## API Reference

| Method | Route | Auth | Description |
|--------|-------|:----:|-------------|
| POST | `/auth/signup` | — | Register new user |
| POST | `/auth/login` | — | Login |
| GET | `/auth/me` | JWT | Get current profile |
| PUT | `/auth/me` | JWT | Update profile |
| GET | `/transactions` | JWT | List with filters & pagination |
| POST | `/transactions` | JWT | Add transaction |
| PUT | `/transactions/:id` | JWT | Update transaction |
| DELETE | `/transactions/:id` | JWT | Delete transaction |
| GET | `/transactions/summary` | JWT | Monthly dashboard summary |
| GET | `/transactions/balance` | JWT | Derived bank balance |
| GET | `/investments` | JWT | Portfolio + summary |
| POST | `/investments` | JWT | Add investment |
| PUT | `/investments/:id` | JWT | Update investment |
| DELETE | `/investments/:id` | JWT | Delete investment |
| POST | `/investments/refresh-prices` | JWT | Refresh live prices |
| POST | `/ai/insights` | JWT | Generate AI insights |
| POST | `/ai/chat` | JWT | AI chatbot message |
| GET | `/ai/networth` | JWT | Net worth breakdown |
| GET | `/email/auth-url` | JWT | Get Gmail OAuth URL |
| GET | `/email/callback` | — | OAuth callback handler |
| GET | `/email/sync` | JWT | Trigger email sync |
| DELETE | `/email/disconnect` | JWT | Disconnect Gmail |
| GET | `/health` | — | Server health check |

---

## Design System

The app uses a dark theme with glassmorphism cards and gradient accents.

| Token | Color | Use |
|-------|-------|-----|
| Primary | `#6C63FF` | Buttons, highlights |
| Secondary | `#4ECDC4` | Accents, charts |
| Background | `#0A0A1A` | Screen backgrounds |
| Surface | `#12122A` | Input fields |
| Card | `#1A1A35` | Card backgrounds |
| Success | `#00D4AA` | Positive values, gains |
| Error | `#FF6B6B` | Negative values, alerts |
| Warning | `#FFB347` | Caution indicators |

---

## Troubleshooting

**"Cannot connect to backend"**
Set `EXPO_PUBLIC_API_URL` to your machine's local IP address (e.g., `http://192.168.1.x:5000`), not `localhost`, when testing on a physical device.

**"Gmail sync fails"**
Ensure the `GOOGLE_REDIRECT_URI` in your `.env` exactly matches the Authorized Redirect URI configured in Google Cloud Console, including protocol and port.

**"AI insights timeout"**
Claude API can have variable latency. AI routes have a 30-second timeout configured. If it times out, retry — the API is typically faster on subsequent calls.

**"Duplicate transactions after sync"**
This shouldn't happen due to email ID deduplication. If it does, check that `emailId` is being saved on transactions and the MongoDB unique index is in place.

**"Token expired / logged out"**
JWT tokens expire after 7 days. Log in again. For production, implement refresh token rotation.
