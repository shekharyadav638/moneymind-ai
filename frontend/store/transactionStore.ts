import { create } from 'zustand';
import { transactionAPI } from '../services/api';

export interface Transaction {
  _id: string;
  userId: string;
  amount: number;
  type: 'debit' | 'credit';
  category: string;
  merchant: string;
  description?: string;
  date: string;
  source: string;
  tags?: string[];
}

interface TransactionSummary {
  thisMonth: {
    spending: number;
    income: number;
    savingsRate: number;
    categoryBreakdown: Array<{ _id: string; total: number; count: number }>;
  };
  lastMonth: {
    spending: number;
    income: number;
  };
  recentTransactions: Transaction[];
  monthlySeries: Array<{ _id: { year: number; month: number }; total: number }>;
}

interface TransactionState {
  transactions: Transaction[];
  summary: TransactionSummary | null;
  isLoading: boolean;
  isSummaryLoading: boolean;
  error: string | null;
  pagination: { total: number; page: number; pages: number };

  fetchTransactions: (params?: any) => Promise<void>;
  fetchSummary: () => Promise<void>;
  addTransaction: (data: Partial<Transaction>) => Promise<Transaction>;
  deleteTransaction: (id: string) => Promise<void>;
  clearError: () => void;
}

export const useTransactionStore = create<TransactionState>((set, get) => ({
  transactions: [],
  summary: null,
  isLoading: false,
  isSummaryLoading: false,
  error: null,
  pagination: { total: 0, page: 1, pages: 1 },

  fetchTransactions: async (params = {}) => {
    set({ isLoading: true, error: null });
    try {
      const response: any = await transactionAPI.getAll(params);
      set({
        transactions: response.data,
        pagination: response.pagination,
        isLoading: false,
      });
    } catch (err: any) {
      set({ error: err.message, isLoading: false });
    }
  },

  fetchSummary: async () => {
    set({ isSummaryLoading: true });
    try {
      const response: any = await transactionAPI.getSummary();
      set({ summary: response.data, isSummaryLoading: false });
    } catch (err: any) {
      set({ isSummaryLoading: false });
    }
  },

  addTransaction: async (data) => {
    const response: any = await transactionAPI.create(data as any);
    const newTxn = response.data;
    set((state) => ({
      transactions: [newTxn, ...state.transactions],
    }));
    // Refresh summary
    get().fetchSummary();
    return newTxn;
  },

  deleteTransaction: async (id) => {
    await transactionAPI.delete(id);
    set((state) => ({
      transactions: state.transactions.filter((t) => t._id !== id),
    }));
    get().fetchSummary();
  },

  clearError: () => set({ error: null }),
}));
