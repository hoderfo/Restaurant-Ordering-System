import { create } from "zustand";
import axiosInstance from "../axios/axiosInstace";


export const useTableStore = create((set) => ({
    tables: [],
    reservations: [],
    isLoading: false,
    error: null,

    getTables: async () => {
        set({ isLoading: true, error: null });
        try {
            const response = await axiosInstance.get("/table");
            set({ tables: response.data.tables, isLoading: false });
        } catch (error) {
            set({ error: error.response?.data?.message || "Error fetching tables", isLoading: false });
        }
    },

    addTable: async (tableData) => {
        set({ isAddingTable: true });
        try {
            const payload = {
                label: tableData.label,
                capacity: tableData.capacity,
            };
            const response = await axiosInstance.post('/table', payload);
            if (response.data.success) {
                set((state) => ({ tables: [...state.tables, response.data.table] }));
            }
        } catch (error) {
            set({ error: error.response?.data?.message || "Error creating table", isLoading: false });
            return { success: false, message: error.response?.data?.message };
        }
    },

    updateTable: async (tableId, tableData) => {
        set({ isUpdatingTable: true });
        try {
            const payload = { ...tableData };
            if (payload.name) {
                payload.label = payload.name;
                delete payload.name;
            }
            if (payload.zone) {
                delete payload.zone;
            }
            
            const response = await axiosInstance.put(`/table/${tableId}`, payload);
            if (response.data.success) {
                set((state) => ({
                    tables: state.tables.map(table => table._id === tableId ? response.data.table : table),
                    isLoading: false
                }));
                return { success: true };
            }
        } catch (error) {
            set({ error: error.response?.data?.message || "Error updating table", isLoading: false });
            return { success: false, message: error.response?.data?.message };
        }
    },

    deleteTable: async (id) => {
        set({ isLoading: true, error: null });
        try {
            await axiosInstance.delete(`/table/${id}`);
            set((state) => ({
                tables: state.tables.filter((t) => t._id !== id),
                isLoading: false,
            }));
            return { success: true };
        } catch (error) {
            set({ error: error.response?.data?.message || "Error deleting table", isLoading: false });
            return { success: false, message: error.response?.data?.message };
        }
    },

    getReservations: async () => {
        set({ isLoading: true, error: null });
        try {
            const response = await axiosInstance.get("/reservations");
            set({ reservations: response.data.reservations, isLoading: false });
        } catch (error) {
            set({ error: error.response?.data?.message || "Error fetching reservations", isLoading: false });
        }
    },

    createReservation: async (reservationData) => {
        set({ isLoading: true, error: null });
        try {
            const response = await axiosInstance.post(`/reservations`, reservationData);
            // Optionally update the table status if needed
            set((state) => ({
                reservations: [...state.reservations, { ...response.data.reservation, table: response.data.table }],
                tables: state.tables.map(t => t._id === response.data.table._id ? response.data.table : t),
                isLoading: false,
            }));
            return { success: true, requiresOverride: false, table: response.data.table };
        } catch (error) {
            set({ error: error.response?.data?.message || "Error creating reservation", isLoading: false });
            return { 
                success: false, 
                message: error.response?.data?.message,
                requiresOverride: error.response?.data?.requiresOverride,
                suggestedTableId: error.response?.data?.suggestedTableId,
                suggestedTime: error.response?.data?.suggestedTime
            };
        }
    },

    cancelReservation: async (reservationId) => {
        set({ isLoading: true, error: null });
        try {
            const response = await axiosInstance.put(`/reservations/${reservationId}/cancel`);
            set((state) => ({
                reservations: state.reservations.map(r => r._id === reservationId ? { ...r, status: "Cancelled" } : r),
                isLoading: false,
            }));
            return { success: true };
        } catch (error) {
            set({ error: error.response?.data?.message || "Error canceling reservation", isLoading: false });
            return { success: false, message: error.response?.data?.message };
        }
    },

    checkInReservation: async (reservationId) => {
        set({ isLoading: true, error: null });
        try {
            const response = await axiosInstance.put(`/reservations/${reservationId}/checkin`);
            set((state) => {
                const reservation = state.reservations.find(r => r._id === reservationId);
                const tableId = reservation?.table?._id || reservation?.table_id;
                
                return {
                    reservations: state.reservations.map(r => r._id === reservationId ? { ...r, status: "Seated" } : r),
                    tables: state.tables.map(t => t._id === tableId ? { ...t, status: "Occupied" } : t),
                    isLoading: false,
                };
            });
            return { success: true };
        } catch (error) {
            set({ error: error.response?.data?.message || "Error checking in reservation", isLoading: false });
            return { success: false, message: error.response?.data?.message };
        }
    },

    markNoShow: async (reservationId) => {
        set({ isLoading: true, error: null });
        try {
            const response = await axiosInstance.put(`/reservations/${reservationId}/noshow`);
            set((state) => {
                const reservation = state.reservations.find(r => r._id === reservationId);
                const tableId = reservation?.table?._id || reservation?.table_id;
                
                return {
                    reservations: state.reservations.map(r => r._id === reservationId ? { ...r, status: "No_show" } : r),
                    tables: state.tables.map(t => t._id === tableId ? { ...t, status: "Available" } : t),
                    isLoading: false,
                };
            });
            return { success: true };
        } catch (error) {
            set({ error: error.response?.data?.message || "Error marking no-show", isLoading: false });
            return { success: false, message: error.response?.data?.message };
        }
    },

    handleWalkIn: async (walkInData) => {
        set({ isLoading: true, error: null });
        try {
            const response = await axiosInstance.post("/reservations/walkin", walkInData);
            set((state) => ({
                reservations: [...state.reservations, { ...response.data.reservation, table: response.data.table }],
                tables: state.tables.map(t => t._id === response.data.table._id ? response.data.table : t)
            }));
            return { success: true, data: response.data };
        } catch (error) {
            return { success: false, message: error.response?.data?.message || "Walk-in failed" };
        } finally {
            set({ isLoading: false });
        }
    }
}));
