import React, { useState, useEffect } from 'react'
import { Plus, Search, Filter, Pencil, Trash2, MoreHorizontal, ArrowUpDown, X, Upload, Image as ImageIcon, Loader2 } from 'lucide-react'
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
import { useMenuStore } from '@/store/useMenuStore'


const AddCategory = () => {
    const { category, getAllCategories, createCategory, updateCategory, deleteCategory, isLoading } = useMenuStore();

    const [isDialogOpen, setIsDialogOpen] = useState(false);
    const [fileName, setFileName] = useState("");
    const [imagePreview, setImagePreview] = useState(null);
    const [editingId, setEditingId] = useState(null);

    // Derived state for title/button text
    const isEditMode = !!editingId;

    const [formData, setFormData] = useState({
        name: "",
        description: "",
        image: null
    });

    useEffect(() => {
        getAllCategories();
    }, [getAllCategories]);

    // Reset form when dialog closes
    useEffect(() => {
        if (!isDialogOpen) {
            // eslint-disable-next-line react-hooks/set-state-in-effect
            setFormData({ name: "", description: "", image: null });
            setFileName("");
            setImagePreview(null);
            setEditingId(null);
        }
    }, [isDialogOpen]);

    const handleFileChange = (e) => {
        const file = e.target.files?.[0];
        if (file) {
            setFileName(file.name);
            setFormData({ ...formData, image: file });
            setImagePreview(URL.createObjectURL(file));
        }
    };

    const handleRemoveImage = (e) => {
        e.stopPropagation(); // Prevent triggering file input
        setFormData({ ...formData, image: null });
        setFileName("");
        setImagePreview(null);
    };

    const handleInputChange = (e) => {
        setFormData({ ...formData, [e.target.id]: e.target.value });
    };

    const handleEdit = (item) => {
        setFormData({
            name: item.name,
            description: item.description,
            image: item.image // Keep existing string URL if not changing
        });
        setFileName(item.image ? "Existing Image" : "");
        setImagePreview(item.image);
        setEditingId(item._id);
        setIsDialogOpen(true);
    };

    const handleSubmit = async () => {
        if (!formData.name) {
            alert("Category Name is required");
            return;
        }

        const data = new FormData();
        data.append("name", formData.name);
        data.append("description", formData.description);

        // Handle image:
        // 1. If it's a File object (user uploaded new), append it.
        // 2. If it's a string (existing URL) AND we are in edit mode, we can append it or backend handles "no new file" = "keep old".
        //    Actually, our backend checks `req.file` then `req.body.image`.
        //    If user didn't change image in Edit, `formData.image` is URL string.
        //    If user removed image, `formData.image` is null.
        if (formData.image) {
            data.append("image", formData.image);
        } else {
            // explicitly send empty string if removed, so backend knows? 
            // Current backend logic: `if (req.file) ... else if (req.body.image) ...`
            // If we send nothing, and `req.body.image` is undefined, `updateData.image` won't be set, so old image persists (which is good if just editing text).
            // BUT if user explicitly REMOVED image, we want to clear it?
            // Current backend implementation doesn't look like it supports "clearing" an image easily unless we send empty string and backend handles it.
            // For now, let's assume standard behavior: if no new file, keep old.
            // If user explicitly removed (preview is null), we might want to allow clearing.
        }

        try {
            if (isEditMode) {
                await updateCategory(editingId, data);
                alert("Category updated successfully!");
            } else {
                await createCategory(data);
                alert("Category created successfully!");
            }
            setIsDialogOpen(false);
        } catch (error) {
            console.error(error);
            alert(`Failed to ${isEditMode ? 'update' : 'create'} category`);
        }
    };

    const handleDelete = async (id) => {
        if (window.confirm("Are you sure you want to delete this category?")) {
            try {
                await deleteCategory(id);
            } catch (error) {
                alert("Failed to delete category");
                console.log(error)
            }
        }
    }

    return (
        <div className="w-full h-[calc(100vh-5rem)] p-6 bg-gray-50/50 dark:bg-transparent flex flex-col gap-6 relative">

            {/* Header Section */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold tracking-tight text-gray-900 dark:text-white">Category Management</h1>
                    <p className="text-sm text-muted-foreground mt-1">Organize your menu items into categories.</p>
                </div>

                <Button
                    onClick={() => setIsDialogOpen(true)}
                    className="bg-teal-600 hover:bg-teal-700 text-white shadow-sm transition-all hover:scale-105 active:scale-95 rounded-full"
                >
                    <Plus className="h-4 w-4 mr-2" />
                    Add New Category
                </Button>
            </div>

            {/* Main Content Card */}
            <Card className="flex-1 flex flex-col overflow-hidden border-none shadow-sm bg-white dark:bg-teal-900/20 ring-1 ring-gray-200 dark:ring-gray-800">

                {/* Toolbar */}
                <div className="p-4 border-b flex flex-col sm:flex-row items-center justify-between gap-4">
                    <div className="relative w-full sm:w-[300px]">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                        <Input
                            placeholder="Search categories..."
                            className="pl-9 h-10 w-full bg-gray-50 dark:bg-accent/20 border-gray-200 dark:border-gray-700 focus-visible:ring-teal-500"
                        />
                    </div>

                    <div className="flex items-center gap-2 w-full sm:w-auto">
                        <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                                <Button variant="outline" size="sm" className="h-10 ml-auto sm:ml-0">
                                    <Filter className="mr-2 h-4 w-4" />
                                    Sort By
                                </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                                <DropdownMenuLabel>Sort Options</DropdownMenuLabel>
                                <DropdownMenuSeparator />
                                <DropdownMenuItem>Name (A-Z)</DropdownMenuItem>
                                <DropdownMenuItem>Item Count (High-Low)</DropdownMenuItem>
                                <DropdownMenuItem>Newest First</DropdownMenuItem>
                            </DropdownMenuContent>
                        </DropdownMenu>
                    </div>
                </div>

                {/* Table */}
                <div className="flex-1 overflow-auto">
                    <Table>
                        <TableHeader>
                            <TableRow className="hover:bg-transparent border-gray-100 dark:border-gray-800">
                                <TableHead className="w-[40px] pl-4"><Checkbox /></TableHead>
                                <TableHead className="w-[80px]">Id</TableHead>
                                <TableHead className="w-[80px]">Image</TableHead>
                                <TableHead className="min-w-[150px]">Name</TableHead>
                                <TableHead>Description</TableHead>
                                {/* <TableHead>Items</TableHead> */}
                                <TableHead className="text-right pr-4">Actions</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {category.length === 0 ? (
                                <TableRow>
                                    <TableCell colSpan={6} className="text-center py-10 text-gray-500">
                                        No categories found. Create one to get started.
                                    </TableCell>
                                </TableRow>
                            ) : (
                                category.map((item, index) => (
                                    <TableRow key={item._id || index} className="hover:bg-teal-50/30 dark:hover:bg-teal-900/10 border-gray-100 dark:border-gray-800 transition-colors cursor-pointer group">
                                        <TableCell className="pl-4"><Checkbox /></TableCell>
                                        <TableCell className="font-medium text-gray-500 text-xs">#{index + 1}</TableCell>
                                        <TableCell>
                                            <div className="h-10 w-10 rounded-lg overflow-hidden ring-1 ring-gray-100 dark:ring-gray-800 bg-gray-100 flex items-center justify-center">
                                                {item.image ? (
                                                    <img src={item.image} alt={item.name} className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-110" />
                                                ) : (
                                                    <ImageIcon className="h-5 w-5 text-gray-400" />
                                                )}
                                            </div>
                                        </TableCell>
                                        <TableCell className="font-semibold text-gray-900 dark:text-gray-100">{item.name}</TableCell>
                                        <TableCell className="text-gray-500 text-sm max-w-[300px] truncate">{item.description}</TableCell>
                                        {/* <TableCell>
                                        <Badge variant="secondary" className="bg-teal-50 text-teal-700 dark:bg-teal-900/30 dark:text-teal-300 hover:bg-teal-100 border-none">
                                            {item.count || 0} Items
                                        </Badge>
                                    </TableCell> */}
                                        <TableCell className="text-right pr-4">
                                            <div className="flex items-center justify-end gap-2 text-gray-400">
                                                <Button
                                                    variant="ghost"
                                                    size="icon"
                                                    className="h-8 w-8 hover:text-teal-600 hover:bg-teal-50"
                                                    onClick={(e) => { e.stopPropagation(); handleEdit(item); }}
                                                >
                                                    <Pencil className="h-4 w-4" />
                                                </Button>
                                                <Button
                                                    variant="ghost"
                                                    size="icon"
                                                    className="h-8 w-8 hover:text-red-600 hover:bg-red-50"
                                                    onClick={(e) => { e.stopPropagation(); handleDelete(item._id); }}
                                                >
                                                    <Trash2 className="h-4 w-4" />
                                                </Button>
                                            </div>
                                        </TableCell>
                                    </TableRow>
                                ))
                            )}
                        </TableBody>
                    </Table>
                </div>
            </Card>

            {/* Custom Modal/Popup for Add/Edit Category */}
            {isDialogOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm animate-in fade-in duration-200">
                    <div className="w-full max-w-lg bg-white dark:bg-teal-900/20 rounded-xl shadow-2xl border border-gray-200 dark:border-gray-800 overflow-hidden animate-in zoom-in-95 duration-200 mx-4">

                        {/* Modal Header */}
                        <div className="px-6 py-4 border-b border-gray-100 dark:border-gray-800 flex items-center justify-between bg-gray-50/50 dark:bg-teal-900/50">
                            <div>
                                <h2 className="text-lg font-semibold text-gray-900 dark:text-white">{isEditMode ? "Edit Category" : "Add New Category"}</h2>
                                <p className="text-sm text-muted-foreground">{isEditMode ? "Update category details." : "Create a new category for your menu."}</p>
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

                        {/* Modal Body */}
                        <div className="p-6 space-y-4">

                            {/* Name Input */}
                            <div className="space-y-2">
                                <Label htmlFor="name" className="text-gray-700 dark:text-gray-300">Category Name</Label>
                                <Input
                                    id="name"
                                    placeholder="e.g., Seafood, Desserts"
                                    className="focus-visible:ring-teal-500"
                                    value={formData.name}
                                    onChange={handleInputChange}
                                />
                            </div>

                            {/* Description Input */}
                            <div className="space-y-2">
                                <Label htmlFor="description" className="text-gray-700 dark:text-gray-300">Description</Label>
                                <Textarea
                                    id="description"
                                    placeholder="Brief description of the category..."
                                    className="min-h-[100px] resize-none focus-visible:ring-teal-500"
                                    value={formData.description}
                                    onChange={handleInputChange}
                                />
                            </div>

                            {/* Image Upload */}
                            <div className="space-y-2">
                                <Label className="text-gray-700 dark:text-gray-300">Category Image</Label>
                                <div className="border-2 border-dashed border-gray-200 dark:border-gray-700 rounded-lg p-6 flex flex-col items-center text-center hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors cursor-pointer relative">

                                    {imagePreview ? (
                                        <div className="relative w-full h-40 flex items-center justify-center">
                                            <img src={imagePreview} alt="Preview" className="h-full w-full object-contain rounded-md" />
                                            <Button
                                                type="button"
                                                variant="destructive"
                                                size="icon"
                                                className="absolute top-2 right-2 h-6 w-6 rounded-full shadow-md"
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
                                            <div className="h-10 w-10 bg-teal-50 dark:bg-teal-900/20 rounded-full flex items-center justify-center mb-3">
                                                <Upload className="h-5 w-5 text-teal-600 dark:text-teal-400" />
                                            </div>
                                            <p className="text-sm font-medium text-gray-900 dark:text-gray-100">
                                                {fileName || "Click to upload image"}
                                            </p>
                                            <p className="text-xs text-gray-500 mt-1">SVG, PNG, JPG or GIF (max. 800x400px)</p>
                                        </>
                                    )}
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
                                className="bg-teal-600 hover:bg-teal-700 text-white shadow-md"
                                onClick={handleSubmit}
                                disabled={isLoading}
                            >
                                {isLoading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
                                {isLoading ? (isEditMode ? "Updating..." : "Creating...") : (isEditMode ? "Update Category" : "Create Category")}
                            </Button>
                        </div>

                    </div>
                </div>
            )}
        </div>
    )
}

export default AddCategory