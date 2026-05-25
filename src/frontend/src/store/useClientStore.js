import { create } from "zustand";
import axiosInstance from "../axios/axiosInstace";
import { toast } from "sonner";

const useClientStore = create((set) => ({
    clients: [],
    selectedClient: null,
    isLoading: false,
    error: null,
    pagination: {
        totalClients: 0,
        totalPages: 0,
        currentPage: 1,
        limit: 10
    },

    fetchClients: async (page = 1, limit = 10) => {
        set({ isLoading: true });
        try {
            const response = await axiosInstance.get(`/clients?page=${page}&limit=${limit}`);
            set({
                clients: response.data.clients,
                pagination: response.data.pagination,
                isLoading: false
            });
        } catch (error) {
            set({ error: error.message, isLoading: false });
            toast.error("Failed to fetch customers");
        }
    },

    fetchClientHistory: async (id) => {
        set({ isLoading: true });
        try {
            const response = await axiosInstance.get(`/clients/${id}/history`);
            set({ selectedClient: response.data.client, isLoading: false });
        } catch (error) {
            set({ error: error.message, isLoading: false });
            toast.error("Failed to fetch customer history");
        }
    },

    deleteClient: async (id) => {
        try {
            await axiosInstance.delete(`/clients/${id}`);
            set((state) => ({ clients: state.clients.filter((c) => c._id !== id) }));
            toast.success("Customer record removed");
        } catch (error) {
            toast.error(error.response?.data?.message || "Failed to delete customer");
        }
    },

    clearSelectedClient: () => set({ selectedClient: null })
}));

export default useClientStore;
