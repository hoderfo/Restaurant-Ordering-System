import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { LayoutGrid, List, RefreshCcw, Search, X } from "lucide-react";
import { motion as Motion } from "framer-motion";


const OrderTerminalHeader = ({
    searchTerm,
    setSearchTerm,
    viewMode,
    setViewMode,
    filter,
    setFilter,
    startDate,
    setStartDate,
    endDate,
    setEndDate,
    stats,
}) => {
    const statusTabs = [
        { id: 'all', label: 'All Orders', value: 'All', count: stats?.total || 0 },
        { id: 'pending', label: 'Incoming', value: 'Pending', count: stats?.pending || 0 },
        { id: 'preparing', label: 'Preparing', value: 'Preparing', count: stats?.preparing || 0 },
        { id: 'ready', label: 'Ready', value: 'Ready', count: stats?.ready || 0 },
        { id: 'completed', label: 'Completed', value: 'Completed', count: stats?.completed || 0 },
    ];

    return (
        <header className="mb-6">



            {/* ── Toolbar ── */}
            <div className="flex items-center gap-2 mb-5">

                {/* View Toggle */}
                <div className="inline-flex items-center bg-card border border-border/60 rounded-lg p-[3px] gap-0.5 shrink-0">
                    <button
                        onClick={() => setViewMode('card')}
                        className={cn(
                            "flex items-center gap-1.5 h-[26px] px-[9px] rounded-md text-[11px] font-medium transition-all duration-100",
                            viewMode === 'card'
                                ? "bg-muted text-foreground font-semibold"
                                : "text-muted-foreground hover:text-foreground"
                        )}
                    >
                        <LayoutGrid className="w-3 h-3" />
                        Grid
                    </button>
                    <button
                        onClick={() => setViewMode('table')}
                        className={cn(
                            "flex items-center gap-1.5 h-[26px] px-[9px] rounded-md text-[11px] font-medium transition-all duration-100",
                            viewMode === 'table'
                                ? "bg-muted text-foreground font-semibold"
                                : "text-muted-foreground hover:text-foreground"
                        )}
                    >
                        <List className="w-3 h-3" />
                        Table
                    </button>
                </div>

                {/* Vertical Rule */}
                <div className="w-px h-[18px] bg-border/60 shrink-0" />

                {/* Date Range */}
                <div className="flex items-center gap-1.5 shrink-0">
                    <div className="flex items-center gap-1.5 h-8 px-2.5 bg-card border border-border/60 rounded-lg">
                        <span className="text-[10px] font-bold text-muted-foreground/50 uppercase tracking-[0.09em]">
                            From
                        </span>
                        <input
                            type="date"
                            value={startDate}
                            onChange={(e) => setStartDate(e.target.value)}
                            className="bg-transparent border-0 outline-none font-mono text-[11px] font-medium text-foreground w-[98px] cursor-pointer"
                        />
                    </div>
                    <span className="text-[12px] text-muted-foreground/40">→</span>
                    <div className="flex items-center gap-1.5 h-8 px-2.5 bg-card border border-border/60 rounded-lg">
                        <span className="text-[10px] font-bold text-muted-foreground/50 uppercase tracking-[0.09em]">
                            To
                        </span>
                        <input
                            type="date"
                            value={endDate}
                            onChange={(e) => setEndDate(e.target.value)}
                            className="bg-transparent border-0 outline-none font-mono text-[11px] font-medium text-foreground w-[98px] cursor-pointer"
                        />
                    </div>
                </div>

                {/* Vertical Rule */}
                <div className="w-px h-[18px] bg-border/60 shrink-0" />

                {/* Search */}
                <div className="relative flex-1 min-w-0">
                    <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3 h-3 text-muted-foreground/40 pointer-events-none" />
                    <Input
                        placeholder="Search by order ID or customer…"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="pl-[28px] h-8 bg-card border-border/60 rounded-lg text-[11px] shadow-none focus-visible:ring-0 focus-visible:border-border/80 transition-colors placeholder:text-muted-foreground/40 w-full"
                    />
                </div>

            </div>

            {/* ── Filter Bar ── */}
            <div className="flex items-stretch border border-border/60 rounded-[9px] overflow-hidden bg-card">
                {statusTabs.map((tab) => {
                    const isActive = filter === tab.value;

                    const badgeClass = {
                        all: "bg-muted text-muted-foreground",
                        pending: "bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-400",
                        preparing: "bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-400",
                        ready: "bg-cyan-100 text-cyan-800 dark:bg-cyan-900/30 dark:text-cyan-400",
                        completed: "bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-400",
                        cancelled: "bg-rose-100 text-rose-800 dark:bg-rose-900/30 dark:text-rose-400",
                    }[tab.value] ?? "bg-muted text-muted-foreground";

                    return (
                        <button
                            key={tab.id}
                            onClick={() => setFilter(tab.value)}
                            className={cn(
                                "relative flex items-center gap-1.5 px-[14px] h-9 border-none transition-colors duration-100 shrink-0",
                                "not-last:after:content-[''] not-last:after:absolute not-last:after:right-0 not-last:after:top-2 not-last:after:bottom-2 not-last:after:w-px not-last:after:bg-border/50",
                                isActive
                                    ? "bg-muted"
                                    : "bg-transparent hover:bg-muted/50"
                            )}
                        >
                            <span className={cn(
                                "text-[12px] font-medium whitespace-nowrap transition-colors",
                                isActive ? "text-foreground font-semibold" : "text-muted-foreground"
                            )}>
                                {tab.label}
                            </span>
                            <span className={cn(
                                "inline-flex items-center justify-center h-[17px] min-w-[22px] px-[5px] rounded-[4px] font-mono text-[10px] font-bold",
                                badgeClass
                            )}>
                                {tab.count}
                            </span>
                        </button>
                    );
                })}
            </div>

        </header>
    );
};

export default OrderTerminalHeader;