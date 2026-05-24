import { create } from "zustand";
import { persist, devtools } from "zustand/middleware";
import axiosInstance from "../axios/axiosInstace";
import { getSocket } from "../config/socket.config";

export const useOrderStore = create(
    devtools(
        persist(
            (set, get) => ({
                cart: [],
                isLoading: false,
                error: null,
                lastOrder: null, // For billing slip
                stats: null,
                recentOrders: [],
                pagination: {
                    totalOrders: 0,
                    totalPages: 0,
                    currentPage: 1,
                    limit: 10
                },
                // Track if listeners are active to prevent duplicates
                listenersActive: false,

                addToCart: (menuItem) => {
                    const { cart } = get();
                    const existingItem = cart.find(item => item.menuItem._id === menuItem._id);

                    if (existingItem) {
                        set({
                            cart: cart.map(item =>
                                item.menuItem._id === menuItem._id
                                    ? { ...item, quantity: item.quantity + 1 }
                                    : item
                            )
                        });
                    } else {
                        set({
                            cart: [...cart, { menuItem, quantity: 1, name: menuItem.name, price: menuItem.price }]
                        });
                    }
                },

                removeFromCart: (menuItemId) => {
                    const { cart } = get();
                    const existingItem = cart.find(item => item.menuItem._id === menuItemId);

                    if (existingItem && existingItem.quantity > 1) {
                        set({
                            cart: cart.map(item =>
                                item.menuItem._id === menuItemId
                                    ? { ...item, quantity: item.quantity - 1 }
                                    : item
                            )
                        });
                    } else {
                        set({
                            cart: cart.filter(item => item.menuItem._id !== menuItemId)
                        });
                    }
                },

                clearCart: () => set({ cart: [] }),

                getStats: async () => {
                    set({ isLoading: true });
                    try {
                        const response = await axiosInstance.get("/orders/stats");
                        set({
                            stats: response.data.stats,
                            recentOrders: response.data.recentOrders,
                            isLoading: false
                        });
                    } catch (error) {
                        console.error("Get stats error:", error);
                        set({ isLoading: false, error: "Failed to fetch dashboard stats" });
                    }
                },

                getAllOrders: async (page = 1, limit = 10, startDate = null, endDate = null) => {
                    set({ isLoading: true });
                    try {
                        let url = `/orders?page=${page}&limit=${limit}`;
                        if (startDate) url += `&startDate=${startDate}`;
                        if (endDate) url += `&endDate=${endDate}`;
                        const response = await axiosInstance.get(url);
                        set({
                            recentOrders: response.data.orders,
                            pagination: response.data.pagination,
                            isLoading: false
                        });
                    } catch (error) {
                        console.error("Get orders error:", error);
                        set({ isLoading: false, error: "Failed to fetch orders" });
                    }
                },

                placeOrder: async (orderData) => {
                    set({ isLoading: true, error: null });
                    try {
                        const response = await axiosInstance.post("/orders", orderData);
                        set({
                            isLoading: false,
                            lastOrder: response.data.order,
                            cart: []
                        });
                        return { success: true, order: response.data.order };
                    } catch (error) {
                        console.error("Place order error:", error);
                        set({
                            isLoading: false,
                            error: error.response?.data?.message || "Failed to place order"
                        });
                        return { success: false, message: error.response?.data?.message };
                    }
                },

                updateOrderStatus: async (orderId, status) => {
                    set({ isLoading: true });
                    try {
                        const response = await axiosInstance.patch(`/orders/${orderId}/status`, { status });
                        const { recentOrders } = get();
                        set({
                            recentOrders: recentOrders.map(o => o._id === orderId ? response.data.order : o),
                            isLoading: false
                        });
                        return { success: true };
                    } catch (error) {
                        console.error("Update status error:", error);
                        set({ isLoading: false, error: "Failed to update order status" });
                        return { success: false, message: error.response?.data?.message };
                    }
                },

                resetLastOrder: () => set({ lastOrder: null }),

                // --- Socket.io Integration ---
                setupSocketListeners: () => {
                    const { listenersActive } = get();
                    if (listenersActive) return; // Prevent duplicate listeners

                    const socket = getSocket();

                    // Listen for new orders (e.g., placed by waitstaff, received by kitchen)
                    socket.on("newOrder", (newOrder) => {
                        const { recentOrders, stats } = get();
                        
                        // Check if order already exists to prevent duplicates
                        if (!recentOrders.find(o => o._id === newOrder._id)) {
                            // Update recent orders (add to top)
                            const updatedOrders = [newOrder, ...recentOrders].slice(0, 10); // Keep max 10
                            
                            // Optionally update stats broadly
                            const updatedStats = stats ? {
                                ...stats,
                                totalOrders: stats.totalOrders + 1,
                                pendingOrders: stats.pendingOrders + 1,
                                totalRevenue: stats.totalRevenue + newOrder.totalAmount
                            } : null;

                            set({ 
                                recentOrders: updatedOrders,
                                stats: updatedStats
                            });
                        }
                    });

                    // Listen for order status updates (e.g., from kitchen to waitstaff)
                    socket.on("orderStatusUpdate", (updatedOrder) => {
                        const { recentOrders, stats } = get();
                        
                        // Update the specific order in the list
                        const updatedOrders = recentOrders.map(o => 
                            o._id === updatedOrder._id ? updatedOrder : o
                        );

                        // If status changed to Completed/Cancelled, we might want to update pending count
                        if (stats && updatedOrder.status !== "Pending") {
                             // This is a simplification; a true sync might require a refetch 
                             // if moving from Pending to another state.
                             // For a robust system, we might just refetch stats occasionally.
                        }

                        set({ recentOrders: updatedOrders });
                    });

                    set({ listenersActive: true });
                },

                cleanupSocketListeners: () => {
                    const socket = getSocket();
                    socket.off("newOrder");
                    socket.off("orderStatusUpdate");
                    set({ listenersActive: false });
                }
            }),
            {
                name: "order-storage",
                partialize: (state) => ({ cart: state.cart }), // only persist cart
            }
        )
    )
);
