import React from 'react';
import { ScrollArea } from "@/components/ui/scroll-area";
import KitchenOrderCard from './KitchenOrderCard';
import { motion as Motion, AnimatePresence } from 'framer-motion';
import { cn } from '@/lib/utils';

const countColors = {
    0: "bg-muted/50 text-muted-foreground/40 border-border/40",
    pending: "bg-amber-50 text-amber-800 border-amber-200 dark:bg-amber-900/20 dark:text-amber-400 dark:border-amber-800/40",
    preparing: "bg-blue-50 text-blue-800 border-blue-200 dark:bg-blue-900/20 dark:text-blue-400 dark:border-blue-800/40",
    ready: "bg-emerald-50 text-emerald-800 border-emerald-200 dark:bg-emerald-900/20 dark:text-emerald-400 dark:border-emerald-800/40",
};

const getCountColor = (nextStatus, count) => {
    if (count === 0) return countColors[0];
    if (nextStatus === 'Preparing') return countColors.pending;
    if (nextStatus === 'Ready') return countColors.preparing;
    return countColors.ready;
};

const KitchenColumn = ({
    title,
    icon: IconComponent,
    orders,
    onUpdate,
    nextStatus,
    actionLabel,
    actionIcon,
}) => {
    return (
        <div className="flex flex-col bg-card border border-border/60 rounded-xl overflow-hidden min-h-[75vh]">

            {/* Column Header */}
            <div className="flex items-center justify-between px-[14px] py-3 border-b border-border/50 flex-shrink-0">
                <div className="flex items-center gap-2">
                    <div className="w-[26px] h-[26px] rounded-[7px] bg-muted/50 border border-border/50 flex items-center justify-center shrink-0">
                        <IconComponent className="w-3 h-3 text-muted-foreground/60" />
                    </div>
                    <span className="text-[11px] font-bold text-foreground tracking-[0.02em]">
                        {title}
                    </span>
                </div>

                <span className={cn(
                    "inline-flex items-center justify-center h-[18px] min-w-[22px] px-[5px] rounded-[4px] font-mono text-[10px] font-bold border",
                    getCountColor(nextStatus, orders.length)
                )}>
                    {orders.length}
                </span>
            </div>

            {/* Scrollable Body */}
            <ScrollArea className="flex-1 min-h-0">
                <div className="p-2.5 flex flex-col gap-2">
                    <AnimatePresence mode="popLayout">
                        {orders.map((order) => (
                            <Motion.div
                                key={order._id}
                                layout
                                initial={{ opacity: 0, y: 6 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, scale: 0.97 }}
                                transition={{ duration: 0.16, ease: 'easeOut' }}
                            >
                                <KitchenOrderCard
                                    order={order}
                                    onUpdate={onUpdate}
                                    nextStatus={nextStatus}
                                    actionLabel={actionLabel}
                                    actionIcon={actionIcon}
                                />
                            </Motion.div>
                        ))}
                    </AnimatePresence>

                    {/* Empty State */}
                    {orders.length === 0 && (
                        <Motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            className="flex flex-col items-center justify-center gap-2 py-12 border border-dashed border-border/40 rounded-lg mx-0.5 mt-0.5"
                        >
                            <div className="w-8 h-8 rounded-lg bg-muted/40 border border-border/40 flex items-center justify-center">
                                <IconComponent className="w-3.5 h-3.5 text-muted-foreground/20" />
                            </div>
                            <span className="text-[10px] font-semibold text-muted-foreground/30 uppercase tracking-[0.08em]">
                                Station Clear
                            </span>
                        </Motion.div>
                    )}
                </div>
            </ScrollArea>

        </div>
    );
};

export default KitchenColumn;