import { create } from "zustand";
import axiosInstance from "../axios/axiosInstace";
import { toast } from "sonner"

export const useInventoryStore = create((set, get) => ({
    items: [],
    stats: null,
    isLoading: false,
    error: null,
    pagination: {
        totalItems: 0,
        totalPages: 0,
        currentPage: 1,
        limit: 10
    },

    fetchInventory: async (page = 1, limit = 10) => {
        set({ isLoading: true });
        try {
            const response = await axiosInstance.get(`/inventory?page=${page}&limit=${limit}`);
            set({
                items: response.data.data,
                pagination: response.data.pagination,
                isLoading: false
            });
        } catch (error) {
            set({ error: error.response?.data?.message || "Error fetching inventory", isLoading: false });
            toast.error(get().error);
        }
    },

    fetchReports: async () => {
        set({ isLoading: true });
        try {
            const response = await axiosInstance.get(`/inventory/reports`);
            set({ stats: response.data.data, isLoading: false });
        } catch (error) {
            set({ error: error.response?.data?.message || "Error fetching reports", isLoading: false });
            toast.error(get().error);
        }
    },

    addStockItem: async (itemData) => {
        set({ isLoading: true });
        try {
            const response = await axiosInstance.post(`/inventory`, itemData);
            set((state) => ({
                items: [response.data.data, ...state.items],
                isLoading: false
            }));
            toast.success("Item added successfully");
            get().fetchReports();
        } catch (error) {
            set({ isLoading: false });
            toast.error(error.response?.data?.message || "Error adding item");
        }
    },

    updateStockItem: async (id, updateData) => {
        try {
            const response = await axiosInstance.put(`/inventory/${id}`, updateData);
            set((state) => ({
                items: state.items.map((item) => (item._id === id ? response.data.data : item)),
            }));
            toast.success("Item updated successfully");
            get().fetchReports();
        } catch (error) {
            toast.error(error.response?.data?.message || "Error updating item");
        }
    },

    deleteStockItem: async (id) => {
        try {
            await axiosInstance.delete(`/inventory/${id}`);
            set((state) => ({
                items: state.items.filter((item) => item._id !== id),
            }));
            toast.success("Item deleted successfully");
            get().fetchReports();
        } catch (error) {
            toast.error(error.response?.data?.message || "Error deleting item");
        }
    },
}));
