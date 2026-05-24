import React, { useState } from 'react'
import {
    BadgeQuestionMark,
    BringToFront,
    Grid2x2Check,
    Hamburger,
    LayoutDashboard,
    LogOut,
    Settings,
    UserRoundCog,
    Users,
    ChevronLeft,
    ChevronRight,
    Package,
    ChefHat,
    UserCog,
    HelpCircle,
    Bell,
    ShoppingCart,
    TrendingUp,
} from 'lucide-react'
import { Link, useLocation } from 'react-router-dom'
import { cn } from '@/lib/utils'
import { useAuthStore } from '@/store/useAuthStore'

const AdminSidebar = () => {

    const { logout } = useAuthStore()
    const location = useLocation()


    const [collapsed, setCollapsed] = useState(false)

    const menuItems = [
        { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard, badge: 0, link: '/admin' },
        { id: 'menu', label: 'Menu', icon: ShoppingCart, badge: 3, link: '/admin/menu' },
        { id: 'tables', label: 'Manage Tables', icon: Grid2x2Check, badge: 0, link: '/admin/tables' },
        // { id: 'dishes', label: 'Manage Dishes', icon: Hamburger, badge: 12, link: '/admin/dishes' },
        { id: 'inventory', label: 'Inventory', icon: Package, badge: 5, link: '/admin/inventory' },
        { id: 'staff', label: 'Staff Management', icon: ChefHat, badge: 0, link: '/admin/staff' },
        // { id: 'users', label: 'Manage Users', icon: UserRoundCog, badge: 0, link: '/admin/users' },
        // { id: 'customers', label: 'Customers', icon: Users, badge: 0, link: '/admin/customers' },
        { id: 'customer-history', label: 'Customer History', icon: Users, badge: 0, link: '/admin/customer-history' },
        { id: 'reports', label: 'Reports', icon: TrendingUp, badge: 0, link: '/admin/reports' },
        { id: 'pos-terminal', label: 'POS Terminal', icon: BringToFront, badge: 0, link: '/orders' },
    ]

    const bottomItems = [
        { id: 'settings', label: 'Settings', icon: Settings, link: '/settings' },
        { id: 'help', label: 'Help Center', icon: HelpCircle, link: '/help' },
    ]

    return (
        <aside className={cn(
            "flex flex-col h-full bg-background border-r transition-all duration-300",
            collapsed ? "w-20" : "w-64"
        )}>
            {/* Header */}
            <div className="p-6 border-b">
                <div className={cn(
                    "flex items-center justify-between",
                    collapsed && "justify-center"
                )}>
                    {!collapsed && (
                        <div className="flex items-center gap-3">
                            <div className="size-9 bg-primary rounded-lg flex items-center justify-center shadow-lg transition-transform hover:rotate-6">
                                <Hamburger className="size-5 text-primary-foreground" />
                            </div>
                            <div>
                                <h1 className="font-bold text-lg leading-tight">Tasty <span className="font-normal text-muted-foreground">Station</span></h1>
                                <p className="text-xs text-muted-foreground">Admin Panel</p>
                            </div>
                        </div>
                    )}
                    {collapsed && (
                        <div className="size-10 bg-primary rounded-lg flex items-center justify-center shadow-md">
                            <Hamburger className="size-5 text-primary-foreground" />
                        </div>
                    )}
                    <button
                        onClick={() => setCollapsed(!collapsed)}
                        className="p-2 hover:bg-muted rounded-lg transition-colors"
                        aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
                    >
                        {collapsed ? (
                            <ChevronRight className="size-4" />
                        ) : (
                            <ChevronLeft className="size-4" />
                        )}
                    </button>
                </div>
            </div>

            {/* Main Navigation */}
            <nav className="flex-1 p-4  overflow-y-auto">
                <div className="space-y-2">
                    {menuItems.map((item) => {
                        const Icon = item.icon
                        const isActive = location.pathname === item.link || 
                                       (item.link === '/admin' && location.pathname === '/admin/')

                        return (
                            <Link key={item.id} to={item.link} className=''>
                                <div
                                    className={cn(
                                        "w-full flex items-center gap-4 px-3 py-2.5 rounded-lg transition-all duration-200 group cursor-pointer",
                                        "hover:bg-muted hover:text-foreground",
                                        isActive
                                            ? " text-primary  border border-primary/50 shadow-sm transition-all"
                                            : "text-muted-foreground",

                                    )}
                                >
                                    <div className="relative">
                                        <Icon className={cn(
                                            "size-5 transition-transform",
                                            isActive && "text-primary",
                                            collapsed && "mx-auto"
                                        )} />
                                        {item.badge > 0 && (
                                            <span className={cn(
                                                "absolute -top-1.5 -right-1.5 size-5 rounded-full text-xs font-medium flex items-center justify-center",
                                                "bg-primary text-primary-foreground shadow-sm"
                                            )}>
                                                {item.badge}
                                            </span>
                                        )}
                                    </div>
                                    {!collapsed && (
                                        <>
                                            <span className="font-medium flex-1 text-left">{item.label}</span>
                                            {isActive && (
                                                <div className="size-1.5 rounded-full bg-primary/50 animate-pulse" />
                                            )}
                                        </>
                                    )}
                                </div>
                            </Link>
                        )
                    })}
                </div>
            </nav>

            {/* Bottom Section */}
            <div className="p-4 space-y-1">
                {bottomItems.map((item) => {
                    const Icon = item.icon
                    const isActive = location.pathname === item.link

                    return (
                        <Link key={item.id} to={item.link}>
                            <div
                                className={cn(
                                    "w-full flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all duration-200 cursor-pointer",
                                    "hover:bg-muted hover:text-foreground",
                                    isActive
                                        ? "bg-muted text-foreground"
                                        : "text-muted-foreground"
                                )}
                            >
                                <Icon className={cn(
                                    "size-5",
                                    collapsed && "mx-auto"
                                )} />
                                {!collapsed && (
                                    <span className="font-medium">{item.label}</span>
                                )}
                            </div>
                        </Link>
                    )
                })}



                {/* Logout Button */}
                <button
                    onClick={logout}
                    className={cn(
                        "w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-red-500 hover:bg-red-500/10 hover:text-red-600 transition-colors",
                        collapsed && "justify-center"
                    )}
                >
                    <LogOut className="size-5" />
                    {!collapsed && (
                        <span className="font-medium">Logout</span>
                    )}
                </button>
            </div>
        </aside>
    )
}

export default AdminSidebar