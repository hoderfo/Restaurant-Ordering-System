import React from 'react';
import { formatDistanceToNow, differenceInMinutes } from 'date-fns';
import { cn } from '@/lib/utils';

const KitchenOrderCard = ({ order, onUpdate, nextStatus, actionLabel }) => {
    const allItems = order.items || [];
    const orderAge = order.createdAt
        ? formatDistanceToNow(new Date(order.createdAt), { addSuffix: false })
        : '—';
    const ageMinutes = order.createdAt
        ? differenceInMinutes(new Date(), new Date(order.createdAt))
        : 0;
    const isUrgent = ageMinutes >= 15;

    return (
        <div className={cn(
            "bg-card border rounded-[10px] overflow-hidden transition-colors duration-100",
            isUrgent
                ? "border-amber-300/70 dark:border-amber-700/50"
                : "border-border/50 hover:border-border/80"
        )}>

            {/* Card Header */}
            <div className={cn(
                "px-3 py-2.5 border-b border-border/40",
                isUrgent && "bg-amber-50/60 dark:bg-amber-900/10"
            )}>
                <div className="flex items-center justify-between mb-1.5">
                    <span className="text-[13px] font-bold text-foreground leading-none truncate">
                        {order.clientName || 'Guest'}
                    </span>
                    <span className="font-mono text-[10px] font-semibold text-muted-foreground/50 shrink-0 ml-2">
                        #{String(order.orderId || '').split('-').pop()?.slice(-4) || '0000'}
                    </span>
                </div>
                <div className="flex items-center gap-1.5">
                    {order.orderType && (
                        <span className="inline-flex items-center h-[15px] px-[5px] rounded-[3px] bg-muted/60 border border-border/40 text-[9px] font-bold text-muted-foreground/60 uppercase tracking-[0.06em]">
                            {order.orderType}
                        </span>
                    )}
                    <span className={cn(
                        "flex items-center gap-1 text-[10px] font-medium",
                        isUrgent ? "text-amber-600 dark:text-amber-400" : "text-muted-foreground/50"
                    )}>
                        <svg width="9" height="9" viewBox="0 0 10 10" fill="none"
                            stroke="currentColor" strokeWidth="1.3" strokeLinecap="round">
                            <circle cx="5" cy="5" r="3.5" />
                            <path d="M5 3v2l1 1" />
                        </svg>
                        {orderAge}
                    </span>
                </div>
            </div>

            {/* Items — all visible, no truncation */}
            <div className="divide-y divide-border/30">
                {allItems.map((item, i) => {
                    const name = typeof item.product === 'object'
                        ? item.product?.name
                        : (item.name || 'Unknown');
                    const note = item.note || item.specialInstructions || null;

                    return (
                        <div key={i} className="flex items-center gap-0 px-3 py-[7px]">

                            {/* Qty box */}
                            <div className={cn(
                                "w-7 h-7 rounded-[6px] flex items-center justify-center font-mono text-[11px] font-extrabold shrink-0 border",
                                isUrgent
                                    ? "bg-amber-50 text-amber-800 border-amber-200 dark:bg-amber-900/20 dark:text-amber-400 dark:border-amber-800/40"
                                    : "bg-muted/50 text-foreground border-border/50"
                            )}>
                                {item.quantity}
                            </div>

                            {/* Item name + note */}
                            <div className="flex flex-col gap-0.5 flex-1 min-w-0 px-2.5">
                                <span className="text-[12px] font-semibold text-foreground capitalize leading-tight">
                                    {name}
                                </span>
                                {note && (
                                    <span className="text-[10px] text-muted-foreground/60 font-medium leading-none truncate">
                                        {note}
                                    </span>
                                )}
                            </div>

                        </div>
                    );
                })}
            </div>

            {/* Footer */}
            <div className={cn(
                "flex items-center justify-between px-3 py-2 border-t border-border/40",
                isUrgent
                    ? "bg-amber-50/40 dark:bg-amber-900/10"
                    : "bg-muted/20"
            )}>
                <span className={cn(
                    "text-[10px] font-semibold",
                    isUrgent
                        ? "text-amber-600 dark:text-amber-400"
                        : "text-muted-foreground/50"
                )}>
                    {isUrgent ? '⚠ Waiting long' : `${allItems.length} item${allItems.length !== 1 ? 's' : ''}`}
                </span>
                <button
                    onClick={() => onUpdate(order._id, nextStatus)}
                    className={cn(
                        "flex items-center gap-1 h-[26px] px-2.5 rounded-[6px] border-none text-[11px] font-semibold cursor-pointer transition-opacity",
                        isUrgent
                            ? "bg-amber-500 hover:bg-amber-500/85 text-white"
                            : "bg-foreground hover:bg-foreground/85 text-background"
                    )}
                >
                    {actionLabel} →
                </button>
            </div>

        </div>
    );
};

export default KitchenOrderCard;