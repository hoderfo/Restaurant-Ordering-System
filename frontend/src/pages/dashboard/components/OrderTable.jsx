import React from 'react';
import {
    Table,
    TableBody,
    TableCaption,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
    MoreVertical,
    Eye,
    CheckCircle,
    XCircle,
    Clock,
    TrendingUp,
    ShoppingCart,
    User,
    CreditCard,
    DollarSign,
    Package,
    Download,
    Printer
} from 'lucide-react';

const OrderTable = ({ orders = [] }) => {
    // Status badge configuration
    const getStatusConfig = (status) => {
        switch (status?.toLowerCase()) {
            case 'completed':
                return {
                    label: 'Completed',
                    icon: CheckCircle,
                    variant: 'default',
                    className: 'bg-green-100 text-green-800 hover:bg-green-100 dark:bg-green-900/30 dark:text-green-400'
                };
            case 'pending':
                return {
                    label: 'Pending',
                    icon: Clock,
                    variant: 'secondary',
                    className: 'bg-amber-100 text-amber-800 hover:bg-amber-100 dark:bg-amber-900/30 dark:text-amber-400'
                };
            case 'cancelled':
                return {
                    label: 'Cancelled',
                    icon: XCircle,
                    variant: 'destructive',
                    className: 'bg-red-100 text-red-800 hover:bg-red-100 dark:bg-red-900/30 dark:text-red-400'
                };
            default:
                return {
                    label: status || 'Pending',
                    icon: Clock,
                    variant: 'outline',
                    className: 'bg-gray-100 text-gray-800'
                };
        }
    };

    // Payment method configuration
    const getMethodConfig = (method) => {
        switch (method) {
            case 'Card':
                return {
                    icon: CreditCard,
                    className: 'text-blue-600'
                };
            case 'Online':
                return {
                    icon: DollarSign,
                    className: 'text-purple-600'
                };
            case 'Cash':
                return {
                    icon: DollarSign,
                    className: 'text-green-600'
                };
            default:
                return {
                    icon: CreditCard,
                    className: 'text-gray-600'
                };
        }
    };

    // Format date
    const formatDate = (dateString) => {
        if (!dateString) return 'N/A';
        const date = new Date(dateString);
        return date.toLocaleDateString('en-US', {
            month: 'short',
            day: 'numeric',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
    };

    return (
        <div className="w-full bg-card rounded-lg border p-6 shadow-sm">
            {/* Header */}
            <div className="flex items-center justify-between mb-6">
                <div>
                    <h2 className="text-2xl font-bold tracking-tight">Recent Orders</h2>
                    <p className="text-sm text-muted-foreground">
                        Latest transactions across all order types
                    </p>
                </div>
                <div className="flex gap-2">
                    <Button variant="outline" size="sm" className="gap-2">
                        <Download className="h-4 w-4" />
                        Export
                    </Button>
                </div>
            </div>

            {/* Table */}
            <div className="rounded-md border overflow-hidden">
                <Table>
                    <TableHeader className="bg-gray-50 dark:bg-gray-800/50">
                        <TableRow>
                            <TableHead className="w-[150px]">Order ID</TableHead>
                            <TableHead>Customer</TableHead>
                            <TableHead>Type</TableHead>
                            <TableHead>Date</TableHead>
                            <TableHead>Status</TableHead>
                            <TableHead>Payment</TableHead>
                            <TableHead className="text-right">Amount</TableHead>
                            <TableHead className="w-[80px]">Actions</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {orders.length === 0 ? (
                            <TableRow>
                                <TableCell colSpan={8} className="text-center py-10 text-muted-foreground">
                                    No orders found.
                                </TableCell>
                            </TableRow>
                        ) : (
                            orders.map((order) => {
                                const statusConfig = getStatusConfig(order.status);
                                const methodConfig = getMethodConfig(order.paymentMethod);
                                const StatusIcon = statusConfig.icon;
                                const MethodIcon = methodConfig.icon;

                                return (
                                    <TableRow key={order._id} className="hover:bg-muted/50 transition-colors">
                                        <TableCell className="font-medium">
                                            <div className="flex items-center gap-2">
                                                <ShoppingCart className="h-4 w-4 text-primary" />
                                                <span className="text-xs font-mono">{order.orderId}</span>
                                            </div>
                                        </TableCell>
                                        <TableCell>
                                            <div>
                                                <div className="font-medium">{order.clientName || order.client?.name || 'Guest'}</div>
                                                <div className="text-xs text-muted-foreground">{order.clientPhone || order.client?.phone || 'No phone'}</div>
                                            </div>
                                        </TableCell>
                                        <TableCell>
                                            <Badge variant="outline" className="font-normal capitalize">
                                                {order.type}
                                            </Badge>
                                        </TableCell>
                                        <TableCell className="text-xs">
                                            {formatDate(order.createdAt)}
                                        </TableCell>
                                        <TableCell>
                                            <Badge
                                                variant="outline"
                                                className={`inline-flex items-center gap-1 ${statusConfig.className}`}
                                            >
                                                <StatusIcon className="h-3 w-3" />
                                                {statusConfig.label}
                                            </Badge>
                                        </TableCell>
                                        <TableCell>
                                            <div className="flex items-center gap-2 text-xs">
                                                <MethodIcon className={`h-4 w-4 ${methodConfig.className}`} />
                                                <span>{order.paymentMethod}</span>
                                            </div>
                                        </TableCell>
                                        <TableCell className="text-right font-bold text-primary">
                                            Rs {order.totalAmount?.toLocaleString()}
                                        </TableCell>
                                        <TableCell>
                                            <DropdownMenu>
                                                <DropdownMenuTrigger asChild>
                                                    <Button variant="ghost" size="icon">
                                                        <MoreVertical className="h-4 w-4" />
                                                    </Button>
                                                </DropdownMenuTrigger>
                                                <DropdownMenuContent align="end">
                                                    <DropdownMenuLabel>Actions</DropdownMenuLabel>
                                                    <DropdownMenuSeparator />
                                                    <DropdownMenuItem className="gap-2">
                                                        <Eye className="h-4 w-4" />
                                                        View Receipt
                                                    </DropdownMenuItem>
                                                    <DropdownMenuItem className="gap-2 text-destructive">
                                                        <XCircle className="h-4 w-4" />
                                                        Cancel Order
                                                    </DropdownMenuItem>
                                                </DropdownMenuContent>
                                            </DropdownMenu>
                                        </TableCell>
                                    </TableRow>
                                );
                            })
                        )}
                    </TableBody>
                </Table>
            </div>

            {/* Footer */}
            <div className="flex items-center justify-between mt-6 pt-6 border-t text-sm text-muted-foreground">
                <div>
                    Showing {orders.length} latest orders
                </div>
            </div>
        </div>
    );
};

export default OrderTable;