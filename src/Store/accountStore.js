import { create } from "zustand";
import axios from "axios";

const API_URL = `${import.meta.env.VITE_API_BASE_URL}accounts`;

export const useAccountStore = create((set, get) => ({
  transactions: [],
  stats: {
    totalIncome: 0,
    totalExpense: 0,
    remaining: 0,
  },
  loading: false,
  error: null,

  fetchTransactions: async (filters = {}) => {
    set({ loading: true, error: null });
    try {
      const { type, search } = filters;
      const params = {};
      if (type && type !== "All") params.type = type;
      if (search && search.trim() !== "") params.search = search.trim();

      const response = await axios.get(API_URL, { params });
      set({ transactions: response.data.transactions || [], loading: false });
    } catch (error) {
      set({
        error: error.response?.data?.message || "Failed to fetch transactions",
        loading: false,
      });
    }
  },

  fetchStats: async () => {
    try {
      const response = await axios.get(`${API_URL}/stats`);
      set({ stats: response.data || { totalIncome: 0, totalExpense: 0, remaining: 0 } });
    } catch (error) {
      console.error("Failed to fetch transaction stats:", error);
    }
  },

  createTransaction: async (data) => {
    set({ loading: true, error: null });
    try {
      const response = await axios.post(API_URL, data);
      
      // Refresh transactions and stats
      await get().fetchTransactions();
      await get().fetchStats();
      
      set({ loading: false });
      return { success: true, transaction: response.data.transaction };
    } catch (error) {
      const msg = error.response?.data?.message || "Failed to create transaction";
      set({ error: msg, loading: false });
      return { success: false, error: msg };
    }
  },

  updateTransaction: async (id, data) => {
    set({ loading: true, error: null });
    try {
      const response = await axios.put(`${API_URL}/${id}`, data);
      
      // Refresh transactions and stats
      await get().fetchTransactions();
      await get().fetchStats();
      
      set({ loading: false });
      return { success: true, transaction: response.data.transaction };
    } catch (error) {
      const msg = error.response?.data?.message || "Failed to update transaction";
      set({ error: msg, loading: false });
      return { success: false, error: msg };
    }
  },

  deleteTransaction: async (id) => {
    set({ loading: true, error: null });
    try {
      await axios.delete(`${API_URL}/${id}`);
      
      // Refresh transactions and stats
      await get().fetchTransactions();
      await get().fetchStats();
      
      set({ loading: false });
      return { success: true };
    } catch (error) {
      const msg = error.response?.data?.message || "Failed to delete transaction";
      set({ error: msg, loading: false });
      return { success: false, error: msg };
    }
  },
}));
