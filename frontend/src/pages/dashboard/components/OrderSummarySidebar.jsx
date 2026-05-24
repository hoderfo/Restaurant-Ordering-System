import React from 'react';
import {
    X,
    Printer,
    CheckCircle2,
    XCircle,
    Phone,
    User,
    Clock,
    Wallet,
    ShoppingBag,
    UtensilsCrossed,
    CreditCard,
    DollarSign,
    QrCode,
    Smartphone
} from 'lucide-react';
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { cn } from "@/lib/utils";
import { ScrollArea } from "@/components/ui/scroll-area";
import { motion as Motion, AnimatePresence } from 'framer-motion';


const OrderSummarySidebar = ({ order, onClose, onUpdateStatus }) => {
    if (!order) return (
        <div className="h-full flex flex-col items-center justify-center text-center p-12 space-y-6 bg-white/40 dark:bg-gray-900/40 backdrop-blur-xl rounded-[3rem] border-2 border-dashed border-gray-200 dark:border-gray-800">
            <div className="bg-gray-100 dark:bg-gray-800 p-6 rounded-full text-gray-400">
                <ShoppingBag size={48} />
            </div>
            <div className="space-y-2">
                <h3 className="text-xl font-black text-gray-900 dark:text-white uppercase tracking-tighter">Terminal Waiting</h3>
                <p className="text-sm font-bold text-gray-400 uppercase tracking-widest leading-relaxed">Select a live ticket to<br />access order operations</p>
            </div>
        </div>
    );

    const statusProgress = {
        Pending: 25,
        Preparing: 50,
        Ready: 75,
        Completed: 100,
        Cancelled: 0
    };

    const currentStatus = order.status || "Pending";
    const subtotal = order.items?.reduce((acc, item) => acc + (item.price * item.quantity), 0) || 0;
    const tax = subtotal * 0.1; // 10% example
    const total = subtotal + tax;

    const getStatusAction = () => {
        switch (currentStatus) {
            case "Pending":
                return { label: "Start Preparing", next: "Preparing", color: "bg-orange-500 hover:bg-orange-600" };
            case "Preparing":
                return { label: "Mark as Ready", next: "Ready", color: "bg-cyan-500 hover:bg-cyan-600" };
            case "Ready":
                return { label: "Complete Order", next: "Completed", color: "bg-emerald-500 hover:bg-emerald-600" };
            default:
                return null;
        }
    };

    const action = getStatusAction();

    return (
        <Motion.div
            initial={{ opacity: 0, x: 40, scale: 0.97 }}
            animate={{ opacity: 1, x: 0, scale: 1 }}
            transition={{ duration: 0.2, ease: 'easeOut' }}
            className="h-full flex flex-col bg-card rounded-2xl border border-border/60 overflow-hidden relative"
        >

            {/* ── Header ── */}
            <div className="px-[18px] pt-4 pb-[14px] border-b border-border/50 flex-shrink-0">

                {/* Close */}
                <Button
                    variant="ghost"
                    size="icon"
                    onClick={onClose}
                    className="absolute top-[14px] right-[14px] w-7 h-7 rounded-md hover:bg-muted/60 border border-border/40"
                >
                    <X className="w-3.5 h-3.5" />
                </Button>

                {/* Order ID + Table */}
                <div className="flex items-start justify-between mb-[14px] pr-9">
                    <div className="flex flex-col gap-1">
                        <span className="text-[10px] font-semibold text-muted-foreground/50 uppercase tracking-[0.08em]">
                            Order ID
                        </span>
                        <span className="font-mono text-[20px] font-bold text-foreground tracking-tight leading-none">
                            #{String(order.orderId || '').split('-').pop()?.slice(-6) || 'N/A'}
                        </span>
                    </div>
                    <div className="flex flex-col gap-1 items-end">
                        <span className="text-[10px] font-semibold text-muted-foreground/50 uppercase tracking-[0.08em]">
                            Table
                        </span>
                        <span className="text-[20px] font-bold text-foreground leading-none">
                            {typeof order.table === 'object' ? order.table?.name : (order.table || '—')}
                        </span>
                    </div>
                </div>

                {/* Progress */}
                <div className="flex flex-col gap-1.5">
                    <div className="flex items-center justify-between">
                        <span className="text-[10px] font-semibold text-muted-foreground/50 uppercase tracking-[0.08em]">
                            Progress
                        </span>
                        <span className={cn(
                            "text-[10px] font-bold uppercase tracking-[0.06em]",
                            currentStatus === 'Pending' && "text-amber-500",
                            currentStatus === 'Preparing' && "text-orange-500",
                            currentStatus === 'Ready' && "text-cyan-500",
                            currentStatus === 'Completed' && "text-emerald-500",
                            currentStatus === 'Cancelled' && "text-rose-500",
                        )}>
                            {currentStatus}
                        </span>
                    </div>
                    <div className="h-[3px] w-full bg-muted/60 rounded-full overflow-hidden">
                        <Motion.div
                            initial={{ width: 0 }}
                            animate={{ width: `${statusProgress[currentStatus]}%` }}
                            transition={{ duration: 0.5, ease: 'easeOut' }}
                            className={cn(
                                "h-full rounded-full",
                                currentStatus === 'Pending' && "bg-amber-500",
                                currentStatus === 'Preparing' && "bg-orange-500",
                                currentStatus === 'Ready' && "bg-cyan-500",
                                currentStatus === 'Completed' && "bg-emerald-500",
                                currentStatus === 'Cancelled' && "bg-rose-500",
                            )}
                        />
                    </div>
                </div>
            </div>

            {/* ── Scrollable Body ── */}
            <ScrollArea className="flex-1 min-h-0">
                <div className="px-[18px] py-4 flex flex-col gap-4">

                    {/* Items */}
                    <div>
                        <p className="text-[10px] font-semibold text-muted-foreground/50 uppercase tracking-[0.08em] mb-2">
                            Live Ticket Items
                        </p>
                        <div className="flex flex-col">
                            {order.items?.map((item, i) => (
                                <Motion.div
                                    key={i}
                                    initial={{ opacity: 0, y: 8 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ delay: i * 0.04, duration: 0.18 }}
                                    className="flex items-center gap-2.5 px-2.5 py-2.5 rounded-lg border border-transparent hover:bg-muted/40 hover:border-border/40 transition-all duration-150 group"
                                >
                                    {/* Icon + qty badge */}
                                    <div className="relative shrink-0">
                                        <div className="w-9 h-9 rounded-lg bg-muted/50 border border-border/50 flex items-center justify-center">
                                            <UtensilsCrossed className="w-[14px] h-[14px] text-muted-foreground/60" />
                                        </div>
                                        <div className="absolute -top-1.5 -right-1.5 w-[18px] h-[18px] rounded-full bg-foreground text-background flex items-center justify-center text-[9px] font-bold leading-none">
                                            {item.quantity}
                                        </div>
                                    </div>

                                    {/* Name + note */}
                                    <div className="flex-1 flex flex-col gap-0.5 min-w-0">
                                        <span className="text-[12px] font-semibold text-foreground leading-none truncate capitalize">
                                            {item.name}
                                        </span>
                                        <span className="text-[10px] text-muted-foreground/60 font-medium leading-none truncate">
                                            {item.note || 'Regular Preparation'}
                                        </span>
                                    </div>

                                    {/* Price */}
                                    <span className="font-mono text-[12px] font-semibold text-foreground shrink-0 tabular-nums">
                                        Rs {(item.price * item.quantity).toLocaleString()}
                                    </span>
                                </Motion.div>
                            ))}
                        </div>
                    </div>

                    {/* Bill Summary */}
                    <div>
                        <p className="text-[10px] font-semibold text-muted-foreground/50 uppercase tracking-[0.08em] mb-2">
                            Bill Summary
                        </p>
                        <div className="bg-muted/30 border border-border/50 rounded-lg px-[14px] py-3 flex flex-col gap-2.5">
                            <div className="flex justify-between items-center">
                                <span className="text-[11px] font-medium text-muted-foreground">Subtotal</span>
                                <span className="font-mono text-[12px] font-semibold text-foreground tabular-nums">
                                    Rs {subtotal.toLocaleString()}
                                </span>
                            </div>
                            <div className="flex justify-between items-center">
                                <span className="text-[11px] font-medium text-muted-foreground">Tax (GST 10%)</span>
                                <span className="font-mono text-[12px] font-semibold text-foreground tabular-nums">
                                    Rs {tax.toLocaleString()}
                                </span>
                            </div>
                            <div className="h-px bg-border/50" />
                            <div className="flex justify-between items-center">
                                <span className="text-[10px] font-semibold text-muted-foreground/50 uppercase tracking-[0.08em]">
                                    Total
                                </span>
                                <span className="font-mono text-[18px] font-bold text-foreground tabular-nums tracking-tight">
                                    Rs {total.toLocaleString()}
                                </span>
                            </div>
                        </div>
                    </div>

                    {/* Payment Method */}
                    <div>
                        <p className="text-[10px] font-semibold text-muted-foreground/50 uppercase tracking-[0.08em] mb-2">
                            Payment Method
                        </p>
                        <div className="grid grid-cols-2 gap-2">
                            <button className="flex items-center gap-2 px-3 py-2.5 rounded-lg border border-border/50 bg-transparent hover:bg-muted/40 transition-colors">
                                <Wallet className="w-3.5 h-3.5 text-muted-foreground/60 shrink-0" />
                                <span className="text-[11px] font-600 text-muted-foreground font-semibold">Cash</span>
                            </button>
                            <button className="flex items-center gap-2 px-3 py-2.5 rounded-lg border border-border/60 bg-muted/30 hover:bg-muted/50 transition-colors">
                                <CreditCard className="w-3.5 h-3.5 text-muted-foreground/60 shrink-0" />
                                <span className="text-[11px] font-semibold text-muted-foreground">Digital</span>
                            </button>
                        </div>
                    </div>

                </div>
            </ScrollArea>

            {/* ── Footer Actions ── */}
            <div className="px-[18px] py-[14px] border-t border-border/50 flex flex-col gap-2 flex-shrink-0 bg-card">
                <Button
                    onClick={() => action && onUpdateStatus(order._id, action.next)}
                    disabled={!action}
                    className={cn(
                        "w-full h-9 rounded-lg font-semibold text-[12px] tracking-wide shadow-none transition-all",
                        action ? action.color : "bg-emerald-500 hover:bg-emerald-600 text-white"
                    )}
                >
                    {action ? action.label : 'Order Fully Processed'}
                </Button>

                <div className="grid grid-cols-2 gap-2">
                    <Button
                        variant="outline"
                        onClick={() => onUpdateStatus(order._id, 'Cancelled')}
                        disabled={order.status === 'Cancelled'}
                        className="h-8 rounded-lg text-[11px] font-medium border-border/60 text-muted-foreground hover:text-destructive hover:bg-destructive/8 hover:border-destructive/30 shadow-none transition-colors"
                    >
                        <XCircle className="w-3.5 h-3.5 mr-1.5" />
                        Void Ticket
                    </Button>
                    <Button
                        variant="outline"
                        className="h-8 rounded-lg text-[11px] font-medium border-border/60 text-muted-foreground hover:text-foreground hover:bg-muted/50 shadow-none transition-colors"
                    >
                        <Printer className="w-3.5 h-3.5 mr-1.5" />
                        Print Bill
                    </Button>
                </div>
            </div>

        </Motion.div>
    );
};

export default OrderSummarySidebar;
