import { create } from 'zustand';
import { investmentAPI } from '../services/api';

export interface Investment {
  _id: string;
  name: string;
  type: string;
  assetClass: string;
  amountInvested: number;
  currentValue: number;
  units: number;
  buyPrice: number;
  currentPrice: number;
  returns: number;
  absoluteReturn: number;
  sipAmount?: number;
  sipFrequency?: string;
  purchaseDate: string;
  ticker?: string;
  notes?: string;
}

interface PortfolioSummary {
  totalInvested: number;
  currentValue: number;
  totalReturns: number;
  returnsPercent: number;
  portfolioByAssetClass: Array<{ _id: string; totalInvested: number; currentValue: number; count: number }>;
  portfolioByType: Array<{ _id: string; totalInvested: number; currentValue: number; count: number }>;
}

interface InvestmentState {
  investments: Investment[];
  summary: PortfolioSummary | null;
  isLoading: boolean;
  error: string | null;

  fetchInvestments: () => Promise<void>;
  addInvestment: (data: Partial<Investment>) => Promise<Investment>;
  updateInvestment: (id: string, data: Partial<Investment>) => Promise<void>;
  deleteInvestment: (id: string) => Promise<void>;
  clearError: () => void;
}

export const useInvestmentStore = create<InvestmentState>((set) => ({
  investments: [],
  summary: null,
  isLoading: false,
  error: null,

  fetchInvestments: async () => {
    set({ isLoading: true, error: null });
    try {
      const response: any = await investmentAPI.getAll();
      set({
        investments: response.data.investments,
        summary: response.data.summary,
        isLoading: false,
      });
    } catch (err: any) {
      set({ error: err.message, isLoading: false });
    }
  },

  addInvestment: async (data) => {
    const response: any = await investmentAPI.create(data as any);
    const newInv = response.data;
    set((state) => ({
      investments: [newInv, ...state.investments],
    }));
    return newInv;
  },

  updateInvestment: async (id, data) => {
    const response: any = await investmentAPI.update(id, data);
    set((state) => ({
      investments: state.investments.map((inv) =>
        inv._id === id ? response.data : inv
      ),
    }));
  },

  deleteInvestment: async (id) => {
    await investmentAPI.delete(id);
    set((state) => ({
      investments: state.investments.filter((inv) => inv._id !== id),
    }));
  },

  clearError: () => set({ error: null }),
}));
