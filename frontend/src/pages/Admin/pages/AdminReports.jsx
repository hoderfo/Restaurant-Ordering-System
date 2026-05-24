import React, { useEffect, useState, useCallback } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
    LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, Cell
} from "recharts";
import useReportStore from "@/store/useReportStore";
import {
    TrendingUp, Users, Package, DollarSign, Calendar, Filter,
    ArrowUpRight, ArrowDownRight, RefreshCcw
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import {
    Table, TableBody, TableCell, TableHead, TableHeader, TableRow
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";

import { Separator } from "@/components/ui/separator";
import { ScrollArea } from "@/components/ui/scroll-area"

const AdminReports = () => {
    const {
        salesData, cashierData, topItemsData, profitLossData,
        isLoading, fetchSalesReports, fetchCashierCollections,
        fetchTopSellingItems, fetchProfitLoss
    } = useReportStore();

    const [filter, setFilter] = useState("daily");

    const loadData = useCallback((f) => {
        fetchSalesReports(f);
        fetchCashierCollections(f);
        fetchTopSellingItems(f);
        fetchProfitLoss(f === "daily" ? "monthly" : f); // P&L usually monthly/weekly
    }, [fetchSalesReports, fetchCashierCollections, fetchTopSellingItems, fetchProfitLoss]);

    useEffect(() => {
        loadData(filter);
    }, [filter, loadData]);

    const COLORS = ["#0088FE", "#00C49F", "#FFBB28", "#FF8042", "#8884d8", "#82ca9d"];

    return (
        <div className="p-6 space-y-6 bg-background min-h-screen">


            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">Financial Reports</h1>
                    <p className="text-muted-foreground">Detailed insights into your business performance.</p>
                </div>
                <div className="flex items-center gap-2 bg-muted p-1 rounded-lg">
                    {["daily", "weekly", "monthly", "yearly"].map((f) => (
                        <button
                            key={f}
                            onClick={() => setFilter(f)}
                            className={`px-4 py-1.5 rounded-md text-sm font-medium transition-all ${filter === f ? "bg-background text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground"
                                }`}
                        >
                            {f.charAt(0).toUpperCase() + f.slice(1)}
                        </button>
                    ))}
                    <Button variant="ghost" size="icon" onClick={() => loadData(filter)} disabled={isLoading}>
                        <RefreshCcw className={`size-4 ${isLoading ? "animate-spin" : ""}`} />
                    </Button>
                </div>
            </div>

            {/* Quick Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <Card className="border-l-4 border-l-blue-500">
                    <CardHeader className="pb-2">
                        <CardDescription className="flex items-center gap-2">
                            <DollarSign className="size-4" /> Total Revenue
                        </CardDescription>
                        <CardTitle className="text-2xl">Rs {profitLossData.totalRevenue?.toLocaleString()}</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="flex items-center text-xs text-blue-500">
                            <ArrowUpRight className="size-3 mr-1" /> 12% from last {filter}
                        </div>
                    </CardContent>
                </Card>
                <Card className="border-l-4 border-l-teal-500">
                    <CardHeader className="pb-2">
                        <CardDescription className="flex items-center gap-2">
                            <TrendingUp className="size-4" /> Net Profit
                        </CardDescription>
                        <CardTitle className="text-2xl">Rs {profitLossData.profit?.toLocaleString()}</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="flex items-center text-xs text-teal-500">
                            <ArrowUpRight className="size-3 mr-1" /> 8.4% margin
                        </div>
                    </CardContent>
                </Card>
                <Card className="border-l-4 border-l-amber-500">
                    <CardHeader className="pb-2">
                        <CardDescription className="flex items-center gap-2">
                            <Calendar className="size-4" /> Total Orders
                        </CardDescription>
                        <CardTitle className="text-2xl">{profitLossData.orderCount}</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="flex items-center text-xs text-amber-500">
                            Processed in this period
                        </div>
                    </CardContent>
                </Card>
                <Card className="border-l-4 border-l-purple-500">
                    <CardHeader className="pb-2">
                        <CardDescription className="flex items-center gap-2">
                            <Package className="size-4" /> Items Sold
                        </CardDescription>
                        <CardTitle className="text-2xl">
                            {topItemsData.reduce((acc, curr) => acc + curr.totalQuantity, 0)}
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="flex items-center text-xs text-purple-500">
                            Across all categories
                        </div>
                    </CardContent>
                </Card>
            </div>

            <Tabs defaultValue="sales" className="space-y-4">
                <TabsList className="bg-muted p-1">
                    <TabsTrigger value="sales" className="data-[state=active]:bg-background">Sales Trends</TabsTrigger>
                    <TabsTrigger value="collections" className="data-[state=active]:bg-background">Collections</TabsTrigger>
                    <TabsTrigger value="items" className="data-[state=active]:bg-background">Top Items</TabsTrigger>
                    <TabsTrigger value="pl" className="data-[state=active]:bg-background">Profit & Loss</TabsTrigger>
                </TabsList>

                <TabsContent value="sales" className="space-y-4">
                    <Card>
                        <CardHeader>
                            <CardTitle>Revenue Overview</CardTitle>
                            <CardDescription>Sales trajectory for the selected period.</CardDescription>
                        </CardHeader>
                        <CardContent className="h-[400px]">
                            <ResponsiveContainer width="100%" height="100%">
                                <LineChart data={salesData} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
                                    <CartesianGrid strokeDasharray="3 3" vertical={false} opacity={0.3} />
                                    <XAxis dataKey="_id" stroke="#888888" fontSize={12} tickLine={false} axisLine={false} />
                                    <YAxis stroke="#888888" fontSize={12} tickLine={false} axisLine={false} tickFormatter={(value) => `Rs ${value}`} />
                                    <Tooltip
                                        contentStyle={{ backgroundColor: "hsl(var(--background))", borderColor: "hsl(var(--border))" }}
                                        labelStyle={{ color: "hsl(var(--foreground))" }}
                                    />
                                    <Legend />
                                    <Line type="monotone" dataKey="totalSales" name="Revenue" stroke="#0d9488" strokeWidth={3} dot={{ r: 4, fill: "#0d9488" }} activeDot={{ r: 6 }} />
                                    <Line type="monotone" dataKey="orderCount" name="Orders" stroke="#ca8a04" strokeWidth={2} dot={{ r: 4, fill: "#ca8a04" }} />
                                </LineChart>
                            </ResponsiveContainer>
                        </CardContent>
                    </Card>
                </TabsContent>

                <TabsContent value="collections" className="space-y-4">
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                        <Card>
                            <CardHeader>
                                <CardTitle>Cashier Performance</CardTitle>
                                <CardDescription>Collection breakdown by staff members.</CardDescription>
                            </CardHeader>
                            <CardContent className="h-[350px]">
                                <ResponsiveContainer width="100%" height="100%">
                                    <BarChart data={cashierData}>
                                        <CartesianGrid strokeDasharray="3 3" vertical={false} opacity={0.3} />
                                        <XAxis dataKey="cashierName" stroke="#888888" fontSize={12} tickLine={false} axisLine={false} />
                                        <YAxis stroke="#888888" fontSize={12} tickLine={false} axisLine={false} />
                                        <Tooltip />
                                        <Bar dataKey="totalCollected" name="Collected" radius={[4, 4, 0, 0]}>
                                            {cashierData.map((entry, index) => (
                                                <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                            ))}
                                        </Bar>
                                    </BarChart>
                                </ResponsiveContainer>
                            </CardContent>
                        </Card>

                        <Card>
                            <CardHeader>
                                <CardTitle>Collection Summary</CardTitle>
                                <CardDescription>Total amounts handled by each cashier.</CardDescription>
                            </CardHeader>
                            <CardContent>
                                <Table>
                                    <TableHeader>
                                        <TableRow>
                                            <TableHead>Cashier</TableHead>
                                            <TableHead className="text-right">Orders</TableHead>
                                            <TableHead className="text-right">Total</TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {cashierData.map((cashier) => (
                                            <TableRow key={cashier._id}>
                                                <TableCell className="font-medium">{cashier.cashierName}</TableCell>
                                                <TableCell className="text-right">{cashier.orderCount}</TableCell>
                                                <TableCell className="text-right font-bold">Rs {cashier.totalCollected?.toLocaleString()}</TableCell>
                                            </TableRow>
                                        ))}
                                    </TableBody>
                                </Table>
                            </CardContent>
                        </Card>
                    </div>
                </TabsContent>

                <TabsContent value="items" className="space-y-4">
                    <Card>
                        <CardHeader>
                            <div className="flex justify-between items-center">
                                <div>
                                    <CardTitle>Top Selling Items</CardTitle>
                                    <CardDescription>Performance of individual menu items.</CardDescription>
                                </div>
                                <Badge variant="outline">Most Popular</Badge>
                            </div>
                        </CardHeader>
                        <CardContent>
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead>Item Name</TableHead>
                                        <TableHead className="text-right">Quantity Sold</TableHead>
                                        <TableHead className="text-right">Total Revenue</TableHead>
                                        <TableHead className="text-right">Action</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {topItemsData.map((item) => (
                                        <TableRow key={item._id}>
                                            <TableCell className="font-medium">{item.name}</TableCell>
                                            <TableCell className="text-right">{item.totalQuantity}</TableCell>
                                            <TableCell className="text-right">Rs {item.totalRevenue?.toLocaleString()}</TableCell>
                                            <TableCell className="text-right">
                                                <Button variant="ghost" size="sm" className="h-8">View Details</Button>
                                            </TableCell>
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>
                        </CardContent>
                    </Card>
                </TabsContent>

                <TabsContent value="pl" className="space-y-4">
                    <Card>
                        <CardHeader>
                            <CardTitle>Profit & Loss Statement</CardTitle>
                            <CardDescription>Condensed financial summary for the period.</CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-6">
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                                <div className="space-y-2">
                                    <p className="text-sm font-medium text-muted-foreground uppercase tracking-wider">Revenue</p>
                                    <p className="text-4xl font-bold text-teal-600">Rs {profitLossData.totalRevenue?.toLocaleString()}</p>
                                    <p className="text-xs text-muted-foreground">Total money coming in</p>
                                </div>
                                <div className="space-y-2">
                                    <p className="text-sm font-medium text-muted-foreground uppercase tracking-wider">Cost of Goods Sold (COGS)</p>
                                    <p className="text-4xl font-bold text-rose-600">-Rs {profitLossData.totalCost?.toLocaleString()}</p>
                                    <p className="text-xs text-muted-foreground">Based on item cost prices</p>
                                </div>
                                <div className="space-y-2">
                                    <p className="text-sm font-medium text-muted-foreground uppercase tracking-wider">Gross Profit</p>
                                    <p className={`text-4xl font-bold ${profitLossData.profit >= 0 ? "text-blue-600" : "text-red-600"}`}>
                                        Rs {profitLossData.profit?.toLocaleString()}
                                    </p>
                                    <p className="text-xs text-muted-foreground">Revenue minus Cost</p>
                                </div>
                            </div>

                            <Separator />

                            <div className="rounded-xl overflow-hidden border">
                                <div className="p-4 bg-muted/50 flex justify-between items-center">
                                    <span className="font-semibold">Financial Breakdown</span>
                                    <Badge>Estimated</Badge>
                                </div>
                                <div className="p-4 space-y-4">
                                    <div className="flex justify-between items-center py-2 border-b border-dashed">
                                        <span className="text-muted-foreground">Total Sales (Orders)</span>
                                        <span className="font-medium">{profitLossData.orderCount}</span>
                                    </div>
                                    <div className="flex justify-between items-center py-2 border-b border-dashed">
                                        <span className="text-muted-foreground">Average Order Value</span>
                                        <span className="font-medium">
                                            Rs {profitLossData.orderCount > 0
                                                ? (profitLossData.totalRevenue / profitLossData.orderCount).toFixed(2)
                                                : "0.00"}
                                        </span>
                                    </div>
                                    <div className="flex justify-between items-center py-2">
                                        <span className="text-muted-foreground">Profit Margin %</span>
                                        <span className="font-medium">
                                            {profitLossData.totalRevenue > 0
                                                ? ((profitLossData.profit / profitLossData.totalRevenue) * 100).toFixed(1)
                                                : "0"}%
                                        </span>
                                    </div>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                </TabsContent>
            </Tabs>

        </div>
    );
};

export default AdminReports;
