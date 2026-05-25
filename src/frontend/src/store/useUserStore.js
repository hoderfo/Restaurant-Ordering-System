import { create } from "zustand";
import axiosInstance from "../axios/axiosInstace";
import { toast } from "sonner";

const useUserStore = create((set) => ({
    staff: [],
    isLoading: false,
    error: null,

    fetchStaff: async () => {
        set({ isLoading: true });
        try {
            const response = await axiosInstance.get("/users/staff");
            set({ staff: response.data.staff, isLoading: false });
        } catch (error) {
            set({ error: error.message, isLoading: false });
            toast.error("Failed to fetch staff");
        }
    },

    createNewStaff: async (staffData) => {
        set({ isLoading: true });
        try {
            const response = await axiosInstance.post("/users/staff", staffData);
            set((state) => ({ staff: [...state.staff, response.data.user], isLoading: false }));
            toast.success("Staff created successfully");
            return true;
        } catch (error) {
            set({ error: error.message, isLoading: false });
            toast.error(error.response?.data?.message || "Failed to create staff");
            return false;
        }
    },

    updateStaff: async (id, staffData) => {
        set({ isLoading: true });
        try {
            const response = await axiosInstance.put(`/users/staff/${id}`, staffData);
            set((state) => ({
                staff: state.staff.map((s) => (s._id === id ? response.data.user : s)),
                isLoading: false
            }));
            toast.success("Staff updated successfully");
            return true;
        } catch (error) {
            set({ error: error.message, isLoading: false });
            toast.error(error.response?.data?.message || "Failed to update staff");
            return false;
        }
    },

    toggleStaffStatus: async (id) => {
        try {
            const response = await axiosInstance.patch(`/users/staff/${id}/status`, {});
            set((state) => ({
                staff: state.staff.map((s) => (s._id === id ? { ...s, isActive: response.data.isActive } : s))
            }));
            toast.success(response.data.message);
        } catch {
            toast.error("Failed to toggle staff status");
        }
    },

    deleteStaff: async (id) => {
        try {
            await axiosInstance.delete(`/users/staff/${id}`);
            set((state) => ({ staff: state.staff.filter((s) => s._id !== id) }));
            toast.success("Staff deleted successfully");
        } catch {
            toast.error("Failed to delete staff");
        }
    }
}));

export default useUserStore;
