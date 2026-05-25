import { create } from "zustand";
import axiosInstance from "../axios/axiosInstace";
import { toast } from "sonner";

const useKitchenStore = create((set, get) => ({
    kitchenOrders: [],
    isLoading: false,

    fetchKitchenOrders: async () => {
        set({ isLoading: true });
        try {
            const res = await axiosInstance.get("/orders/kitchen");
            set({ kitchenOrders: res.data.orders, isLoading: false });
        } catch (error) {
            console.error("Fetch Kitchen Orders Error:", error);
            set({ isLoading: false });
            toast.error(error.response?.data?.message || "Failed to fetch kitchen orders");
        }
    },

    updateStatus: async (orderId, newStatus) => {
        try {
            const res = await axiosInstance.patch(`/orders/${orderId}/status`, { status: newStatus });
            if (res.data.success) {
                toast.success(`Order marked as ${newStatus}`);
                // Refresh orders after update
                get().fetchKitchenOrders();
            }
        } catch (error) {
            console.error("Update Status Error:", error);
            toast.error(error.response?.data?.message || "Failed to update order status");
        }
    }
}));

export default useKitchenStore;
