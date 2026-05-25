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
    Utensils,
} from 'lucide-react'
import { Link } from 'react-router-dom'
import { cn } from '@/lib/utils'
import { useAuthStore } from '@/store/useAuthStore'

const Sidebar = () => {

    const { authUser, logout } = useAuthStore()


    const [collapsed, setCollapsed] = useState(false)
    const [activeItem, setActiveItem] = useState('dashboard')

    const menuItems = [
        { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard, badge: 0, link: '/dashboard' },

        { id: 'orders', label: 'Order Line', icon: ShoppingCart, badge: 3, link: '/orders' },
        { id: 'tables', label: 'Manage Tables', icon: Grid2x2Check, badge: 0, link: '/tables' },
        { id: 'dishes', label: 'Manage Orders', icon: Hamburger, badge: 12, link: '/dishes' },
        { id: 'inventory', label: 'Inventory', icon: Package, badge: 5, link: '/inventory' },
        // { id: 'staff', label: 'Staff Management', icon: ChefHat, badge: 0, link: '/staff' },
        // { id: 'users', label: 'Manage Users', icon: UserRoundCog, badge: 0, link: '/users' },
        // { id: 'customers', label: 'Customers', icon: Users, badge: 0, link: '/customers' },
        { id: 'kitchen', label: 'Kitchen Board', icon: Utensils, badge: 0, link: '/kitchen' },
        ...(authUser?.role === 'admin' ? [
            { id: 'admin-panel', label: 'Admin Panel', icon: UserRoundCog, badge: 0, link: '/admin' }
        ] : [])
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
                            <div className="size-9 bg-primary rounded-lg flex items-center justify-center shadow-md">
                                <Hamburger className="size-5 text-primary-foreground" />
                            </div>
                            <div>
                                <h1 className="font-bold text-lg leading-tight tracking-tight">Tasty <span className="font-normal text-muted-foreground">Station</span></h1>
                                <p className="text-[10px] font-semibold text-primary/70 uppercase tracking-widest">Admin Panel</p>
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
                        const isActive = activeItem === item.id

                        return (
                            <Link key={item.id} to={item.link} className=''>
                                <div
                                    onClick={() => setActiveItem(item.id)}
                                    className={cn(
                                        "w-full flex items-center gap-4 px-3 py-2.5 rounded-lg transition-all duration-300 group cursor-pointer relative",
                                        "hover:bg-accent hover:text-accent-foreground",
                                        isActive
                                            ? "text-primary bg-primary/5 border border-primary/20 shadow-sm"
                                            : "text-muted-foreground",

                                    )}
                                >
                                    <div className="relative">
                                        <Icon className={cn(
                                            "size-5 transition-all duration-300",
                                            isActive && "text-primary scale-110",
                                            collapsed && "mx-auto"
                                        )} />
                                    </div>
                                    {!collapsed && (
                                        <>
                                            <span className={cn(
                                                "font-medium flex-1 text-left transition-colors",
                                                isActive ? "text-primary" : "group-hover:text-foreground"
                                            )}>{item.label}</span>
                                            {isActive && (
                                                <div className="size-1.5 rounded-full bg-primary animate-pulse-subtle shadow-[0_0_8px_rgba(var(--primary),0.5)]" />
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
                    const isActive = activeItem === item.id

                    return (
                        <Link key={item.id} to={item.link}>
                            <div
                                onClick={() => setActiveItem(item.id)}
                                className={cn(
                                    "w-full flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all duration-300 cursor-pointer",
                                    "hover:bg-accent hover:text-accent-foreground",
                                    isActive
                                        ? "bg-accent text-accent-foreground shadow-sm"
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
                        "w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-red-500 hover:bg-red-500/10 hover:text-red-600 transition-all duration-300 active:scale-95 font-medium",
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

export default Sidebar