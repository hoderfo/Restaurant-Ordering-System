import React, { useEffect, useMemo, useCallback } from 'react';
import useKitchenStore from '@/store/useKitchenStore';
import { Flame, Timer, CheckCircle2, ChevronRight } from 'lucide-react';
import KitchenColumn from '../components/kitchen/KitchenColumn';

const KitchenDashboard = () => {
    const { kitchenOrders, fetchKitchenOrders, updateStatus } = useKitchenStore();

    const handleRefresh = useCallback(async () => {
        await fetchKitchenOrders();
    }, [fetchKitchenOrders]);

    useEffect(() => {
        handleRefresh();
        const interval = setInterval(fetchKitchenOrders, 15000);
        return () => clearInterval(interval);
    }, [fetchKitchenOrders, handleRefresh]);

    const ordersByStatus = useMemo(() => ({
        Pending: kitchenOrders.filter(o => o.status === 'Pending'),
        Preparing: kitchenOrders.filter(o => o.status === 'Preparing'),
        Ready: kitchenOrders.filter(o => o.status === 'Ready'),
    }), [kitchenOrders]);

    return (
        <div className="min-h-screen bg-background p-6 md:p-8 transition-colors duration-300">
            <div className="max-w-[1600px] mx-auto flex flex-col gap-6">

                {/* Page Header */}
                <div className="flex items-center justify-between">
                    <div className="flex flex-col gap-0.5">
                        <h1 className="text-[18px] font-semibold text-foreground tracking-tight">
                            Kitchen
                        </h1>
                        <span className="text-[11px] text-muted-foreground/50 font-medium">
                            {kitchenOrders.length} active ticket{kitchenOrders.length !== 1 ? 's' : ''}
                        </span>
                    </div>
                    <div className="flex items-center gap-1.5">
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                        <span className="text-[11px] font-bold text-emerald-500 uppercase tracking-[0.04em]">
                            Live
                        </span>
                    </div>
                </div>

                {/* Columns */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
                    <KitchenColumn
                        title="Incoming"
                        icon={Flame}
                        orders={ordersByStatus.Pending}
                        onUpdate={updateStatus}
                        nextStatus="Preparing"
                        actionLabel="Accept"
                        actionIcon={ChevronRight}
                    />
                    <KitchenColumn
                        title="In Preparation"
                        icon={Timer}
                        orders={ordersByStatus.Preparing}
                        onUpdate={updateStatus}
                        nextStatus="Ready"
                        actionLabel="Mark Ready"
                        actionIcon={CheckCircle2}
                    />
                    <KitchenColumn
                        title="Ready for Pickup"
                        icon={CheckCircle2}
                        orders={ordersByStatus.Ready}
                        onUpdate={updateStatus}
                        nextStatus="Completed"
                        actionLabel="Distribute"
                        actionIcon={CheckCircle2}
                    />
                </div>

            </div>
        </div>
    );
};

export default KitchenDashboard;