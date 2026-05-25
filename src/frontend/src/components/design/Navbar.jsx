import React from 'react'
import { Avatar, AvatarFallback, AvatarImage } from '../ui/avatar'
import { Bell, Search, Menu, Settings, Sun, Moon, Computer, LogOut, User, CreditCard, Users, Check } from 'lucide-react'
import { Button } from '../ui/button'
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from "../ui/dropdown-menu"
import { useThemeStore } from '../../store/useThemeStore'
import { useAuthStore } from '../../store/useAuthStore'
import { Link } from 'react-router-dom'

const Navbar = () => {
    const { logout, authUser } = useAuthStore();
    const { theme, setTheme } = useThemeStore();

    return (
        <nav className="sticky top-0 z-50 w-full border-b bg-background">
            <div className="flex h-16 items-center px-4 lg:px-8">
                {/* Logo */}
                <div className="flex items-center gap-3">
                    <div className="size-7 bg-primary rounded-md flex items-center justify-center">
                        <span className="text-primary-foreground font-bold text-sm">TS</span>
                    </div>
                    <h1 className="text-lg font-bold">
                        Tasty<span className="font-normal text-muted-foreground"> Station</span>
                    </h1>
                </div>

                {/* Search - Desktop */}
                {authUser && <div className="hidden lg:flex flex-1 max-w-sm mx-8">
                    <div className="relative w-full group rounded-full ">
                        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground group-focus-within:text-primary transition-colors" />
                        <input
                            placeholder="Search..."
                            className="w-full pl-9 pr-4 py-2 text-sm border rounded-full focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary bg-transparent"
                        />
                    </div>
                </div>}
                {authUser && authUser.role === "admin" && <div className="flex gap-2 max-sm:hidden">
                    <Link to="/dashboard">
                        <Button>
                            Cashier
                        </Button>
                    </Link>
                    <Link to="/admin">
                        <Button>
                            Admin
                        </Button>
                    </Link>
                </div>}

                {/* Right Actions */}
                <div className="flex items-center gap-2 ml-auto">
                    {/* Mobile Actions */}
                    {authUser && <Button
                        variant="ghost"
                        size="icon"
                        className="lg:hidden"
                        aria-label="Search"
                    >
                        <Search className="h-5 w-5" />
                    </Button>}

                    <Button
                        variant="ghost"
                        size="icon"
                        className="lg:hidden"
                        aria-label="Open menu"
                    >
                        <Menu className="h-5 w-5" />
                    </Button>

                    {/* Desktop Actions */}
                    <div className="hidden lg:flex items-center gap-2">
                        {authUser && <Button
                            variant="ghost"
                            size="icon"
                            className="relative"
                            aria-label="View notifications"
                        >
                            <Bell className="h-5 w-5" />
                            <span className="absolute -top-1 -right-1 size-2 bg-red-500 rounded-full border border-background" />
                        </Button>}


                        <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                                <Button
                                    variant="ghost"
                                    size="icon"
                                    aria-label="Theme settings"
                                    className="h-9 w-9 rounded-md hover:bg-accent transition-colors"
                                >
                                    <Settings className="h-4 w-4 text-muted-foreground" />
                                </Button>
                            </DropdownMenuTrigger>

                            <DropdownMenuContent
                                align="end"
                                className="w-48 bg-background border-border shadow-lg rounded-lg"
                            >
                                <DropdownMenuLabel className="px-3 py-2 text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                                    Theme
                                </DropdownMenuLabel>

                                <DropdownMenuSeparator className="bg-border my-1" />

                                <div className="p-1 space-y-0.5">
                                    <DropdownMenuItem
                                        className="px-3 py-2.5 text-sm cursor-pointer rounded-md hover:bg-accent focus:bg-accent transition-colors flex items-center gap-2"
                                        onClick={() => setTheme("light")}
                                    >
                                        <div className="flex items-center justify-center h-5 w-5">
                                            <Sun className="h-4 w-4" />
                                        </div>
                                        <span>Light</span>
                                        {theme === "light" && (
                                            <Check className="h-3 w-3 ml-auto text-primary" />
                                        )}
                                    </DropdownMenuItem>

                                    <DropdownMenuItem
                                        className="px-3 py-2.5 text-sm cursor-pointer rounded-md hover:bg-accent focus:bg-accent transition-colors flex items-center gap-2"
                                        onClick={() => setTheme("dark")}
                                    >
                                        <div className="flex items-center justify-center h-5 w-5">
                                            <Moon className="h-4 w-4" />
                                        </div>
                                        <span>Dark</span>
                                        {theme === "dark" && (
                                            <Check className="h-3 w-3 ml-auto text-primary" />
                                        )}
                                    </DropdownMenuItem>


                                </div>
                            </DropdownMenuContent>
                        </DropdownMenu>
                    </div>

                    {
                        authUser && <div className="flex items-center gap-3 pl-3 border-l">
                            <div className="flex flex-col items-end max-sm:hidden lg:block">
                                <span className="text-sm font-medium">{authUser.name}</span>
                            </div>

                            <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                    <Button
                                        variant="ghost"
                                        className="relative h-10 w-10 rounded-full p-0 hover:bg-accent transition-all duration-200 active:scale-95"
                                        aria-label="User profile and account settings"
                                    >
                                        <Avatar className="h-full w-full ring-2 ring-transparent hover:ring-primary/20 transition-all">
                                            <AvatarImage
                                                src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${authUser.name}`}
                                                alt={authUser.name}
                                            />
                                            <AvatarFallback className="bg-primary text-primary-foreground font-semibold text-sm">
                                                {authUser.name?.slice(0, 2).toUpperCase()}
                                            </AvatarFallback>
                                        </Avatar>
                                    </Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent
                                    align="end"
                                    className="w-56 bg-background border-border shadow-lg rounded-lg"
                                >
                                    <DropdownMenuLabel className="p-3 text-sm font-semibold">
                                        My Account
                                    </DropdownMenuLabel>

                                    <DropdownMenuSeparator className="bg-border" />

                                    <div className="p-1">
                                        <DropdownMenuItem className="px-3 py-2.5 text-sm cursor-pointer rounded-md hover:bg-accent focus:bg-accent transition-colors">
                                            <User className="h-4 w-4 mr-2 text-muted-foreground" />
                                            Profile
                                        </DropdownMenuItem>

                                        <DropdownMenuItem className="px-3 py-2.5 text-sm cursor-pointer rounded-md hover:bg-accent focus:bg-accent transition-colors">
                                            <CreditCard className="h-4 w-4 mr-2 text-muted-foreground" />
                                            Billing
                                        </DropdownMenuItem>

                                        <DropdownMenuItem className="px-3 py-2.5 text-sm cursor-pointer rounded-md hover:bg-accent focus:bg-accent transition-colors">
                                            <Users className="h-4 w-4 mr-2 text-muted-foreground" />
                                            Team
                                        </DropdownMenuItem>

                                        <DropdownMenuItem className="px-3 py-2.5 text-sm cursor-pointer rounded-md hover:bg-accent focus:bg-accent transition-colors">
                                            <Settings className="h-4 w-4 mr-2 text-muted-foreground" />
                                            Settings
                                        </DropdownMenuItem>
                                    </div>

                                    <DropdownMenuSeparator className="bg-border" />

                                    <div className="p-2">
                                        <Button
                                            onClick={logout}
                                            variant="destructive"
                                            size="sm"
                                            className="w-full justify-start text-sm font-medium py-2 px-3"
                                        >
                                            <LogOut className="h-4 w-4 mr-2" />
                                            Log out
                                        </Button>
                                    </div>
                                </DropdownMenuContent>
                            </DropdownMenu>
                        </div>
                    }

                    {/* User Profile */}

                </div>
            </div>
        </nav>
    )
}

export default Navbar