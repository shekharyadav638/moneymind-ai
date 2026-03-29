export const TRANSACTION_CATEGORIES = [
  { label: 'Food', icon: '🍔', color: '#FF6B6B' },
  { label: 'Rent', icon: '🏠', color: '#FF85A2' },
  { label: 'Travel', icon: '✈️', color: '#4ECDC4' },
  { label: 'Shopping', icon: '🛍️', color: '#FFB347' },
  { label: 'Bills', icon: '⚡', color: '#6C63FF' },
  { label: 'Entertainment', icon: '🎬', color: '#85C1E9' },
  { label: 'Health', icon: '💊', color: '#82E0AA' },
  { label: 'Education', icon: '📚', color: '#F8C471' },
  { label: 'Investment', icon: '📈', color: '#00D4AA' },
  { label: 'Income', icon: '💰', color: '#5DADE2' },
  { label: 'Others', icon: '📦', color: '#AEB6BF' },
] as const;

export const INVESTMENT_TYPES = [
  { label: 'Stock', value: 'stock', icon: '📊' },
  { label: 'Mutual Fund', value: 'mutual_fund', icon: '🏦' },
  { label: 'SIP', value: 'sip', icon: '🔄' },
  { label: 'Fixed Deposit', value: 'fd', icon: '🔒' },
  { label: 'PPF', value: 'ppf', icon: '🏛️' },
  { label: 'Gold', value: 'gold', icon: '🥇' },
  { label: 'Real Estate', value: 'real_estate', icon: '🏗️' },
  { label: 'Crypto', value: 'crypto', icon: '🔵' },
  { label: 'Other', value: 'other', icon: '📦' },
] as const;

export const ASSET_CLASSES = [
  { label: 'Equity', value: 'equity', color: '#6C63FF' },
  { label: 'Debt', value: 'debt', color: '#4ECDC4' },
  { label: 'Hybrid', value: 'hybrid', color: '#B39DDB' },
  { label: 'Commodity', value: 'commodity', color: '#FFD700' },
  { label: 'Real Estate', value: 'real_estate', color: '#FF85A2' },
  { label: 'Alternative', value: 'alternative', color: '#FFB347' },
  { label: 'Cash', value: 'cash', color: '#82E0AA' },
] as const;

export type TransactionCategory = (typeof TRANSACTION_CATEGORIES)[number]['label'];
export type InvestmentType = (typeof INVESTMENT_TYPES)[number]['value'];
