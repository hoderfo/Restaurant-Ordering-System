import { create } from "zustand";
import axiosInstance from "../axios/axiosInstace";

const useReportStore = create((set) => ({
    salesData: [],
    cashierData: [],
    topItemsData: [],
    profitLossData: { totalRevenue: 0, totalCost: 0, profit: 0, orderCount: 0 },
    isLoading: false,
    error: null,

    fetchSalesReports: async (filter = "daily") => {
        set({ isLoading: true });
        try {
            const response = await axiosInstance.get(`/reports/sales?filter=${filter}`);
            set({ salesData: response.data.data, isLoading: false });
        } catch (error) {
            set({ error: error.message, isLoading: false });
        }
    },

    fetchCashierCollections: async (filter = "daily") => {
        set({ isLoading: true });
        try {
            const response = await axiosInstance.get(`/reports/cashier-collections?filter=${filter}`);
            set({ cashierData: response.data.data, isLoading: false });
        } catch (error) {
            set({ error: error.message, isLoading: false });
        }
    },

    fetchTopSellingItems: async (filter = "daily", limit = 10) => {
        set({ isLoading: true });
        try {
            const response = await axiosInstance.get(`/reports/top-selling?filter=${filter}&limit=${limit}`);
            set({ topItemsData: response.data.data, isLoading: false });
        } catch (error) {
            set({ error: error.message, isLoading: false });
        }
    },

    fetchProfitLoss: async (filter = "monthly") => {
        set({ isLoading: true });
        try {
            const response = await axiosInstance.get(`/reports/profit-loss?filter=${filter}`);
            set({ profitLossData: response.data.data, isLoading: false });
        } catch (error) {
            set({ error: error.message, isLoading: false });
        }
    },
}));

export default useReportStore;
