import React, { useEffect } from 'react'
import {
    Card,
    CardContent,
    CardDescription,
    CardFooter,
    CardHeader,
    CardTitle,
} from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import {
    TrendingUp,
    TrendingDown,
    ShoppingBag,
    DollarSign,
    Users,
    Package,
    Clock,
    BarChart3,
    PieChart as PieChartIcon,
    Activity,
    Loader2
} from 'lucide-react'
import { PieChartDashboard } from '../components/PieChartDashboard'
import { ChartRadarDotsDashboard } from '../components/ChartRadarDotsDashboard'
import OrderTable from '../components/OrderTable'
import { useOrderStore } from '@/store/useOrderStore'
import { useNavigate } from 'react-router-dom'

const DashboardHome = () => {
    const { stats, recentOrders, getStats, isLoading } = useOrderStore();
    const navigate = useNavigate();

    useEffect(() => {
        getStats();
    }, [getStats]);

    // POS dashboard stats mapping
    const statCards = [
        {
            title: "Total Revenue",
            value: `Rs ${stats?.totalRevenue?.toLocaleString() || '0'}`,
            change: "+12.5%", // These could be calculated if we had historical data
            isPositive: true,
            icon: <DollarSign className="h-5 w-5" />,
            period: "All Time",
            color: "bg-primary/10 text-primary",
            css: "bg-primary/10 text-primary border border-primary/20"
        },
        {
            title: "Total Orders",
            value: stats?.totalOrders || '0',
            change: "+8.2%",
            isPositive: true,
            icon: <ShoppingBag className="h-5 w-5" />,
            period: "Cumulative",
            color: "bg-primary/10 text-primary",
            css: "bg-primary/10 text-primary border border-primary/20"
        },
        {
            title: "Average Order Value",
            value: `Rs ${Math.round(stats?.avgOrderValue || 0).toLocaleString()}`,
            change: "+5.3%",
            isPositive: true,
            icon: <BarChart3 className="h-5 w-5" />,
            period: "Per Order",
            color: "bg-primary/10 text-primary",
            css: "bg-primary/10 text-primary border border-primary/20"
        },
        {
            title: "Pending Orders",
            value: stats?.pendingOrders || '0',
            change: "-3.2%",
            isPositive: false,
            icon: <Clock className="h-5 w-5" />,
            period: "Action Required",
            color: "bg-orange-500/10 text-orange-700",
            css: "bg-orange-500/10 text-orange-700 border border-orange-500"
        }
    ];

    const quickActions = [
        { title: "New Sale", icon: <ShoppingBag className="h-4 w-4" />, color: "bg-transparent border border-teal-500", path: "/dashboard/order" },
        { title: "Manage Menu", icon: <Package className="h-4 w-4" />, color: "bg-transparent border border-teal-500", path: "/dashboard/items" },
        { title: "Tables", icon: <Activity className="h-4 w-4" />, color: "bg-transparent border border-teal-500", path: "/dashboard/tables" },
        { title: "Customers", icon: <Users className="h-4 w-4" />, color: "bg-transparent border border-teal-500", path: "/dashboard/clients" }
    ];

    if (isLoading && !stats) {
        return (
            <div className="flex h-screen items-center justify-center">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
        );
    }

    return (
        <div className="w-full min-h-screen bg-gray-50 dark:bg-gray-900 p-4 md:p-6">
            {/* Quick Actions */}
            <div className="mb-6">
                <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Quick Actions</h2>
                <div className="flex gap-3 px-4 overflow-x-auto scrollbar-hide">
                    {quickActions.map((action, index) => (
                        <button
                            key={index}
                            onClick={() => navigate(action.path)}
                            className={`${action.color} text-primary dark:text-white rounded-full px-6 py-4 flex items-center justify-center gap-2 hover:bg-accent hover:text-accent-foreground shadow-sm transition-all duration-300 active:scale-95`}
                        >
                            {action.icon}
                            <span className="font-medium text-sm whitespace-nowrap">{action.title}</span>
                        </button>
                    ))}
                </div>
            </div>

            {/* Stats Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
                {statCards.map((stat, index) => (
                    <Card key={index} className={`${stat.css} shadow-sm hover:shadow-md transition-shadow`}>
                        <CardHeader className="pb-2">
                            <div className="flex items-center justify-between">
                                <CardTitle className="text-sm font-medium text-gray-600 dark:text-gray-400">
                                    {stat.title}
                                </CardTitle>
                                <div className={`p-2 rounded-full ${stat.color.split(' ')[0]}`}>
                                    {stat.icon}
                                </div>
                            </div>
                        </CardHeader>
                        <CardContent className="pb-2">
                            <div className="flex items-end justify-between">
                                <div>
                                    <h3 className="text-2xl font-bold text-gray-900 dark:text-white">
                                        {stat.value}
                                    </h3>
                                    <div className="flex items-center gap-2 mt-2">
                                        <Badge
                                            variant="outline"
                                            className={`flex items-center gap-1 border-none ${stat.isPositive ? 'bg-green-500/10 text-green-600' : 'bg-red-500/10 text-red-600'}`}
                                        >
                                            {stat.isPositive ? (
                                                <TrendingUp className="h-3 w-3" />
                                            ) : (
                                                <TrendingDown className="h-3 w-3" />
                                            )}
                                            {stat.change}
                                        </Badge>
                                    </div>
                                </div>
                            </div>
                        </CardContent>
                        <CardFooter className="pt-0">
                            <p className="text-xs text-gray-500 dark:text-gray-400">
                                {stat.period}
                            </p>
                        </CardFooter>
                    </Card>
                ))}
            </div>

            {/* Recent Orders Table */}
            <div>
                <OrderTable orders={recentOrders} />
            </div>

            {/* Charts Section */}
            <div className="mt-8">
                <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Insights</h2>
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 pb-6">
                    <Card className="border border-gray-200 dark:border-gray-800 shadow-sm">
                        <CardHeader className="pb-4">
                            <div className="flex items-center gap-2">
                                <PieChartIcon className="h-5 w-5 text-gray-600 dark:text-gray-400" />
                                <CardTitle className="text-lg font-semibold">Sales by Category</CardTitle>
                            </div>
                        </CardHeader>
                        <CardContent>
                            <div className="h-[300px]">
                                <PieChartDashboard />
                            </div>
                        </CardContent>
                    </Card>

                    <Card className="border border-gray-200 dark:border-gray-800 shadow-sm">
                        <CardHeader className="pb-4">
                            <div className="flex items-center gap-2">
                                <Activity className="h-5 w-5 text-gray-600 dark:text-gray-400" />
                                <CardTitle className="text-lg font-semibold">Performance Metrics</CardTitle>
                            </div>
                        </CardHeader>
                        <CardContent>
                            <div className="h-[300px]">
                                <ChartRadarDotsDashboard />
                            </div>
                        </CardContent>
                    </Card>
                </div>
            </div>
        </div>
    )
}

export default DashboardHome