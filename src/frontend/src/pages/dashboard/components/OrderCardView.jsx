import React, { memo } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
    Timer,
    ShoppingBag,
    UtensilsCrossed,
    User,
    CreditCard,
    Clock,
    CheckCircle2,
    XCircle,
    ChevronRight
} from 'lucide-react';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';

// Configuration moved outside for memoization stability
const statusConfig = {
    Pending: {
        icon: Clock,
        label: 'Incoming',
        color: 'text-amber-500',
        bgColor: 'bg-amber-50/50 dark:bg-amber-500/10',
        badge: 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-200/50 dark:border-amber-800/50'
    },
    Preparing: {
        icon: Timer,
        label: 'Preparing',
        color: 'text-orange-500',
        bgColor: 'bg-orange-50/50 dark:bg-orange-500/10',
        badge: 'bg-orange-500/10 text-orange-600 dark:text-orange-400 border-orange-200/50 dark:border-orange-800/50'
    },
    Ready: {
        icon: CheckCircle2,
        label: 'Ready',
        color: 'text-cyan-500',
        bgColor: 'bg-cyan-50/50 dark:bg-cyan-500/10',
        badge: 'bg-cyan-500/10 text-cyan-600 dark:text-cyan-400 border-cyan-200/50 dark:border-cyan-800/50'
    },
    Completed: {
        icon: CheckCircle2,
        label: 'Success',
        color: 'text-emerald-500',
        bgColor: 'bg-emerald-50/50 dark:bg-emerald-500/10',
        badge: 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-200/50 dark:border-emerald-800/50'
    },
    Cancelled: {
        icon: XCircle,
        label: 'Cancelled',
        color: 'text-rose-500',
        bgColor: 'bg-rose-50/50 dark:bg-rose-500/10',
        badge: 'bg-rose-500/10 text-rose-600 dark:text-rose-400 border-rose-200/50 dark:border-rose-800/50'
    }
};

const typeConfig = {
    Takeaway: {
        icon: ShoppingBag,
        label: 'Takeaway',
        color: 'text-orange-600',
        bgColor: 'bg-orange-50 dark:bg-orange-950/20'
    },
    DineIn: {
        icon: UtensilsCrossed,
        label: 'Dine In',
        color: 'text-blue-600',
        bgColor: 'bg-blue-50 dark:bg-blue-950/20'
    },
    Delivery: {
        icon: ShoppingBag,
        label: 'Delivery',
        color: 'text-purple-600',
        bgColor: 'bg-purple-50 dark:bg-purple-950/20'
    }
};

