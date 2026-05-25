import React, { useEffect, useState, useMemo } from 'react';
import { useInventoryStore } from '@/store/useInventoryStore';
import {
    Package,
    Plus,
    Search,
    AlertTriangle,
    TrendingUp,
    DollarSign,
    MoreVertical,
    Edit,
    Trash2,
    RefreshCw,
    Filter,
    CheckCircle2,
    TrendingDown,
    ChevronDown
} from 'lucide-react';
import Pagination from '@/components/ui/custom-pagination';
import {
    Card,
    CardContent,
    CardHeader,
    CardTitle,
    CardDescription
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow
} from "@/components/ui/table";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
    DialogClose,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger
} from "@/components/ui/dropdown-menu";
import { AnimatePresence } from 'framer-motion';
import { cn } from "@/lib/utils";
import { Label } from "@/components/ui/label";
import { motion as Motion } from 'framer-motion';

const ManageInventory = () => {
    const { items, stats, isLoading, fetchInventory, fetchReports, addStockItem, updateStockItem, deleteStockItem, pagination } = useInventoryStore();
    const [searchTerm, setSearchTerm] = useState("");
    const [selectedCategory, setSelectedCategory] = useState("All");
    const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
    const [editingItem, setEditingItem] = useState(null);

    // Form State
    const [formData, setFormData] = useState({
        name: "",
        category: "",
        quantity: 0,
        unit: "pcs",
        reorderLevel: 10,
        supplier: "",
        costPerUnit: 0
    });

    useEffect(() => {
        fetchInventory(1, 10);
        fetchReports();
    }, [fetchInventory, fetchReports]);

    const handlePageChange = (newPage) => {
        fetchInventory(newPage, 10);
    };

    const filteredItems = useMemo(() => {
        return items.filter(item => {
            const matchesSearch = item.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                item.supplier?.toLowerCase().includes(searchTerm.toLowerCase());
            const matchesCategory = selectedCategory === "All" || item.category === selectedCategory;
            return matchesSearch && matchesCategory;
        });
    }, [items, searchTerm, selectedCategory]);

    const categories = useMemo(() => {
        const cats = new Set(items.map(item => item.category));
        return ["All", ...Array.from(cats)];
    }, [items]);

    const handleFormChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: name === "quantity" || name === "reorderLevel" || name === "costPerUnit" ? Number(value) : value }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (editingItem) {
            await updateStockItem(editingItem._id, formData);
        } else {
            await addStockItem(formData);
        }
        setIsAddDialogOpen(false);
        setEditingItem(null);
        setFormData({ name: "", category: "", quantity: 0, unit: "pcs", reorderLevel: 10, supplier: "", costPerUnit: 0 });
    };

    const handleEdit = (item) => {
        setEditingItem(item);
        setFormData({
            name: item.name,
            category: item.category,
            quantity: item.quantity,
            unit: item.unit,
            reorderLevel: item.reorderLevel,
            supplier: item.supplier || "",
            costPerUnit: item.costPerUnit || 0
        });
        setIsAddDialogOpen(true);
    };

    return (
        <div className="p-4 md:p-8 space-y-8 bg-white dark:bg-[#0F1113] min-h-screen transition-colors duration-500">



            {/* Stats Dashboard */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                {[
                    {
                        label: "Total Items",
                        value: stats?.totalItems?.toLocaleString() || '0',
                        icon: Package,
                        description: "Stock items tracked",
                        tag: { label: `↑ trend`, variant: "up" },
                        footer: { meta: "Updated just now", action: "View all" },
                    },
                    {
                        label: "Low Stock",
                        value: stats?.lowStockCount || 0,
                        icon: AlertTriangle,
                        description: "Below reorder threshold",
                        alert: stats?.lowStockCount > 0,
                        tag: { label: "⚠ Attention", variant: "alert" },
                        footer: { meta: "Requires action", action: "Review" },
                    },
                    {
                        label: "Asset Value",
                        value: `Rs ${(stats?.totalValue || 0).toLocaleString()}`,
                        icon: DollarSign,
                        description: "Total inventory value",
                        tag: { label: "↑ +5.2%", variant: "up" },
                        footer: { meta: "This month", action: "Breakdown" },
                    },
                    {
                        label: "Reorders",
                        value: stats?.lowStockCount || 0,
                        icon: RefreshCw,
                        description: "Pending procurement tasks",
                        tag: { label: "Active", variant: "neutral" },
                        footer: { meta: `${stats?.lowStockCount || 0} pending`, action: "Process" },
                    },
                ].map((stat, i) => (
                    <Motion.div
                        key={i}
                        initial={{ opacity: 0, y: 12 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: i * 0.06, duration: 0.2 }}
                    >
                        <Card className={cn(
                            "border bg-card rounded-xl overflow-hidden transition-colors duration-150 hover:border-border/80",
                            stat.alert ? "border-amber-300/70 dark:border-amber-700/50" : "border-border/50"
                        )}>
                            <CardContent className="p-[18px] flex flex-col gap-[14px]">

                                {/* Top Row: Icon + Tag */}
                                <div className="flex items-start justify-between">
                                    <div className="w-8 h-8 rounded-lg bg-muted/50 border border-border/50 flex items-center justify-center shrink-0">
                                        <stat.icon className={cn(
                                            "w-3.5 h-3.5",
                                            stat.alert ? "text-amber-600 dark:text-amber-400" : "text-muted-foreground"
                                        )} />
                                    </div>
                                    <span className={cn(
                                        "inline-flex items-center h-[18px] px-1.5 rounded-[4px] font-mono text-[10px] font-bold tracking-[0.03em]",
                                        stat.tag.variant === "up" &&
                                        "bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-400",
                                        stat.tag.variant === "alert" &&
                                        "bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-400",
                                        stat.tag.variant === "neutral" &&
                                        "bg-muted text-muted-foreground border border-border/50"
                                    )}>
                                        {stat.tag.label}
                                    </span>
                                </div>

                                {/* Value Block */}
                                <div className="flex flex-col gap-0.5">
                                    <span className="text-[10px] font-semibold text-muted-foreground/50 uppercase tracking-[0.08em]">
                                        {stat.label}
                                    </span>
                                    <span className={cn(
                                        "font-mono text-[22px] font-bold tracking-tight leading-none",
                                        stat.alert
                                            ? "text-amber-700 dark:text-amber-400"
                                            : "text-foreground"
                                    )}>
                                        {stat.value}
                                    </span>
                                    <span className="text-[11px] text-muted-foreground/60 mt-0.5">
                                        {stat.description}
                                    </span>
                                </div>

                                {/* Footer */}
                                <div className="flex items-center justify-between pt-3 border-t border-border/40">
                                    <span className="text-[10px] text-muted-foreground/50">
                                        {stat.footer.meta}
                                    </span>
                                    <button className="text-[11px] font-semibold text-muted-foreground hover:text-foreground transition-colors bg-transparent border-none cursor-pointer">
                                        {stat.footer.action} →
                                    </button>
                                </div>

                            </CardContent>
                        </Card>
                    </Motion.div>
                ))}
            </div>

            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6">

                {/* Left Side: Search & Filters */}
                <div className="flex items-center gap-2.5 w-full sm:w-auto flex-1">

                    {/* Search */}
                    <div className="relative flex-1 sm:max-w-[280px]">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                        <Input
                            placeholder="Search inventory..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="pl-9 h-9 bg-card border-border/50 hover:border-border/80 rounded-md text-[13px] shadow-sm focus-visible:ring-1 focus-visible:ring-ring/50 transition-colors placeholder:text-muted-foreground w-full"
                        />
                    </div>

                    {/* Category Filter */}
                    <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                            <Button
                                variant="outline"
                                className="h-9 px-3 bg-card border-border/50 hover:border-border/80 rounded-md text-[13px] font-medium text-foreground hover:bg-card shadow-sm transition-colors shrink-0"
                            >
                                <Filter className="w-3.5 h-3.5 mr-2 text-muted-foreground" />
                                {selectedCategory === 'All' ? 'All Categories' : selectedCategory}
                                <ChevronDown className="w-3 h-3 opacity-50 ml-2" />
                            </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent
                            align="start"
                            className="min-w-[180px] rounded-lg border-border/60 shadow-lg p-1.5"
                        >
                            {categories.map(cat => (
                                <DropdownMenuItem
                                    key={cat}
                                    onClick={() => setSelectedCategory(cat)}
                                    className={cn(
                                        "rounded-md text-[13px] font-medium px-2.5 py-1.5 cursor-pointer transition-colors outline-none",
                                        selectedCategory === cat
                                            ? "bg-primary/10 text-primary focus:bg-primary/15"
                                            : "text-foreground hover:bg-muted focus:bg-muted"
                                    )}
                                >
                                    {cat}
                                </DropdownMenuItem>
                            ))}
                        </DropdownMenuContent>
                    </DropdownMenu>

                </div>

                {/* Right Side: Actions */}
                <div className="flex items-center shrink-0 w-full sm:w-auto">
                    {/* Add Item Dialog */}
                    <Dialog open={isAddDialogOpen} onOpenChange={(open) => {
                        setIsAddDialogOpen(open);
                        if (!open) {
                            setEditingItem(null);
                            setFormData({ name: '', category: '', quantity: 0, unit: 'pcs', reorderLevel: 10, supplier: '', costPerUnit: 0 });
                        }
                    }}>
                        <DialogTrigger asChild>
                            <Button className="h-9 px-4 bg-primary hover:bg-primary/90 text-primary-foreground rounded-md text-[13px] font-medium shadow-sm w-full sm:w-auto transition-all">
                                <Plus className="w-4 h-4 mr-2 -ml-1" />
                                New Stock Item
                            </Button>
                        </DialogTrigger>

                        <DialogContent className="sm:max-w-[500px] p-0 border-border/60 shadow-xl overflow-hidden rounded-xl">
                            <div className="px-6 pb-4 pt-6 bg-card border-b border-border/40">
                                <DialogTitle className="text-lg font-semibold text-foreground tracking-tight leading-none">
                                    {editingItem ? 'Edit Stock Item' : 'New Stock Item'}
                                </DialogTitle>
                                <DialogDescription className="text-[13px] text-muted-foreground mt-2">
                                    Define the details for warehouse tracking and inventory control.
                                </DialogDescription>
                            </div>

                            <form onSubmit={handleSubmit} className="bg-muted/10">
                                <div className="px-6 py-6 grid grid-cols-2 gap-x-5 gap-y-5">

                                    {/* Item Name */}
                                    <div className="col-span-2 space-y-1.5">
                                        <Label className="text-[13px] font-semibold text-foreground">
                                            Item Name
                                        </Label>
                                        <Input
                                            name="name" value={formData.name} onChange={handleFormChange}
                                            placeholder="e.g. Tomato Ketchup"
                                            className="h-9 text-[13px] rounded-md border-border/60 bg-background shadow-sm focus-visible:ring-1 focus-visible:ring-ring/50 transition-colors"
                                            required
                                        />
                                    </div>

                                    {/* Category */}
                                    <div className="space-y-1.5">
                                        <Label className="text-[13px] font-semibold text-foreground">Category</Label>
                                        <Input
                                            name="category" value={formData.category} onChange={handleFormChange}
                                            placeholder="e.g. Sauces"
                                            className="h-9 text-[13px] rounded-md border-border/60 bg-background shadow-sm focus-visible:ring-1 focus-visible:ring-ring/50 transition-colors"
                                            required
                                        />
                                    </div>

                                    {/* Unit */}
                                    <div className="space-y-1.5">
                                        <Label className="text-[13px] font-semibold text-foreground">Unit</Label>
                                        <Input
                                            name="unit" value={formData.unit} onChange={handleFormChange}
                                            placeholder="kg, pcs, ltr"
                                            className="h-9 text-[13px] rounded-md border-border/60 bg-background shadow-sm focus-visible:ring-1 focus-visible:ring-ring/50 transition-colors"
                                            required
                                        />
                                    </div>

                                    {/* Quantity */}
                                    <div className="space-y-1.5">
                                        <Label className="text-[13px] font-semibold text-foreground">Quantity</Label>
                                        <Input
                                            name="quantity" type="number" value={formData.quantity} onChange={handleFormChange}
                                            className="h-9 text-[13px] rounded-md border-border/60 bg-background shadow-sm focus-visible:ring-1 focus-visible:ring-ring/50 transition-colors"
                                            required
                                        />
                                    </div>

                                    {/* Reorder Level */}
                                    <div className="space-y-1.5">
                                        <Label className="text-[13px] font-semibold text-foreground">Reorder Level</Label>
                                        <Input
                                            name="reorderLevel" type="number" value={formData.reorderLevel} onChange={handleFormChange}
                                            className="h-9 text-[13px] rounded-md border-border/60 bg-background shadow-sm focus-visible:ring-1 focus-visible:ring-ring/50 transition-colors"
                                            required
                                        />
                                    </div>

                                    {/* Unit Cost */}
                                    <div className="space-y-1.5">
                                        <Label className="text-[13px] font-semibold text-foreground">Cost / Unit (Rs)</Label>
                                        <Input
                                            name="costPerUnit" type="number" value={formData.costPerUnit} onChange={handleFormChange}
                                            className="h-9 text-[13px] rounded-md border-border/60 bg-background shadow-sm focus-visible:ring-1 focus-visible:ring-ring/50 transition-colors"
                                            required
                                        />
                                    </div>

                                    {/* Supplier */}
                                    <div className="space-y-1.5">
                                        <Label className="text-[13px] font-semibold text-foreground">Supplier</Label>
                                        <Input
                                            name="supplier" value={formData.supplier} onChange={handleFormChange}
                                            placeholder="Green Farm Co."
                                            className="h-9 text-[13px] rounded-md border-border/60 bg-background shadow-sm focus-visible:ring-1 focus-visible:ring-ring/50 transition-colors"
                                        />
                                    </div>

                                </div>

                                <div className="px-6 py-4 bg-muted/40 border-t border-border/40 flex items-center justify-end gap-3">
                                    <DialogClose asChild>
                                        <Button
                                            type="button"
                                            variant="outline"
                                            className="h-9 px-4 rounded-md text-[13px] font-medium shadow-sm transition-colors text-muted-foreground hover:text-foreground hover:bg-background"
                                        >
                                            Cancel
                                        </Button>
                                    </DialogClose>
                                    <Button
                                        type="submit"
                                        className="h-9 px-4 rounded-md bg-foreground hover:bg-foreground/90 text-background text-[13px] font-medium shadow-sm transition-all"
                                    >
                                        {editingItem ? 'Save Changes' : 'Create Item'}
                                    </Button>
                                </div>
                            </form>
                        </DialogContent>
                    </Dialog>
                </div>
            </div>

            {/* Data Table */}
            <div className="bg-card border border-border/50 shadow-sm rounded-xl overflow-hidden">
                <Table>
                    <TableHeader>
                        <TableRow className="h-10 border-b border-border/50 hover:bg-transparent bg-muted/20">
                            <TableHead className="pl-5 w-[280px] text-[11px] font-medium text-muted-foreground uppercase tracking-wider">
                                Stock Item
                            </TableHead>
                            <TableHead className="text-[11px] font-medium text-muted-foreground uppercase tracking-wider">
                                Category
                            </TableHead>
                            <TableHead className="text-center text-[11px] font-medium text-muted-foreground uppercase tracking-wider">
                                Status
                            </TableHead>
                            <TableHead className="text-right text-[11px] font-medium text-muted-foreground uppercase tracking-wider">
                                In Stock
                            </TableHead>
                            <TableHead className="text-right text-[11px] font-medium text-muted-foreground uppercase tracking-wider">
                                Unit Cost
                            </TableHead>
                            <TableHead className="pr-5 text-right text-[11px] font-medium text-muted-foreground uppercase tracking-wider">
                                Actions
                            </TableHead>
                        </TableRow>
                    </TableHeader>

                    <TableBody>
                        <AnimatePresence mode="popLayout">
                            {filteredItems.map((item, idx) => {
                                const isLow = item.quantity <= item.reorderLevel;
                                return (
                                    <Motion.tr
                                        key={item._id}
                                        initial={{ opacity: 0, y: 6 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        exit={{ opacity: 0 }}
                                        transition={{ delay: idx * 0.03, duration: 0.15 }}
                                        className="group h-[56px] border-b border-border/40 last:border-0 hover:bg-muted/30 transition-colors"
                                    >
                                        {/* Stock Item */}
                                        <TableCell className="pl-5">
                                            <div className="flex items-center gap-3">
                                                <div className={cn(
                                                    "w-8 h-8 rounded-lg flex items-center justify-center font-medium text-xs shrink-0 border shadow-sm",
                                                    isLow
                                                        ? "bg-amber-500/10 text-amber-600 border-amber-500/20 dark:text-amber-400"
                                                        : "bg-background text-foreground border-border/60"
                                                )}>
                                                    {item.name.slice(0, 2).toUpperCase()}
                                                </div>
                                                <div className="flex flex-col min-w-0">
                                                    <span className="text-[13px] font-medium text-foreground leading-snug truncate capitalize">
                                                        {item.name}
                                                    </span>
                                                    <span className="text-[12px] text-muted-foreground truncate">
                                                        {item.supplier || 'Internal Store'}
                                                    </span>
                                                </div>
                                            </div>
                                        </TableCell>

                                        {/* Category */}
                                        <TableCell>
                                            <span className="inline-flex items-center h-5 px-2 rounded-md text-[11px] font-medium bg-secondary text-secondary-foreground border border-border/40 whitespace-nowrap">
                                                {item.category}
                                            </span>
                                        </TableCell>

                                        {/* Status */}
                                        <TableCell className="text-center">
                                            {isLow ? (
                                                <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[11px] font-medium bg-amber-500/10 text-amber-600 border border-amber-500/20 dark:text-amber-400">
                                                    <span className="w-1.5 h-1.5 rounded-full bg-amber-500 shrink-0" />
                                                    Low Stock
                                                </span>
                                            ) : (
                                                <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[11px] font-medium bg-emerald-500/10 text-emerald-600 border border-emerald-500/20 dark:text-emerald-400">
                                                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 shrink-0" />
                                                    Healthy
                                                </span>
                                            )}
                                        </TableCell>

                                        {/* In Stock */}
                                        <TableCell className="text-right">
                                            <div className="flex flex-col items-end">
                                                <span className={cn(
                                                    "text-[13px] font-medium tabular-nums flex items-baseline gap-1",
                                                    isLow ? "text-amber-600 dark:text-amber-400" : "text-foreground"
                                                )}>
                                                    {item.quantity}
                                                    <span className="text-[11px] text-muted-foreground font-normal">
                                                        {item.unit}
                                                    </span>
                                                </span>
                                                <span className="text-[11px] text-muted-foreground mt-0.5">
                                                    Min: {item.reorderLevel}
                                                </span>
                                            </div>
                                        </TableCell>

                                        {/* Unit Cost */}
                                        <TableCell className="text-right">
                                            <span className="text-[13px] font-medium text-foreground tabular-nums">
                                                Rs {item.costPerUnit?.toLocaleString() || 0}
                                            </span>
                                        </TableCell>

                                        {/* Actions */}
                                        <TableCell className="pr-5">
                                            <div className="flex items-center justify-end gap-1.5 opacity-0 group-hover:opacity-100 transition-opacity">
                                                <Button
                                                    variant="ghost"
                                                    size="icon"
                                                    onClick={() => handleEdit(item)}
                                                    className="w-7 h-7 rounded-md hover:bg-muted text-muted-foreground hover:text-foreground"
                                                >
                                                    <Edit className="w-3.5 h-3.5" />
                                                </Button>
                                                <Button
                                                    variant="ghost"
                                                    size="icon"
                                                    onClick={() => deleteStockItem(item._id)}
                                                    className="w-7 h-7 rounded-md hover:bg-rose-500/10 text-muted-foreground hover:text-rose-600 dark:hover:text-rose-400"
                                                >
                                                    <Trash2 className="w-3.5 h-3.5" />
                                                </Button>
                                            </div>
                                        </TableCell>
                                    </Motion.tr>
                                );
                            })}
                        </AnimatePresence>
                    </TableBody>
                </Table>

                {/* Footer */}
                <div className="flex flex-col sm:flex-row items-center justify-between px-5 py-3 border-t border-border/50 bg-muted/10 gap-3">
                    <span className="text-[12px] text-muted-foreground">
                        Showing <span className="font-medium text-foreground">{filteredItems.length}</span> of <span className="font-medium text-foreground">{pagination.total}</span> items
                    </span>
                    <Pagination pagination={pagination} onPageChange={handlePageChange} />
                </div>

                {/* Empty State */}
                {filteredItems.length === 0 && !isLoading && (
                    <div className="py-16 flex flex-col items-center justify-center gap-3 text-center">
                        <div className="w-12 h-12 rounded-full bg-muted flex items-center justify-center">
                            <Search className="w-5 h-5 text-muted-foreground" />
                        </div>
                        <div>
                            <p className="text-[14px] font-medium text-foreground">No items found</p>
                            <p className="text-[13px] text-muted-foreground mt-1">
                                Try adjusting your filters or search term
                            </p>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default ManageInventory;
