import { create } from "zustand";
import axiosInstance from "../axios/axiosInstace";

const useDashboardStore = create((set) => ({
    dashboardData: null,
    isLoading: false,
    error: null,

    fetchDashboardSummary: async () => {
        set({ isLoading: true });
        try {
            const response = await axiosInstance.get("/dashboard/summary");
            set({ dashboardData: response.data.data, isLoading: false });
        } catch (error) {
            set({ error: error.message, isLoading: false });
        }
    }
}));

export default useDashboardStore;
