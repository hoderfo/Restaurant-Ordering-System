import React, { memo } from 'react';
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
    Timer,
    FileText,
    Phone,
    User,
    CreditCard,
    Clock,
    CheckCircle2,
    XCircle,
    Eye,
    MapPin,
    Package
} from 'lucide-react';
import { motion as Motion } from 'framer-motion';
import { formatDistanceToNow, format } from 'date-fns';
import { cn } from '@/lib/utils';

// Status configuration
const statusConfig = {
    Pending: {
        icon: Clock,
        label: 'Pending',
        color: 'text-amber-600',
        bgColor: 'bg-amber-50 dark:bg-amber-950/20',
        badgeColor: 'bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-300'
    },
    Preparing: {
        icon: Timer,
        label: 'Preparing',
        color: 'text-orange-600',
        bgColor: 'bg-orange-50 dark:bg-orange-950/20',
        badgeColor: 'bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-300'
    },
    Ready: {
        icon: CheckCircle2,
        label: 'Ready',
        color: 'text-cyan-600',
        bgColor: 'bg-cyan-50 dark:bg-cyan-950/20',
        badgeColor: 'bg-cyan-100 text-cyan-800 dark:bg-cyan-900/30 dark:text-cyan-300'
    },
    Completed: {
        icon: CheckCircle2,
        label: 'Completed',
        color: 'text-emerald-600',
        bgColor: 'bg-emerald-50 dark:bg-emerald-950/20',
        badgeColor: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-300'
    },
    Cancelled: {
        icon: XCircle,
        label: 'Cancelled',
        color: 'text-rose-600',
        bgColor: 'bg-rose-50 dark:bg-rose-950/20',
        badgeColor: 'bg-rose-100 text-rose-800 dark:bg-rose-900/30 dark:text-rose-300'
    }
};

// Order type configuration
const typeConfig = {
    Takeaway: {
        icon: Package,
        label: 'Takeaway',
        color: 'text-orange-600'
    },
    DineIn: {
        icon: MapPin,
        label: 'Dine In',
        color: 'text-blue-600'
    },
    Delivery: {
        icon: Package,
        label: 'Delivery',
        color: 'text-purple-600'
    }
};

// Payment method configuration
const paymentConfig = {
    Cash: { label: 'Cash', color: 'text-green-600' },
    Card: { label: 'Card', color: 'text-blue-600' },
    'Debit Card': { label: 'Debit Card', color: 'text-blue-600' },
    'Credit Card': { label: 'Credit Card', color: 'text-blue-600' },
    'E-Wallet': { label: 'E-Wallet', color: 'text-purple-600' },
    Online: { label: 'Online', color: 'text-purple-600' }
};

