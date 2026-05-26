import { create } from "zustand";

export const useOrderStore = create((set) => ({
    // Member B: Khai báo State và API gọi Order ở đây
    
    // Required hooks for App.jsx routing (Do not remove)
    setupSocketListeners: () => {
        // Member B: Tự set up socket io nếu cần
    },
    cleanupSocketListeners: () => {
        // Member B: Tự clean up socket io nếu cần
    }
}));
