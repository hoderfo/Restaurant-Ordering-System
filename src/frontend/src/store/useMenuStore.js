import { create } from "zustand";
import axiosInstance from "../axios/axiosInstace";

export const useMenuStore = create((set) => ({
    isLoading: false,
    error: null,
    menu: [],
    category: [],
    paginationMenu: {
        totalItems: 0,
        totalPages: 0,
        currentPage: 1,
        limit: 10
    },
    paginationCategory: {
        totalCategories: 0,
        totalPages: 0,
        currentPage: 1,
        limit: 10
    },

    // --- Categories ---

    getAllCategories: async (page = 1, limit = 10) => {
        set({ isLoading: true, error: null });
        try {
            const response = await axiosInstance.get(`/menu/category?page=${page}&limit=${limit}`);
            set({
                category: response.data.categories,
                paginationCategory: response.data.pagination,
                isLoading: false,
                error: null
            });
        } catch (error) {
            console.error("Error fetching categories:", error);
            set({
                error: error.response?.data?.message || "Error fetching categories",
                isLoading: false
            });
        }
    },

    createCategory: async (categoryData) => {
        set({ isLoading: true, error: null });
        try {
            const response = await axiosInstance.post("/menu/category", categoryData);

            set((state) => ({
                category: [...state.category, response.data.category],
                isLoading: false,
                error: null
            }));
            return response.data;
        } catch (error) {
            console.error("Error creating category:", error);
            set({
                error: error.response?.data?.message || "Error creating category",
                isLoading: false
            });
            throw error;
        }
    },

    updateCategory: async (id, categoryData) => {
        set({ isLoading: true, error: null });
        try {
            const response = await axiosInstance.put(`/menu/category/${id}`, categoryData);
            set((state) => ({
                category: state.category.map((c) => c._id === id ? response.data.category : c),
                isLoading: false,
                error: null
            }));
            return response.data;
        } catch (error) {
            console.error("Error updating category:", error);
            set({
                error: error.response?.data?.message || "Error updating category",
                isLoading: false
            });
            throw error;
        }
    },

    deleteCategory: async (id) => {
        set({ isLoading: true, error: null });
        try {
            await axiosInstance.delete(`/menu/category/${id}`);
            set((state) => ({
                category: state.category.filter((c) => c._id !== id),
                isLoading: false,
                error: null
            }));
        } catch (error) {
            console.error("Error deleting category:", error);
            set({
                error: error.response?.data?.message || "Error deleting category",
                isLoading: false
            });
            throw error;
        }
    },

    // --- Menu Items ---

    getAllMenuItems: async (page = 1, limit = 10, categoryId = "", search = "", isAvailable = "") => {
        set({ isLoading: true, error: null });
        try {
            let url = `/menu/item?page=${page}&limit=${limit}`;
            if (categoryId) url += `&category=${categoryId}`;
            if (search) url += `&search=${search}`;
            if (isAvailable !== "") url += `&isAvailable=${isAvailable}`;

            const response = await axiosInstance.get(url);
            set({
                menu: response.data.menuItems,
                paginationMenu: response.data.pagination,
                isLoading: false,
                error: null
            });
        } catch (error) {
            console.error("Error fetching menu items:", error);
            set({
                error: error.response?.data?.message || "Error fetching menu items",
                isLoading: false
            });
        }
    },

    createMenuItem: async (itemData) => {
        set({ isLoading: true, error: null });
        try {
            const response = await axiosInstance.post("/menu/item", itemData);

            set((state) => ({
                menu: [...state.menu, response.data.menuItem],
                isLoading: false,
                error: null
            }));
            return response.data;
        } catch (error) {
            console.error("Error creating menu item:", error);
            set({
                error: error.response?.data?.message || "Error creating menu item",
                isLoading: false
            });
            throw error;
        }
    },

    updateMenuItem: async (id, itemData) => {
        set({ isLoading: true, error: null });
        try {
            const response = await axiosInstance.put(`/menu/item/${id}`, itemData);
            set((state) => ({
                menu: state.menu.map((item) => item._id === id ? response.data.menuItem : item),
                isLoading: false,
                error: null
            }));
            return response.data;
        } catch (error) {
            console.error("Error updating menu item:", error);
            set({
                error: error.response?.data?.message || "Error updating menu item",
                isLoading: false
            });
            throw error;
        }
    },

    deleteMenuItem: async (id) => {
        set({ isLoading: true, error: null });
        try {
            await axiosInstance.delete(`/menu/item/${id}`);
            set((state) => ({
                menu: state.menu.filter((item) => item._id !== id),
                isLoading: false,
                error: null
            }));
        } catch (error) {
            console.error("Error deleting menu item:", error);
            set({
                error: error.response?.data?.message || "Error deleting menu item",
                isLoading: false
            });
            throw error;
        }
    }

}));