const OrderCardItem = memo(({ order, isSelected, onSelectOrder }) => {
    const statusKey = typeof order.status === 'object' ? order.status?.name : (order.status || 'Pending');
    const typeKey = typeof order.type === 'object' ? order.type?.name : (order.type || 'Takeaway');

    const status = statusConfig[statusKey] || statusConfig.Pending;
    const orderType = typeConfig[typeKey] || typeConfig.Takeaway;
    const StatusIcon = status.icon;

    // const isTakeaway = typeKey === 'Takeaway';

    return (
        <div className="h-full">
            <Card className={cn(
                "h-full bg-card overflow-hidden relative border rounded-2xl flex flex-col transition-all duration-200",
                isSelected
                    ? "border-primary ring-1 ring-primary"
                    : "hover:border-border/60"
            )}>
                <CardContent className="p-[18px] flex flex-col h-full">

                    {/* Header Row */}
                    <div className="flex items-center justify-between mb-[14px]">
                        <div className="flex flex-col gap-[5px] min-w-0">
                            <span className="text-[13px] font-semibold text-foreground leading-none truncate">
                                {order.clientName || 'Guest'}
                            </span>
                            <div className="flex items-center gap-1.5">
                                <span className="text-[11px] font-medium text-muted-foreground leading-none">
                                    Order
                                </span>
                                <span className="font-mono text-[11px] font-semibold text-muted-foreground leading-none tracking-[0.05em]">
                                    #{String(order.orderId || '').split('-').pop()?.slice(-4) || '0000'}
                                </span>
                                <span className="w-px h-3 bg-border shrink-0" />
                                <span className="text-[11px] font-medium text-muted-foreground leading-none truncate">
                                    {orderType.label}
                                </span>
                            </div>
                        </div>

                        <div className={cn(
                            "flex items-center gap-[5px] px-2 py-1 rounded-md shrink-0",
                            status.bgColor
                        )}>
                            <div className={cn("w-1.5 h-1.5 rounded-full shrink-0", status.dotColor)} />
                            <span className={cn(
                                "text-[10px] font-bold tracking-[0.06em] uppercase leading-none",
                                status.color
                            )}>
                                {status.label}
                            </span>
                        </div>
                    </div>

                    {/* Date / Time Row */}
                    <div className="flex items-center justify-between pb-3 mb-3 border-b border-border/50">
                        <span className="text-[11px] font-medium text-muted-foreground/60 uppercase tracking-[0.08em]">
                            {format(new Date(order.createdAt), 'EEE, MMM d, yyyy')}
                        </span>
                        <span className="font-mono text-[11px] font-semibold text-muted-foreground/70 tracking-[0.05em]">
                            {format(new Date(order.createdAt), 'hh:mm a')}
                        </span>
                    </div>

                    {/* Items List */}
                    <div className="w-full flex-1 flex flex-col">

                        {/* Column Headers */}
                        <div className="flex items-center pb-2">
                            <div className="flex-1 text-[10px] font-semibold text-muted-foreground/50 uppercase tracking-[0.08em]">Item</div>
                            <div className="w-9 text-center text-[10px] font-semibold text-muted-foreground/50 uppercase tracking-[0.08em]">Qty</div>
                            <div className="w-[88px] text-right text-[10px] font-semibold text-muted-foreground/50 uppercase tracking-[0.08em]">Amount</div>
                        </div>

                        <div className="w-full h-px bg-border/50 mb-2.5" />

                        <div className="space-y-2.5 flex-1">
                            {order.items?.map((item, idx) => {
                                if (idx > 3) return null;

                                const isFinalRowFaded = order.items.length > 4 && idx === 3;
                                const itemName = typeof item.product === 'object'
                                    ? item.product?.name
                                    : (item.name || 'Unknown Item');
                                const itemTotal = ((item.price || 0) * (item.quantity || 1)).toLocaleString();

                                return (
                                    <div key={idx} className="relative flex items-center">
                                        <div className={cn(
                                            "flex w-full items-center transition-all duration-150",
                                            isFinalRowFaded && "opacity-25 blur-[0.5px] select-none pointer-events-none"
                                        )}>
                                            <div className="flex-1 text-[12px] font-medium text-foreground truncate pr-3 leading-none">
                                                {itemName}
                                            </div>
                                            <div className="w-9 text-center text-[12px] font-semibold text-muted-foreground tabular-nums leading-none">
                                                {item.quantity}
                                            </div>
                                            <div className="w-[88px] text-right font-mono text-[12px] font-semibold text-foreground tabular-nums leading-none">
                                                Rs {itemTotal}
                                            </div>
                                        </div>

                                        {isFinalRowFaded && (
                                            <div className="absolute inset-0 flex items-center justify-center">
                                                <span className="text-[11px] font-semibold text-muted-foreground tracking-wide">
                                                    +{order.items.length - 3} more items
                                                </span>
                                            </div>
                                        )}
                                    </div>
                                );
                            })}

                            {(!order.items || order.items.length === 0) && (
                                <div className="flex-1 flex items-center justify-center py-4">
                                    <span className="text-[11px] font-medium text-muted-foreground/40">
                                        No items listed
                                    </span>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Total Row */}
                    <div className="flex items-center justify-between pt-3 mt-3 border-t border-border/50 shrink-0">
                        <span className="text-[10px] font-semibold text-muted-foreground/50 uppercase tracking-[0.08em]">
                            Total
                        </span>
                        <span className="font-mono text-[17px] font-bold text-foreground tabular-nums tracking-tight">
                            Rs {order.totalAmount?.toLocaleString()}
                        </span>
                    </div>

                    {/* Action Buttons */}
                    <div className="flex items-center gap-2 mt-3 shrink-0">
                        <Button
                            variant="outline"
                            onClick={() => onSelectOrder(order)}
                            className="flex-1 h-[34px] rounded-lg border-border/60 text-muted-foreground hover:text-foreground hover:bg-muted/40 font-medium text-[12px] tracking-wide shadow-none transition-colors"
                        >
                            View Details
                        </Button>
                        {/* <Button
                            className="flex-1 h-[34px] rounded-lg bg-foreground hover:bg-foreground/88 text-background font-semibold text-[12px] tracking-wide shadow-none transition-colors"
                        >
                            Pay Bill
                        </Button> */}
                    </div>

                </CardContent>
            </Card>
        </div>
    );
});

OrderCardItem.displayName = "OrderCardItem";

const OrderCardView = ({ orders, selectedOrderId, onSelectOrder }) => {
    return (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
            {orders.map((order) => (
                <OrderCardItem
                    key={order._id}
                    order={order}
                    isSelected={selectedOrderId === order._id}
                    onSelectOrder={onSelectOrder}
                />
            ))}
        </div>
    );
};

export default OrderCardView;