const OrderTableRow = memo(({ order, index, isSelected, onSelectOrder }) => {
    const statusKey = typeof order.status === 'object' ? order.status?.name : (order.status || 'Pending');
    const typeKey = typeof order.type === 'object' ? order.type?.name : (order.type || 'DineIn');
    const paymentKey = typeof order.paymentMethod === 'object' ? order.paymentMethod?.name : order.paymentMethod;

    const status = statusConfig[statusKey] || statusConfig.Pending;
    const orderType = typeConfig[typeKey] || typeConfig.DineIn;
    const payment = paymentConfig[paymentKey] || paymentConfig.Cash;
    const StatusIcon = status.icon;
    const TypeIcon = orderType.icon;

    return (
        <Motion.tr
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.2, delay: index * 0.03 }}
            onClick={() => onSelectOrder(order)}
            className={cn(
                "group cursor-pointer border-b transition-colors",
                isSelected && "bg-primary/5 hover:bg-primary/5",
                !isSelected && "hover:bg-muted/50"
            )}
        >
            <TableCell className="py-4">
                <div className="flex flex-col">
                    <span className="font-semibold text-sm">
                        #{String(order.orderId || '').split('-').pop()?.slice(-4) || '0000'}
                    </span>
                    <span className="text-xs text-muted-foreground">
                        {format(new Date(order.createdAt), 'HH:mm')}
                    </span>
                </div>
            </TableCell>

            <TableCell>
                <div className="flex flex-col space-y-1">
                    <div className="flex items-center gap-2">
                        <User className="h-3.5 w-3.5 text-muted-foreground" />
                        <span className="font-medium text-sm">
                            {order.clientName || 'Guest'}
                        </span>
                    </div>
                    {order.clientPhone && (
                        <div className="flex items-center gap-2">
                            <Phone className="h-3 w-3 text-muted-foreground" />
                            <span className="text-xs text-muted-foreground">
                                {order.clientPhone}
                            </span>
                        </div>
                    )}
                </div>
            </TableCell>

            <TableCell>
                <div className="flex items-center gap-2">
                    <TypeIcon className={cn("h-4 w-4", orderType.color)} />
                    <span className="text-sm capitalize">{orderType.label}</span>
                </div>
                {order.table && (
                    <span className="text-xs text-muted-foreground block mt-1">
                        Table {typeof order.table === 'object' ? order.table?.name : order.table}
                    </span>
                )}
            </TableCell>

            <TableCell className="text-right">
                <span className="font-medium">
                    {order.items?.length || 0}
                </span>
            </TableCell>

            <TableCell className="text-right">
                <div className="flex flex-col items-end">
                    <span className="font-bold text-primary">
                        ${order.totalAmount?.toFixed(2) || '0.00'}
                    </span>
                    {order.discount && (
                        <span className="text-xs text-muted-foreground line-through">
                            ${(order.totalAmount + order.discount).toFixed(2)}
                        </span>
                    )}
                </div>
            </TableCell>

            <TableCell>
                <div className="flex items-center gap-2">
                    <CreditCard className={cn("h-3.5 w-3.5", payment.color)} />
                    <span className="text-sm">{payment.label}</span>
                </div>
            </TableCell>

            <TableCell>
                <div className="flex items-center gap-2">
                    <Timer className="h-3.5 w-3.5 text-muted-foreground" />
                    <div className="flex flex-col">
                        <span className="text-sm">
                            {formatDistanceToNow(new Date(order.createdAt), { addSuffix: true })}
                        </span>
                        <span className="text-xs text-muted-foreground">
                            {format(new Date(order.createdAt), 'MMM d')}
                        </span>
                    </div>
                </div>
            </TableCell>

            <TableCell>
                <Badge
                    variant="secondary"
                    className={cn(
                        "font-medium text-xs px-2 py-0.5",
                        status.badgeColor
                    )}
                >
                    <StatusIcon className="h-3 w-3 mr-1" />
                    {status.label}
                </Badge>
            </TableCell>

            <TableCell className="text-right">
                <Button
                    size="sm"
                    variant="ghost"
                    className={cn(
                        "opacity-0 group-hover:opacity-100 transition-opacity",
                        isSelected && "opacity-100"
                    )}
                    onClick={(e) => {
                        e.stopPropagation();
                        onSelectOrder(order);
                    }}
                >
                    <Eye className="h-4 w-4" />
                </Button>
            </TableCell>
        </Motion.tr>
    );
});

OrderTableRow.displayName = "OrderTableRow";

const OrderTableView = ({ orders, selectedOrderId, onSelectOrder }) => {
    if (orders.length === 0) {
        return (
            <div className="rounded-lg border p-8 text-center">
                <FileText className="h-12 w-12 mx-auto text-muted-foreground/50 mb-4" />
                <h3 className="text-lg font-semibold mb-2">No orders found</h3>
                <p className="text-sm text-muted-foreground">No orders match your current filters</p>
            </div>
        );
    }

    return (
        <div className="rounded-lg border bg-card overflow-hidden">
            <div className="overflow-x-auto">
                <Table>
                    <TableHeader>
                        <TableRow className="border-b bg-muted/50 hover:bg-transparent">
                            <TableHead className="w-[120px] font-medium">Order ID</TableHead>
                            <TableHead className="font-medium">Customer</TableHead>
                            <TableHead className="font-medium">Type</TableHead>
                            <TableHead className="font-medium text-right">Items</TableHead>
                            <TableHead className="font-medium text-right">Amount</TableHead>
                            <TableHead className="font-medium">Payment</TableHead>
                            <TableHead className="font-medium">Time</TableHead>
                            <TableHead className="font-medium">Status</TableHead>
                            <TableHead className="w-[70px] font-medium text-right">Actions</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {orders.map((order, index) => (
                            <OrderTableRow
                                key={order._id}
                                order={order}
                                index={index}
                                isSelected={selectedOrderId === order._id}
                                onSelectOrder={onSelectOrder}
                            />
                        ))}
                    </TableBody>
                </Table>
            </div>
        </div>
    );
};

export default OrderTableView;