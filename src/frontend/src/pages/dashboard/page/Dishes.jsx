import React, { useEffect, useState, useMemo } from 'react';
import { useOrderStore } from '@/store/useOrderStore';
import { AnimatePresence, motion as Motion } from 'framer-motion';

// Component Imports
import OrderTerminalHeader from '../components/OrderTerminalHeader';
import OrderCardView from '../components/OrderCardView';
import OrderTableView from '../components/OrderTableView';
import OrderSummarySidebar from '../components/OrderSummarySidebar';
import { Loader2, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import Pagination from '@/components/ui/custom-pagination';

const Dishes = () => {
    const { recentOrders, getAllOrders, updateOrderStatus, isLoading, pagination, setupSocketListeners, cleanupSocketListeners } = useOrderStore();
    const [viewMode, setViewMode] = useState('card'); // 'card' | 'table'
    const [filter, setFilter] = useState("All");
    const [searchTerm, setSearchTerm] = useState("");
    const [selectedOrder, setSelectedOrder] = useState(null);
    const [currentTime, setCurrentTime] = useState(new Date());
    const [startDate, setStartDate] = useState("");
    const [endDate, setEndDate] = useState("");

    useEffect(() => {
        setupSocketListeners();
        return () => {
            cleanupSocketListeners();
        };
    }, [setupSocketListeners, cleanupSocketListeners]);

    useEffect(() => {
        getAllOrders(pagination?.currentPage || 1, 10, startDate, endDate);
        const timer = setInterval(() => setCurrentTime(new Date()), 30000);
        
        return () => {
            clearInterval(timer);
        };
    }, [getAllOrders, pagination?.currentPage, startDate, endDate]);

    // Handle initial selection or clearing if orders change
    useEffect(() => {
        if (selectedOrder) {
            const updated = recentOrders.find(o => o._id === selectedOrder._id);
            if (updated) {
                if (JSON.stringify(updated) !== JSON.stringify(selectedOrder)) {
                    // eslint-disable-next-line react-hooks/set-state-in-effect
                    setSelectedOrder(updated);
                }
            } else {
                setSelectedOrder(null);
            }
        }
    }, [recentOrders, selectedOrder]);

    const filteredOrders = useMemo(() => {
        return recentOrders.filter(order => {
            const matchesSearch =
                (order.orderId?.toLowerCase().includes(searchTerm.toLowerCase())) ||
                (order.clientName?.toLowerCase().includes(searchTerm.toLowerCase())) ||
                (order.clientPhone?.includes(searchTerm));
            const orderStatus = typeof order.status === 'object' ? order.status?.name : order.status;
            const matchesFilter = filter === "All" || orderStatus === filter;
            return matchesSearch && matchesFilter;
        });
    }, [recentOrders, searchTerm, filter]);

    const handlePageChange = (newPage) => {
        getAllOrders(newPage, 10, startDate, endDate);
    };

    const stats = useMemo(() => ({
        total: recentOrders.length,
        pending: recentOrders.filter(o => o.status === "Pending").length,
        preparing: recentOrders.filter(o => o.status === "Preparing").length,
        ready: recentOrders.filter(o => o.status === "Ready").length,
        completed: recentOrders.filter(o => o.status === "Completed").length,
        cancelled: recentOrders.filter(o => o.status === "Cancelled").length,
    }), [recentOrders]);

    return (
        <div className="min-h-screen bg-background p-4 md:p-8 overflow-x-hidden transition-colors duration-500">
            <div className="max-w-[1800px] mx-auto">
                <OrderTerminalHeader
                    searchTerm={searchTerm}
                    setSearchTerm={setSearchTerm}
                    viewMode={viewMode}
                    setViewMode={setViewMode}
                    filter={filter}
                    setFilter={setFilter}
                    startDate={startDate}
                    setStartDate={setStartDate}
                    endDate={endDate}
                    setEndDate={setEndDate}
                    stats={stats}
                    isLoading={isLoading}
                    onRefresh={() => getAllOrders(pagination?.currentPage || 1, 10, startDate, endDate)}
                    currentTime={currentTime}
                />

                <div className="flex flex-col lg:flex-row gap-8 items-start relative min-h-[60vh]">
                    {/* Main Listing Area */}
                    <main className={`flex-1 min-w-0 transition-all duration-700 ease-[cubic-bezier(0.23,1,0.32,1)] ${selectedOrder ? 'lg:mr-[450px]' : ''}`}>
                        <AnimatePresence mode="wait">
                            {isLoading && recentOrders.length === 0 ? (
                                <Motion.div
                                    key="loader"
                                    initial={{ opacity: 0, y: 20 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    exit={{ opacity: 0, scale: 0.95 }}
                                    className="flex flex-col items-center justify-center h-[50vh] space-y-8"
                                >
                                    <div className="relative">
                                        <div className="absolute inset-0 bg-primary blur-[80px] opacity-10 animate-pulse" />
                                        <div className="relative bg-card p-6 rounded-xl shadow-lg border">
                                            <Loader2 className="h-10 w-10 animate-spin text-primary" />
                                        </div>
                                    </div>
                                    <div className="text-center">
                                        <h3 className="text-xl font-bold tracking-tight text-foreground">Loading Orders</h3>
                                        <p className="text-sm font-medium text-muted-foreground mt-2">Connecting to data...</p>
                                    </div>
                                </Motion.div>
                            ) : filteredOrders.length === 0 ? (
                                <Motion.div
                                    key="empty"
                                    initial={{ opacity: 0, scale: 0.95 }}
                                    animate={{ opacity: 1, scale: 1 }}
                                    exit={{ opacity: 0, scale: 0.9 }}
                                    className="flex flex-col items-center justify-center h-[50vh] bg-muted/30 backdrop-blur-md rounded-xl border border-dashed border-border"
                                >
                                    <div className="p-6 bg-amber-500/10 rounded-full text-amber-500 mb-6 font-semibold flex items-center justify-center shadow-sm">
                                        <AlertCircle size={40} />
                                    </div>
                                    <h3 className="text-2xl font-bold text-foreground mb-2 tracking-tight">No Orders Found</h3>
                                    <p className="text-muted-foreground font-medium text-sm">There are no orders matching your current filters</p>
                                    <Button
                                        onClick={() => { setFilter("All"); setSearchTerm(""); }}
                                        className="mt-8 px-6 h-10 bg-primary hover:bg-primary/90 text-primary-foreground rounded-md font-semibold text-sm shadow-sm transition-all hover:-translate-y-0.5"
                                    >
                                        Clear Filters
                                    </Button>
                                </Motion.div>
                            ) : (
                                <Motion.div
                                    key={viewMode}
                                    initial={{ opacity: 0, y: 10 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    exit={{ opacity: 0, y: -10 }}
                                    transition={{ duration: 0.4, ease: [0.23, 1, 0.32, 1] }}
                                >
                                    <div className="space-y-6">
                                        {viewMode === 'card' ? (
                                            <OrderCardView
                                                orders={filteredOrders}
                                                selectedOrderId={selectedOrder?._id}
                                                onSelectOrder={setSelectedOrder}
                                            />
                                        ) : (
                                            <OrderTableView
                                                orders={filteredOrders}
                                                selectedOrderId={selectedOrder?._id}
                                                onSelectOrder={setSelectedOrder}
                                            />
                                        )}
                                        <Pagination
                                            pagination={pagination}
                                            onPageChange={handlePageChange}
                                        />
                                    </div>
                                </Motion.div>
                            )}
                        </AnimatePresence>
                    </main>

                    {/* Detail Sidebar Area */}
                    <AnimatePresence>
                        {selectedOrder && (
                            <>
                                {/* Mobile Backdrop */}
                                <Motion.div
                                    initial={{ opacity: 0 }}
                                    animate={{ opacity: 1 }}
                                    exit={{ opacity: 0 }}
                                    className="fixed inset-0 bg-black/40 backdrop-blur-sm z-40 lg:hidden"
                                />

                                <Motion.aside
                                    initial={{ x: '100%', opacity: 0.5 }}
                                    animate={{ x: 0, opacity: 1 }}
                                    exit={{ x: '100%', opacity: 0 }}
                                    transition={{ type: 'spring', damping: 25, stiffness: 200 }}
                                    className="fixed inset-y-0 right-0 z-50 w-full sm:w-[450px] lg:fixed lg:right-8 lg:top-[180px] lg:h-[calc(100vh-220px)] shadow-[-20px_0_50px_rgba(0,0,0,0.1)] lg:shadow-none"
                                >
                                    <div className="h-full">
                                        <OrderSummarySidebar
                                            order={selectedOrder}
                                            onClose={() => setSelectedOrder(null)}
                                            onUpdateStatus={updateOrderStatus}
                                        />
                                    </div>
                                </Motion.aside>
                            </>
                        )}
                    </AnimatePresence>
                </div>
            </div>

            {/* Global Style Inject for custom scrollbars */}
            <style jsx="true">{`
                .no-scrollbar::-webkit-scrollbar { display: none; }
                .no-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }
                .custom-scrollbar::-webkit-scrollbar { width: 6px; }
                .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
                .custom-scrollbar::-webkit-scrollbar-thumb { background: #E2E8F0; border-radius: 20px; }
                .dark .custom-scrollbar::-webkit-scrollbar-thumb { background: #1E293B; }
                .custom-scrollbar::-webkit-scrollbar-thumb:hover { background: #CBD5E1; }
                .dark .custom-scrollbar::-webkit-scrollbar-thumb:hover { background: #334155; }
            `}</style>
        </div>
    );
};

export default Dishes;
