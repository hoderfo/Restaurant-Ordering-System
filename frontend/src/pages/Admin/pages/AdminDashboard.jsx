import React, { useEffect } from "react";
import {
    TrendingUp, ShoppingBag, Users, Package,
    ArrowUpRight, ArrowDownRight, Clock, ChevronRight,
    Utensils, AlertTriangle, UserCheck, CalendarDays,
    LayoutDashboard, Activity
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import useDashboardStore from "@/store/useDashboardStore";
import { format } from "date-fns";
import { cn } from "@/lib/utils";
import StatCard from "../Components/StatCard";
import {
    PieChart, Pie, Cell, ResponsiveContainer, Tooltip
} from "recharts";

const AdminDashboard = () => {
    const { dashboardData, isLoading, fetchDashboardSummary } = useDashboardStore();

    useEffect(() => {
        fetchDashboardSummary();
        const interval = setInterval(fetchDashboardSummary, 30000); // Auto-refresh every 30s
        return () => clearInterval(interval);
    }, [fetchDashboardSummary]);

    if (!dashboardData && isLoading) {
        return (
            <div className="p-8 space-y-8 bg-background/50 h-full">
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                    <div className="space-y-2">
                        <Skeleton className="h-10 w-48" />
                        <Skeleton className="h-4 w-64" />
                    </div>
                    <Skeleton className="h-8 w-32" />
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                    {[1, 2, 3, 4].map((i) => (
                        <Skeleton key={i} className="h-32 w-full rounded-2xl" />
                    ))}
                </div>
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    <Skeleton className="h-[400px] rounded-2xl" />
                    <Skeleton className="lg:col-span-2 h-[400px] rounded-2xl" />
                </div>
            </div>
        );
    }

    const { summary, lowStockItems, recentOrders, recentClients } = dashboardData || {};

    const COLORS = ["var(--primary)", "#fbbf24", "#f43f5e", "#64748b"];
    const pieData = summary ? [
        { name: "Occupied", value: summary.occupancy.occupied },
        { name: "Reserved", value: summary.occupancy.reserved },
        { name: "Available", value: summary.occupancy.available }
    ] : [];

    return (
        <div className="p-6 md:p-8 space-y-8 bg-background min-h-full">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div className="space-y-0.5">
                    <h1 className="text-3xl font-bold tracking-tight">Dashboard Overview</h1>
                    <p className="text-sm text-muted-foreground">Monitor your restaurant's performance and operations.</p>
                </div>
                <div className="flex items-center gap-3">
                    <div className="hidden md:flex -space-x-2">
                        {[1, 2, 3].map((i) => (
                            <div key={i} className="size-8 rounded-full border-2 border-background bg-muted flex items-center justify-center text-[10px] font-medium text-muted-foreground">
                                {String.fromCharCode(64 + i)}
                            </div>
                        ))}
                    </div>
                    <Badge variant="outline" className="flex items-center gap-2 py-1.5 px-3 bg-background border-border">
                        <span className="relative flex h-2 w-2">
                            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                            <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                        </span>
                        <span className="font-medium text-xs">Live System</span>
                    </Badge>
                </div>
            </div>

            {/* Top Row Stas */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <StatCard
                    label="Today's Revenue"
                    value={`Rs ${summary?.todayRevenue?.toLocaleString()}`}
                    sub="Gross Earnings"
                    icon={TrendingUp}
                    trend="+12.5%"
                    trendUp={true}
                    color="teal"
                />
                <StatCard
                    label="Total Orders"
                    value={summary?.todayOrders}
                    sub="Completed Transactions"
                    icon={ShoppingBag}
                    trend="+4"
                    trendUp={true}
                    color="amber"
                />
                <StatCard
                    label="Active Staff"
                    value={summary?.activeStaff}
                    sub="On-duty Members"
                    icon={UserCheck}
                    color="indigo"
                />
                <StatCard
                    label="Low Stock Alerts"
                    value={summary?.lowStockCount}
                    sub="Requires Attention"
                    icon={AlertTriangle}
                    trend={summary?.lowStockCount > 0 ? "Critical" : "Stable"}
                    trendUp={false}
                    color={summary?.lowStockCount > 0 ? "rose" : "emerald"}
                />
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Occupancy Chart */}
                <Card className="lg:col-span-1 shadow-sm border border-border">
                    <CardHeader className="pb-4">
                        <CardTitle className="text-lg font-semibold flex items-center gap-2">
                            <Utensils className="size-4 text-muted-foreground" /> Dining Status
                        </CardTitle>
                        <CardDescription className="text-xs">Real-time table distribution.</CardDescription>
                    </CardHeader>
                    <CardContent className="h-[300px] flex flex-col items-center justify-center">
                        <div className="relative w-full h-full">
                            <ResponsiveContainer width="100%" height="100%">
                                <PieChart>
                                    <Pie
                                        data={pieData}
                                        innerRadius={60}
                                        outerRadius={80}
                                        paddingAngle={5}
                                        dataKey="value"
                                        stroke="transparent"
                                    >
                                        {pieData.map((entry, index) => (
                                            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                        ))}
                                    </Pie>
                                    <Tooltip 
                                        contentStyle={{ 
                                            backgroundColor: 'white', 
                                            border: '1px solid #e1e1e1', 
                                            borderRadius: '8px',
                                            fontSize: '12px'
                                        }}
                                    />
                                </PieChart>
                            </ResponsiveContainer>
                            <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                                <span className="text-2xl font-bold">{summary?.occupancy?.total || 0}</span>
                                <span className="text-[10px] text-muted-foreground uppercase">Tables</span>
                            </div>
                        </div>
                        <div className="grid grid-cols-2 gap-4 w-full px-2">
                            {pieData.map((d, i) => (
                                <div key={i} className="flex items-center gap-2 text-xs">
                                    <div className="size-2 rounded-full" style={{ backgroundColor: COLORS[i] }} />
                                    <span className="text-muted-foreground">{d.name}:</span>
                                    <span className="font-semibold">{d.value}</span>
                                </div>
                            ))}
                        </div>
                    </CardContent>
                </Card>

                {/* Recent Orders Activity Feed */}
                <Card className="lg:col-span-2 shadow-sm border border-border overflow-hidden">
                    <CardHeader className="flex flex-row items-center justify-between border-b bg-muted/30 pb-4">
                        <div className="space-y-1">
                            <CardTitle className="text-lg font-semibold flex items-center gap-2">
                                <Activity className="size-4 text-muted-foreground" /> Recent Operations
                            </CardTitle>
                        </div>
                        <Button variant="ghost" size="sm" className="text-xs text-muted-foreground hover:text-foreground">
                            View All <ChevronRight className="size-3 ml-1" />
                        </Button>
                    </CardHeader>
                    <CardContent className="p-0">
                        <ScrollArea className="h-[400px]">
                            <div className="divide-y divide-border">
                                {recentOrders?.length > 0 ? (
                                    recentOrders.map((order) => (
                                        <div 
                                            key={order._id} 
                                            className="flex items-center justify-between p-4 hover:bg-muted/30 transition-colors"
                                        >
                                            <div className="flex items-center gap-4">
                                                <div className="size-10 bg-muted rounded-md flex items-center justify-center border border-border">
                                                    <ShoppingBag className="size-5 text-muted-foreground" />
                                                </div>
                                                <div className="space-y-0.5">
                                                    <div className="flex items-center gap-2">
                                                        <span className="font-semibold text-sm">{order.orderId}</span>
                                                        <Badge variant="outline" className="text-[10px] py-0 px-1 font-medium bg-muted/50 border-border">
                                                            {order.orderType || "Dine-in"}
                                                        </Badge>
                                                    </div>
                                                    <div className="text-xs text-muted-foreground">
                                                        <span>{order.client?.name || "Walk-in"}</span> • <span>{format(new Date(order.createdAt), "hh:mm a")}</span>
                                                    </div>
                                                </div>
                                            </div>
                                            <div className="text-right flex flex-col items-end gap-1">
                                                <span className="font-bold text-sm">Rs {order.totalAmount.toLocaleString()}</span>
                                                <Badge 
                                                    className={cn(
                                                        "text-[9px] font-semibold py-0 transition-none",
                                                        order.status === "Completed" ? "bg-emerald-50 text-emerald-700 border-emerald-200" : 
                                                        order.status === "Pending" ? "bg-amber-50 text-amber-700 border-amber-200" : 
                                                        "bg-primary/10 text-primary border-primary/20"
                                                    )}
                                                    variant="outline"
                                                >
                                                    {order.status}
                                                </Badge>
                                            </div>
                                        </div>
                                    ))
                                ) : (
                                    <div className="h-[300px] flex flex-col items-center justify-center text-muted-foreground">
                                        <Package className="size-8 mb-2 opacity-50" />
                                        <p className="text-sm">No recent activity</p>
                                    </div>
                                )}
                            </div>
                        </ScrollArea>
                    </CardContent>
                </Card>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Low Stock Alerts */}
                <Card className="shadow-sm border border-border">
                    <CardHeader className="pb-4">
                        <CardTitle className="text-lg font-semibold flex items-center gap-2">
                            <AlertTriangle className="size-4 text-muted-foreground" /> Inventory Warnings
                        </CardTitle>
                        <CardDescription className="text-xs">Items below critical level.</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <div className="space-y-3">
                            {lowStockItems?.length > 0 ? (
                                lowStockItems.map((item) => (
                                    <div key={item._id} className="flex items-center justify-between p-3 bg-muted/20 border border-border rounded-md hover:bg-muted/40 transition-colors">
                                        <div className="flex items-center gap-3">
                                            <div className="size-8 bg-background border border-border rounded flex items-center justify-center">
                                                <Package className="size-4 text-muted-foreground" />
                                            </div>
                                            <div className="space-y-0.5">
                                                <p className="text-sm font-semibold">{item.name}</p>
                                                <p className="text-[10px] text-muted-foreground uppercase">{item.category}</p>
                                            </div>
                                        </div>
                                        <div className="text-right">
                                            <p className="text-sm font-bold text-rose-600">{item.quantity} {item.unit}</p>
                                            <p className="text-[10px] text-muted-foreground uppercase opacity-70">Limit: {item.reorderLevel}</p>
                                        </div>
                                    </div>
                                ))
                            ) : (
                                <div className="py-8 text-center text-muted-foreground text-sm">
                                    Inventory levels are stable
                                </div>
                            )}
                            <Button variant="outline" className="w-full mt-2 text-xs font-semibold uppercase tracking-wide">
                                Open Inventory
                            </Button>
                        </div>
                    </CardContent>
                </Card>

                {/* New Customers */}
                <Card className="shadow-sm border border-border">
                    <CardHeader className="pb-4">
                        <CardTitle className="text-lg font-semibold flex items-center gap-2">
                            <Users className="size-4 text-muted-foreground" /> Recently Registered
                        </CardTitle>
                        <CardDescription className="text-xs">Newest additions to community.</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <ScrollArea className="h-[280px]">
                            <div className="space-y-3 pr-4">
                                {recentClients?.length > 0 ? (
                                    recentClients.map((client) => (
                                        <div key={client._id} className="flex items-center justify-between p-3 bg-muted/20 border border-border rounded-md hover:bg-muted/40 transition-colors">
                                            <div className="flex items-center gap-3">
                                                <div className="size-10 bg-primary/5 text-primary border border-primary/10 rounded-md flex items-center justify-center font-bold text-sm uppercase">
                                                    {client.name.charAt(0)}
                                                </div>
                                                <div className="space-y-0.5">
                                                    <p className="text-sm font-semibold">{client.name}</p>
                                                    <p className="text-[10px] text-muted-foreground font-medium uppercase">{format(new Date(client.createdAt), "MMM d, yyyy")}</p>
                                                </div>
                                            </div>
                                            <div className="text-right">
                                                <p className="text-sm font-bold">Rs {client.totalSpent.toLocaleString()}</p>
                                                <p className="text-[10px] text-muted-foreground uppercase tracking-tight opacity-70">Total Spent</p>
                                            </div>
                                        </div>
                                    ))
                                ) : (
                                    <div className="py-8 text-center text-muted-foreground text-sm">
                                        No recent registrations
                                    </div>
                                )}
                            </div>
                        </ScrollArea>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
};
export default AdminDashboard;

