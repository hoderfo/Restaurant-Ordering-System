import React, { useState, useEffect } from 'react'
import { Plus, Search, Filter, Pencil, Trash2, MoreHorizontal, ArrowUpDown, ChevronDown, ChevronLeft, ChevronRight, X, Upload, Flame, Clock, Leaf, Loader2 } from 'lucide-react'
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Checkbox } from "@/components/ui/checkbox"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
    DropdownMenuCheckboxItem,
} from "@/components/ui/dropdown-menu"
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table"
import { Card } from "@/components/ui/card"
import { cn } from "@/lib/utils"
import { Link } from 'react-router-dom'
import { useMenuStore } from '@/store/useMenuStore'


const AddMenu = () => {
    const { menu, paginationMenu, category, getAllMenuItems, getAllCategories, createMenuItem, updateMenuItem, deleteMenuItem, isLoading } = useMenuStore();

    const [isDialogOpen, setIsDialogOpen] = useState(false);
    const [fileName, setFileName] = useState("");
    const [imagePreview, setImagePreview] = useState(null);
    const [editingId, setEditingId] = useState(null);

    // Filter & UI States
    const [searchQuery, setSearchQuery] = useState("");
    const [statusFilter, setStatusFilter] = useState("all"); // all, available, unavailable
    const [visibleColumns, setVisibleColumns] = useState({
        id: true,
        image: true,
        name: true,
        category: true,
        price: true,
        status: true,
        actions: true
    });

    // Derived state for title/button text
    const isEditMode = !!editingId;

    // Form States
    const [formData, setFormData] = useState({
        name: "",
        description: "",
        price: "",
        category: "",
        preparationTime: 15,
        taxRate: 0,
        image: null
    });

    const [variants, setVariants] = useState([{ name: "Regular", price: 0 }]);
    const [isVeg, setIsVeg] = useState(true);
    const [isAvailable, setIsAvailable] = useState(true);
    const [spiceLevel, setSpiceLevel] = useState("medium");

    useEffect(() => {
        getAllCategories();
    }, [getAllCategories]);

    useEffect(() => {
        const delayDebounceFn = setTimeout(() => {
            const isAvailable = statusFilter === "all" ? "" : statusFilter === "available";
            getAllMenuItems(1, 12, "", searchQuery, isAvailable);
        }, 500);

        return () => clearTimeout(delayDebounceFn);
    }, [searchQuery, statusFilter, getAllMenuItems]);

    const handlePageChange = (newPage) => {
        const isAvailable = statusFilter === "all" ? "" : statusFilter === "available";
        getAllMenuItems(newPage, 12, "", searchQuery, isAvailable);
    };

    // Reset form when dialog closes
    useEffect(() => {
        if (!isDialogOpen) {
            // eslint-disable-next-line react-hooks/set-state-in-effect
            setFormData({
                name: "",
                description: "",
                price: "",
                category: "",
                preparationTime: 15,
                taxRate: 0,
                image: null
            });
            setVariants([{ name: "Regular", price: 0 }]);
            setFileName("");
            setImagePreview(null);
            setEditingId(null);
            setIsVeg(true);
            setIsAvailable(true);
            setSpiceLevel("medium");
        }
    }, [isDialogOpen]);

    const getStockStatus = () => {
        if (!isAvailable) return { label: 'Unavailable', variant: 'destructive', className: 'bg-red-100 text-red-700 border-red-200 hover:bg-red-200' };
        return { label: 'In Stock', variant: 'success', className: 'bg-teal-100 text-teal-700 border-teal-200 hover:bg-teal-200' };
    };

    const handleFileChange = (e) => {
        const file = e.target.files?.[0];
        if (file) {
            setFileName(file.name);
            setFormData({ ...formData, image: file });
            setImagePreview(URL.createObjectURL(file));
        }
    };

    const handleRemoveImage = (e) => {
        e.stopPropagation();
        setFormData({ ...formData, image: null });
        setFileName("");
        setImagePreview(null);
    };

    const handleInputChange = (e) => {
        setFormData({ ...formData, [e.target.id]: e.target.value });
    };

    const addVariant = () => {
        setVariants([...variants, { name: "", price: 0 }]);
    };

    const updateVariant = (index, field, value) => {
        const newVariants = [...variants];
        newVariants[index][field] = value;
        setVariants(newVariants);
    };

    const removeVariant = (index) => {
        const newVariants = variants.filter((_, i) => i !== index);
        setVariants(newVariants);
    };

    const handleEdit = (item) => {
        setFormData({
            name: item.name,
            description: item.description,
            price: item.price,
            category: item.category?._id || item.category, // Handle populated vs unpopulated
            preparationTime: item.preparationTime || 15,
            taxRate: item.taxes || 0,
            image: item.image // Keep existing URL
        });
        setVariants(item.variants && item.variants.length > 0 ? item.variants : [{ name: "Regular", price: item.price }]);
        setIsVeg(item.isVeg);
        setIsAvailable(item.isAvailable);
        setSpiceLevel(item.spiceLevel || "medium");

        setFileName(item.image ? "Existing Image" : "");
        setImagePreview(item.image);
        setEditingId(item._id);
        setIsDialogOpen(true);
    }

    const handleSubmit = async () => {
        if (!formData.name || !formData.price || !formData.category) {
            alert("Please fill in all required fields (Name, Price, Category)");
            return;
        }

        const data = new FormData();
        data.append("name", formData.name);
        data.append("description", formData.description);
        data.append("price", formData.price);
        data.append("category", formData.category);
        data.append("preparationTime", formData.preparationTime);
        data.append("taxes", formData.taxRate);
        data.append("isVeg", isVeg);
        data.append("isAvailable", isAvailable);
        data.append("spiceLevel", spiceLevel);
        data.append("variants", JSON.stringify(variants));

        if (formData.image instanceof File) {
            data.append("image", formData.image);
        } else if (typeof formData.image === 'string' && formData.image) {
            // Check if it's a URL (existing image), backend might expect it in body.image if we want to explicitly say "keep this". 
            // However, our backend: `if (req.file) ... else if (req.body.image) ...`
            // If we don't send `image` at all, `req.body.image` is undefined, `updateData.image` is undefined. 
            // Mongoose `findByIdAndUpdate` with `{...req.body}` (from controller):
            // `let updateData = { ...req.body };`
            // If `req.body.image` is sent as string, it updates it.
            // If it's NOT sent, and we use `{...req.body}`, `updateData.image` is undefined.
            // So existing image in DB persists (unless we explicitly set it to null?).
            // If we want to KEEP the image, we don't strictly *need* to send it if we rely on "undefined fields don't overwrite".
            // But if we want to be safe or if logic changes, we can send it.
            // Let's send it if it's there.
            data.append("image", formData.image);
        }

        try {
            if (isEditMode) {
                await updateMenuItem(editingId, data);
                alert("Menu item updated successfully!");
            } else {
                await createMenuItem(data);
                alert("Menu item created successfully!");
            }
            setIsDialogOpen(false);
        } catch (error) {
            console.error("Failed to save item:", error);
            alert(`Failed to ${isEditMode ? 'update' : 'create'} menu item.`);
        }
    };

    const handleDelete = async (id) => {
        if (window.confirm("Are you sure you want to delete this item?")) {
            try {
                await deleteMenuItem(id);
            } catch (error) {
                alert("Failed to delete item");
                console.log(error);
            }
        }
    }

    return (
        <div className="w-full h-[calc(100vh-5rem)] p-6 bg-gray-50/50 dark:bg-transparent flex flex-col gap-6 relative">
            {/* Header Section */}
            <div className="w-full flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold tracking-tight text-gray-900 dark:text-white">Stock Menu</h1>
                    <p className="text-sm text-muted-foreground mt-1">Manage your inventory, prices, and stock levels.</p>
                </div>

                <div className="flex items-center gap-2">
                    <Link to="/admin/add-category">
                        <Button className="bg-transparent border border-teal-600 text-teal-600 shadow-sm transition-all hover:bg-teal-600 hover:text-white hover:scale-105 active:scale-95 rounded-full">
                            <Plus className="h-4 w-4 mr-2" />
                            Add New Category
                        </Button>
                    </Link>
                    <Button
                        onClick={() => setIsDialogOpen(true)}
                        className="bg-teal-600 hover:bg-teal-700 text-white shadow-sm transition-all hover:scale-105 active:scale-95 rounded-full"
                    >
                        <Plus className="h-4 w-4 mr-2" />
                        Add New Stock
                    </Button>
                </div>
            </div>

            {/* Main Content Card */}
            <Card className="flex-1 flex flex-col overflow-hidden border-none shadow-sm bg-white dark:bg-teal-900/20 ring-1 ring-gray-200 dark:ring-gray-800">

                {/* Toolbar */}
                <div className="p-4 border-b flex flex-col sm:flex-row items-center justify-between gap-4">
                    <div className="relative w-full sm:w-[300px]">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                        <Input
                            placeholder="Search dishes..."
                            className="pl-9 h-10 w-full bg-gray-50 dark:bg-accent/20 border-gray-200 dark:border-gray-700 focus-visible:ring-teal-500"
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                        />
                    </div>

                    <div className="flex items-center gap-2 w-full sm:w-auto">
                        <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                                <Button variant="outline" size="sm" className={cn(
                                    "h-10 ml-auto sm:ml-0",
                                    statusFilter !== "all" && "border-teal-600 text-teal-600 bg-teal-50"
                                )}>
                                    <Filter className="mr-2 h-4 w-4" />
                                    {statusFilter === "all" ? "Filter" : statusFilter === "available" ? "In Stock" : "Unavailable"}
                                </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                                <DropdownMenuLabel>Filter by Status</DropdownMenuLabel>
                                <DropdownMenuSeparator />
                                <DropdownMenuCheckboxItem
                                    checked={statusFilter === "all"}
                                    onCheckedChange={() => setStatusFilter("all")}
                                >
                                    All Items
                                </DropdownMenuCheckboxItem>
                                <DropdownMenuCheckboxItem
                                    checked={statusFilter === "available"}
                                    onCheckedChange={() => setStatusFilter("available")}
                                >
                                    In Stock
                                </DropdownMenuCheckboxItem>
                                <DropdownMenuCheckboxItem
                                    checked={statusFilter === "unavailable"}
                                    onCheckedChange={() => setStatusFilter("unavailable")}
                                >
                                    Unavailable
                                </DropdownMenuCheckboxItem>
                            </DropdownMenuContent>
                        </DropdownMenu>

                        <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                                <Button variant="outline" size="sm" className="h-10">
                                    Columns
                                    <ChevronDown className="ml-2 h-4 w-4" />
                                </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end" className="w-[150px]">
                                {Object.keys(visibleColumns).map((col) => (
                                    <DropdownMenuCheckboxItem
                                        key={col}
                                        checked={visibleColumns[col]}
                                        onCheckedChange={(checked) =>
                                            setVisibleColumns(prev => ({ ...prev, [col]: checked }))
                                        }
                                        className="capitalize"
                                    >
                                        {col}
                                    </DropdownMenuCheckboxItem>
                                ))}
                            </DropdownMenuContent>
                        </DropdownMenu>
                    </div>
                </div>

                {/* Table */}
                <div className="flex-1 overflow-auto">
                    <Table>
                        <TableHeader>
                            <TableRow className="hover:bg-transparent border-gray-100 dark:border-gray-800">
                                <TableHead className="w-[40px] pl-4">
                                    <Checkbox />
                                </TableHead>
                                {visibleColumns.id && <TableHead className="w-[80px]">Id</TableHead>}
                                {visibleColumns.image && <TableHead className="w-[80px]">Image</TableHead>}
                                {visibleColumns.name && (
                                    <TableHead className="min-w-[150px]">
                                        <div className="flex items-center space-x-2 cursor-pointer hover:text-teal-600">
                                            <span>Name</span>
                                            <ArrowUpDown className="h-3 w-3" />
                                        </div>
                                    </TableHead>
                                )}
                                {visibleColumns.category && <TableHead>Category</TableHead>}
                                {visibleColumns.price && (
                                    <TableHead>
                                        <div className="flex items-center space-x-2 cursor-pointer hover:text-teal-600">
                                            <span>Price</span>
                                            <ArrowUpDown className="h-3 w-3" />
                                        </div>
                                    </TableHead>
                                )}
                                {visibleColumns.status && <TableHead>Status</TableHead>}
                                {visibleColumns.actions && <TableHead className="text-right pr-4">Actions</TableHead>}
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {menu.length === 0 ? (
                                <TableRow>
                                    <TableCell colSpan={8} className="text-center py-10 text-gray-500">
                                        No menu items found. Add some stock to get started.
                                    </TableCell>
                                </TableRow>
                            ) : (
                                menu.map((item, index) => {
                                    const stockStatus = getStockStatus(100);
                                    return (
                                        <TableRow key={item._id || index} className="hover:bg-teal-50/30 dark:hover:bg-teal-900/10 border-gray-100 dark:border-gray-800 transition-colors cursor-pointer group">
                                            <TableCell className="pl-4">
                                                <Checkbox />
                                            </TableCell>
                                            {visibleColumns.id && <TableCell className="font-medium text-gray-500">#{index + 1 + (paginationMenu.currentPage - 1) * paginationMenu.limit}</TableCell>}
                                            {visibleColumns.image && (
                                                <TableCell>
                                                    <div className="h-10 w-10 rounded-lg overflow-hidden ring-1 ring-gray-100 dark:ring-gray-800 bg-gray-100 flex items-center justify-center">
                                                        {item.image ? (
                                                            <img
                                                                src={item.image}
                                                                alt={item.name}
                                                                className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-110"
                                                            />
                                                        ) : (
                                                            <span className="text-xs text-gray-400">No Img</span>
                                                        )}
                                                    </div>
                                                </TableCell>
                                            )}
                                            {visibleColumns.name && (
                                                <TableCell>
                                                    <div className="flex flex-col">
                                                        <span className="font-medium text-gray-900 dark:text-gray-100">{item.name}</span>
                                                        <span className="text-xs text-gray-500 truncate max-w-[200px]">{item.description}</span>
                                                    </div>
                                                </TableCell>
                                            )}
                                            {visibleColumns.category && (
                                                <TableCell>
                                                    <Badge variant="secondary" className="font-normal bg-gray-100 text-gray-600 hover:bg-gray-200 border-gray-200">
                                                        {item.category?.name || "Uncategorized"}
                                                    </Badge>
                                                </TableCell>
                                            )}
                                            {visibleColumns.price && (
                                                <TableCell className="font-semibold text-gray-900 dark:text-gray-100">
                                                    ${item.price?.toFixed(2)}
                                                </TableCell>
                                            )}
                                            {visibleColumns.status && (
                                                <TableCell>
                                                    <Badge variant="outline" className={cn("font-medium", stockStatus.className)}>
                                                        {item.isAvailable ? "In Stock" : "Unavailable"}
                                                    </Badge>
                                                </TableCell>
                                            )}
                                            {visibleColumns.actions && (
                                                <TableCell className="text-right pr-4">
                                                    <DropdownMenu>
                                                        <DropdownMenuTrigger asChild>
                                                            <Button variant="ghost" size="icon" className="h-8 w-8 text-gray-500 hover:text-teal-600">
                                                                <MoreHorizontal className="h-4 w-4" />
                                                            </Button>
                                                        </DropdownMenuTrigger>
                                                        <DropdownMenuContent align="end">
                                                            <DropdownMenuItem
                                                                className="cursor-pointer"
                                                                onClick={() => handleEdit(item)}
                                                            >
                                                                <Pencil className="mr-2 h-4 w-4" /> Edit Details
                                                            </DropdownMenuItem>
                                                            <DropdownMenuItem
                                                                className="cursor-pointer text-red-600 focus:text-red-600"
                                                                onClick={() => handleDelete(item._id)}
                                                            >
                                                                <Trash2 className="mr-2 h-4 w-4" /> Delete Item
                                                            </DropdownMenuItem>
                                                        </DropdownMenuContent>
                                                    </DropdownMenu>
                                                </TableCell>
                                            )}
                                        </TableRow>
                                    )
                                })
                            )}
                        </TableBody>
                    </Table>
                </div>

                {/* Pagination */}
                <div className="p-4 border-t flex items-center justify-between">
                    <div className="text-sm text-muted-foreground">
                        Showing <span className="font-medium text-foreground">
                            {menu.length > 0 ? (paginationMenu.currentPage - 1) * paginationMenu.limit + 1 : 0}-
                            {Math.min(paginationMenu.currentPage * paginationMenu.limit, paginationMenu.totalItems)}
                        </span> of <span className="font-medium text-foreground">{paginationMenu.totalItems}</span> items
                    </div>
                    <div className="flex items-center gap-2">
                        <Button
                            variant="outline"
                            size="sm"
                            disabled={paginationMenu.currentPage === 1}
                            onClick={() => handlePageChange(paginationMenu.currentPage - 1)}
                        >
                            <ChevronLeft className="h-4 w-4 mr-2" />
                            Previous
                        </Button>
                        <Button
                            variant="outline"
                            size="sm"
                            disabled={paginationMenu.currentPage === paginationMenu.totalPages}
                            onClick={() => handlePageChange(paginationMenu.currentPage + 1)}
                        >
                            Next
                            <ChevronRight className="h-4 w-4 ml-2" />
                        </Button>
                    </div>
                </div>
            </Card>

            {/* Add/Edit Item Modal */}
            {isDialogOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm animate-in fade-in duration-200 p-4">
                    <div className="w-full max-w-4xl bg-white dark:bg-teal-900/20 rounded-xl shadow-2xl border border-gray-200 dark:border-gray-800 overflow-hidden animate-in zoom-in-95 duration-200 flex flex-col max-h-[90vh]">

                        {/* Modal Header */}
                        <div className="px-6 py-4 border-b border-gray-100 dark:border-gray-800 flex items-center justify-between bg-gray-50/50 dark:bg-teal-900/50">
                            <div>
                                <h2 className="text-lg font-semibold text-gray-900 dark:text-white">{isEditMode ? "Edit Menu Item" : "Add New Menu Item"}</h2>
                                <p className="text-sm text-muted-foreground">{isEditMode ? "Update details for this menu item." : "Fill in the details to add a new dish to your menu."}</p>
                            </div>
                            <Button
                                variant="destructive"
                                size="icon"
                                className="h-8 w-8 rounded-full text-white hover:bg-red-600 hover:text-white dark:hover:bg-red-600/50 dark:hover:text-white"
                                onClick={() => setIsDialogOpen(false)}
                            >
                                <X className="h-4 w-4" />
                            </Button>
                        </div>

                        {/* Modal Body - Scrollable */}
                        <div className="flex-1 overflow-y-auto p-6">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">

                                {/* Left Column: Basic Info & Image */}
                                <div className="space-y-6">
                                    {/* Image Upload */}
                                    <div className="space-y-2">
                                        <Label className="text-gray-700 dark:text-gray-300">Item Image</Label>
                                        <div className="border-2 border-dashed border-gray-200 dark:border-gray-700 rounded-lg p-8 flex flex-col items-center text-center hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors cursor-pointer relative bg-gray-50/30">

                                            {imagePreview ? (
                                                <div className="relative w-full h-40 flex items-center justify-center">
                                                    <img src={imagePreview} alt="Preview" className="h-full w-full object-contain rounded-md" />
                                                    <Button
                                                        type="button"
                                                        variant="destructive"
                                                        size="icon"
                                                        className="absolute top-2 right-2 h-6 w-6 rounded-full shadow-md z-10"
                                                        onClick={handleRemoveImage}
                                                    >
                                                        <X className="h-3 w-3" />
                                                    </Button>
                                                </div>
                                            ) : (
                                                <>
                                                    <Input
                                                        type="file"
                                                        className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                                                        onChange={handleFileChange}
                                                        accept="image/*"
                                                    />
                                                    <div className="h-12 w-12 bg-teal-50 dark:bg-teal-900/20 rounded-full flex items-center justify-center mb-3 text-teal-600 dark:text-teal-400">
                                                        <Upload className="h-6 w-6" />
                                                    </div>
                                                    <p className="text-sm font-medium text-gray-900 dark:text-gray-100">
                                                        {fileName || "Drag and drop or click to upload"}
                                                    </p>
                                                    <p className="text-xs text-gray-500 mt-1">PNG, JPG, GIF up to 5MB</p>
                                                </>
                                            )}
                                        </div>
                                    </div>

                                    {/* Basic Details */}
                                    <div className="space-y-4">
                                        <div className="space-y-2">
                                            <Label htmlFor="name">Item Name <span className="text-red-500">*</span></Label>
                                            <Input
                                                id="name"
                                                placeholder="e.g., Spicy Beef Burger"
                                                className="focus-visible:ring-teal-500"
                                                value={formData.name}
                                                onChange={handleInputChange}
                                            />
                                        </div>

                                        <div className="grid grid-cols-2 gap-4">
                                            <div className="space-y-2">
                                                <Label htmlFor="price">Base Price ($) <span className="text-red-500">*</span></Label>
                                                <Input
                                                    id="price"
                                                    type="number"
                                                    placeholder="0.00"
                                                    className="focus-visible:ring-teal-500"
                                                    value={formData.price}
                                                    onChange={handleInputChange}
                                                />
                                            </div>
                                            <div className="space-y-2">
                                                <Label htmlFor="category">Category <span className="text-red-500">*</span></Label>
                                                <select
                                                    id="category"
                                                    className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-teal-500 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                                                    value={formData.category}
                                                    onChange={handleInputChange}
                                                >
                                                    <option value="">Select Category</option>
                                                    {category.map((cat) => (
                                                        <option key={cat._id} value={cat._id}>{cat.name}</option>
                                                    ))}
                                                </select>
                                            </div>
                                        </div>

                                        <div className="space-y-2">
                                            <Label htmlFor="description">Description</Label>
                                            <Textarea
                                                id="description"
                                                placeholder="Brief description of the item..."
                                                className="min-h-[80px] resize-none focus-visible:ring-teal-500"
                                                value={formData.description}
                                                onChange={handleInputChange}
                                            />
                                        </div>
                                    </div>
                                </div>

                                {/* Right Column: Configuration & Variants */}
                                <div className="space-y-6">

                                    {/* Settings Grid */}
                                    <div className="grid grid-cols-2 gap-4 p-4 bg-gray-50 dark:bg-gray-900/50 rounded-lg border border-gray-100 dark:border-gray-800">
                                        <div className="space-y-2">
                                            <Label>Dietary Preference</Label>
                                            <div className="flex gap-2">
                                                <Button
                                                    type="button"
                                                    variant={isVeg ? "default" : "outline"}
                                                    onClick={() => setIsVeg(true)}
                                                    className={cn("flex-1 h-8 text-xs", isVeg ? "bg-green-600 hover:bg-green-700" : "hover:text-green-600")}
                                                >
                                                    <Leaf className="h-3 w-3 mr-1" /> Veg
                                                </Button>
                                                <Button
                                                    type="button"
                                                    variant={!isVeg ? "default" : "outline"}
                                                    onClick={() => setIsVeg(false)}
                                                    className={cn("flex-1 h-8 text-xs", !isVeg ? "bg-red-600 hover:bg-red-700" : "hover:text-red-600")}
                                                >
                                                    Non-Veg
                                                </Button>
                                            </div>
                                        </div>

                                        <div className="space-y-2">
                                            <Label>Spice Level</Label>
                                            <select
                                                value={spiceLevel}
                                                onChange={(e) => setSpiceLevel(e.target.value)}
                                                className="flex h-8 w-full rounded-md border border-input bg-background px-2 py-1 text-xs focus-visible:ring-teal-500"
                                            >
                                                <option value="mild">Mild</option>
                                                <option value="medium">Medium</option>
                                                <option value="hot">Hot</option>
                                                <option value="extra_hot">Extra Hot</option>
                                            </select>
                                        </div>

                                        <div className="space-y-2">
                                            <Label>Prep Time (mins)</Label>
                                            <div className="relative">
                                                <Clock className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3 w-3 text-gray-500" />
                                                <Input
                                                    id="preparationTime"
                                                    type="number"
                                                    value={formData.preparationTime}
                                                    onChange={handleInputChange}
                                                    className="h-8 pl-8 text-xs focus-visible:ring-teal-500"
                                                />
                                            </div>
                                        </div>

                                        <div className="space-y-2">
                                            <Label>Tax Rate (%)</Label>
                                            <Input
                                                id="taxRate"
                                                type="number"
                                                value={formData.taxRate}
                                                onChange={handleInputChange}
                                                className="h-8 text-xs focus-visible:ring-teal-500"
                                            />
                                        </div>
                                    </div>

                                    {/* Variants Section */}
                                    <div className="space-y-3">
                                        <div className="flex items-center justify-between">
                                            <Label className="text-gray-900 dark:text-gray-100 font-medium">Variants</Label>
                                            <Button type="button" variant="outline" size="sm" onClick={addVariant} className="h-7 text-xs border-dashed border-teal-200 text-teal-700 hover:bg-teal-50">
                                                <Plus className="h-3 w-3 mr-1" /> Add Variant
                                            </Button>
                                        </div>

                                        <div className="space-y-2 max-h-[150px] overflow-y-auto pr-2 scrollbar-hide">
                                            {variants.map((variant, index) => (
                                                <div key={index} className="flex items-center gap-2 animate-in slide-in-from-left-5 duration-200">
                                                    <Input
                                                        placeholder="Name (e.g., Large)"
                                                        value={variant.name}
                                                        onChange={(e) => updateVariant(index, 'name', e.target.value)}
                                                        className="h-9 text-sm focus-visible:ring-teal-500"
                                                    />
                                                    <Input
                                                        type="number"
                                                        placeholder="Price"
                                                        value={variant.price}
                                                        onChange={(e) => updateVariant(index, 'price', e.target.value)}
                                                        className="h-9 w-24 text-sm focus-visible:ring-teal-500"
                                                    />
                                                    {variants.length > 1 && (
                                                        <Button
                                                            type="button"
                                                            variant="ghost"
                                                            size="icon"
                                                            onClick={() => removeVariant(index)}
                                                            className="h-9 w-9 text-red-500 hover:bg-red-50 hover:text-red-600"
                                                        >
                                                            <Trash2 className="h-4 w-4" />
                                                        </Button>
                                                    )}
                                                </div>
                                            ))}
                                        </div>
                                    </div>

                                    {/* Availability */}
                                    <div className="flex items-center space-x-2 border rounded-lg p-3 bg-gray-50/50 dark:bg-gray-800/50 border-gray-100 dark:border-gray-800">
                                        <Checkbox
                                            id="available"
                                            checked={isAvailable}
                                            onCheckedChange={setIsAvailable}
                                            className="data-[state=checked]:bg-teal-600 data-[state=checked]:border-teal-600"
                                        />
                                        <div className="grid gap-1.5 leading-none">
                                            <label
                                                htmlFor="available"
                                                className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer"
                                            >
                                                Available for Ordering
                                            </label>
                                            <p className="text-xs text-muted-foreground">
                                                Uncheck to hide this item from the menu temporarily.
                                            </p>
                                        </div>
                                    </div>

                                </div>
                            </div>
                        </div>

                        {/* Modal Footer */}
                        <div className="px-6 py-4 bg-gray-50/50 dark:bg-teal-900/50 border-t border-gray-100 dark:border-gray-800 flex justify-end gap-3">
                            <Button
                                variant="outline"
                                onClick={() => setIsDialogOpen(false)}
                                className="hover:bg-red-600 hover:text-white bg-red-800/80 text-white"
                            >
                                Cancel
                            </Button>
                            <Button
                                className="bg-teal-600 hover:bg-teal-700 text-white shadow-md w-32"
                                onClick={handleSubmit}
                                disabled={isLoading}
                            >
                                {isLoading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
                                {isLoading ? (isEditMode ? "Updating..." : "Saving...") : (isEditMode ? "Update Item" : "Save Item")}
                            </Button>
                        </div>

                    </div>
                </div>
            )}
        </div>
    )
}

export default AddMenu