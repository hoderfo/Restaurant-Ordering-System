import { create } from "zustand";
import { persist, devtools } from "zustand/middleware";
import axiosInstance from "../axios/axiosInstace";
import { toast } from "sonner"

export const useAuthStore = create(
    devtools(
        persist(
            (set) => ({
                authUser: null,
                isLoading: false,
                isSigningUp: false,
                isLoggingIn: false,
                isCheckingAuth: true,

                checkAuth: async () => {
                    set({ isCheckingAuth: true, isLoading: true });
                    const token = localStorage.getItem("token");
                    if (!token) {
                        set({ isCheckingAuth: false, authUser: null, isLoading: false });
                        return;
                    }
                    try {
                        const response = await axiosInstance.get("/auth/me");
                        set({ authUser: response.data.user, isCheckingAuth: false });
                    } catch (error) {
                        console.log(error);
                        localStorage.removeItem("token");
                        set({ isCheckingAuth: false, authUser: null });
                        // toast.error("User Not Authenticated");
                    } finally {
                        set({ isCheckingAuth: false, isLoading: false })
                    }
                },
                login: async (formData) => {
                    set({ isLoggingIn: true, isLoading: true });
                    try {
                        const response = await axiosInstance.post("/auth/login", formData);
                        localStorage.setItem("token", response.data.token);
                        set({ authUser: response.data.user, isLoggingIn: false });
                        toast.success("User Logged In");
                    } catch (error) {
                        console.log(error);
                        set({ isLoggingIn: false, isLoading: false });
                        toast.error(error.response?.data?.message || "User Not Logged In");
                    } finally {
                        set({ isLoggingIn: false, isLoading: false });
                    }
                },
                signup: async (formData) => {
                    set({ isSigningUp: true, isLoading: true });
                    try {
                        const response = await axiosInstance.post("/users/register", formData);
                        set({ authUser: response.data, isSigningUp: false });
                        toast.success("User Signed Up");
                    } catch (error) {
                        console.log(error);
                        set({ isSigningUp: false, isLoading: false });
                        toast.error(error.response?.data?.message || "User Not Signed Up");
                    } finally {
                        set({ isSigningUp: false, isLoading: false });
                    }
                },
                logout: async () => {
                    set({ isLoading: true });
                    try {
                        await axiosInstance.post("/auth/logout");
                        localStorage.removeItem("token");
                        toast.success("Logged out successfully");
                    } catch (error) {
                        console.log("Logout API error:", error);
                        localStorage.removeItem("token");
                        toast.error("Logout sync failed, but local session cleared");
                    } finally {
                        set({ authUser: null, isLoading: false });
                    }
                },
            }),
            {
                name: "auth-storage", // name of the item in the storage (must be unique)
                partialize: (state) => ({ authUser: state.authUser }), // only persist authUser
            }
        )
    )
);
