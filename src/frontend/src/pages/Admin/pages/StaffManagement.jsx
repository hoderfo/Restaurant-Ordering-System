import React, { useEffect, useState } from "react";
import {
    Plus, Search, UserCog, ShieldCheck, Clock, Mail, Phone,
    MoreHorizontal, Edit, Trash2, ShieldAlert, CheckCircle2, XCircle
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
    Table, TableBody, TableCell, TableHead, TableHeader, TableRow
} from "@/components/ui/table";
import {
    Dialog, DialogContent, DialogDescription, DialogFooter,
    DialogHeader, DialogTitle, DialogTrigger
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import {
    DropdownMenu, DropdownMenuContent, DropdownMenuItem,
    DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger
} from "@/components/ui/dropdown-menu";
import { Checkbox } from "@/components/ui/checkbox";
import { ScrollArea } from "@/components/ui/scroll-area";
import useUserStore from "@/store/useUserStore";

const StaffManagement = () => {
    const { staff, isLoading, fetchStaff, createNewStaff, updateStaff, toggleStaffStatus, deleteStaff } = useUserStore();
    const [searchTerm, setSearchTerm] = useState("");
    const [isAddModalOpen, setIsAddModalOpen] = useState(false);
    const [editingStaff, setEditingStaff] = useState(null);

    // Form State
    const [formData, setFormData] = useState({
        name: "",
        email: "",
        password: "",
        role: "cashier",
        designation: "",
        phoneNumber: "",
        pin: "",
        shift: { start: "09:00", end: "17:00" },
        permissions: []
    });

    useEffect(() => {
        fetchStaff();
    }, [fetchStaff]);

    useEffect(() => {
        if (editingStaff) {
            // eslint-disable-next-line react-hooks/set-state-in-effect
            setFormData({
                name: editingStaff.name || "",
                email: editingStaff.email || "",
                password: "", // Don't show password
                role: editingStaff.role || "cashier",
                designation: editingStaff.designation || "",
                phoneNumber: editingStaff.phoneNumber || "",
                pin: editingStaff.pin || "",
                shift: editingStaff.shift || { start: "09:00", end: "17:00" },
                permissions: editingStaff.permissions || []
            });
            setIsAddModalOpen(true);
        }
    }, [editingStaff]);

    const handleCloseModal = () => {
        setIsAddModalOpen(false);
        setEditingStaff(null);
        setFormData({
            name: "", email: "", password: "", role: "cashier",
            designation: "", phoneNumber: "", pin: "",
            shift: { start: "09:00", end: "17:00" }, permissions: []
        });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        let success;
        if (editingStaff) {
            success = await updateStaff(editingStaff._id, formData);
        } else {
            success = await createNewStaff(formData);
        }
        if (success) handleCloseModal();
    };

    const handlePermissionChange = (perm) => {
        setFormData(prev => ({
            ...prev,
            permissions: prev.permissions.includes(perm)
                ? prev.permissions.filter(p => p !== perm)
                : [...prev.permissions, perm]
        }));
    };

    const roles = ["admin", "manager", "cashier", "waiter", "kitchen"];
    const commonPermissions = [
        "manage_orders", "manage_inventory", "view_reports",
        "manage_tables", "manage_menu", "manage_staff"
    ];

    const filteredStaff = staff.filter(s =>
        s.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        s.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
        s.role.toLowerCase().includes(searchTerm.toLowerCase())
    );

    return (
        <div className="p-6 space-y-6 bg-background min-h-screen">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">Staff Management</h1>
                    <p className="text-muted-foreground">Manage your team, roles, and system access.</p>
                </div>
                <div className="flex gap-2">
                    <Button onClick={() => setIsAddModalOpen(true)} className="bg-teal-700 hover:bg-teal-800">
                        <Plus className="size-4 mr-2" /> Add Staff Member
                    </Button>
                </div>
            </div>

            {/* Filters & Search */}
            <Card>
                <CardContent className="p-4">
                    <div className="relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
                        <Input
                            placeholder="Search by name, email, or role..."
                            className="pl-10"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                    </div>
                </CardContent>
            </Card>

            {/* Staff List */}
            <Card>
                <CardHeader>
                    <CardTitle>Team Directory</CardTitle>
                    <CardDescription>A list of all registered staff members excluding clients.</CardDescription>
                </CardHeader>
                <CardContent>
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Staff Member</TableHead>
                                <TableHead>Role</TableHead>
                                <TableHead>Shift</TableHead>
                                <TableHead>Status</TableHead>
                                <TableHead className="text-right">Actions</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {filteredStaff.map((person) => (
                                <TableRow key={person._id} className="group">
                                    <TableCell>
                                        <div className="flex items-center gap-3">
                                            <div className="size-10 bg-muted rounded-full flex items-center justify-center font-bold text-teal-700">
                                                {person.name.charAt(0)}
                                            </div>
                                            <div>
                                                <p className="font-medium">{person.name}</p>
                                                <p className="text-xs text-muted-foreground">{person.email}</p>
                                            </div>
                                        </div>
                                    </TableCell>
                                    <TableCell>
                                        <Badge variant="outline" className="capitalize">{person.role}</Badge>
                                        <p className="text-[10px] text-muted-foreground mt-1">{person.designation || "No designation"}</p>
                                    </TableCell>
                                    <TableCell>
                                        <div className="flex items-center gap-1 text-sm">
                                            <Clock className="size-3 text-muted-foreground" />
                                            {person.shift?.start} - {person.shift?.end}
                                        </div>
                                    </TableCell>
                                    <TableCell>
                                        <div className="flex items-center gap-2">
                                            {person.isActive ? (
                                                <Badge className="bg-emerald-500/10 text-emerald-600 border-emerald-500/20">Active</Badge>
                                            ) : (
                                                <Badge variant="secondary" className="text-muted-foreground">Inactive</Badge>
                                            )}
                                        </div>
                                    </TableCell>
                                    <TableCell className="text-right">
                                        <DropdownMenu>
                                            <DropdownMenuTrigger asChild>
                                                <Button variant="ghost" size="icon"><MoreHorizontal className="size-4" /></Button>
                                            </DropdownMenuTrigger>
                                            <DropdownMenuContent align="end">
                                                <DropdownMenuLabel>Actions</DropdownMenuLabel>
                                                <DropdownMenuItem onClick={() => setEditingStaff(person)}>
                                                    <Edit className="size-4 mr-2" /> Edit Details
                                                </DropdownMenuItem>
                                                <DropdownMenuItem onClick={() => toggleStaffStatus(person._id)}>
                                                    {person.isActive ? <XCircle className="size-4 mr-2" /> : <CheckCircle2 className="size-4 mr-2" />}
                                                    {person.isActive ? "Deactivate" : "Activate"}
                                                </DropdownMenuItem>
                                                <DropdownMenuSeparator />
                                                <DropdownMenuItem className="text-red-600" onClick={() => deleteStaff(person._id)}>
                                                    <Trash2 className="size-4 mr-2" /> Remove Staff
                                                </DropdownMenuItem>
                                            </DropdownMenuContent>
                                        </DropdownMenu>
                                    </TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                </CardContent>
            </Card>

            {/* Add/Edit Modal */}
            <Dialog open={isAddModalOpen} onOpenChange={setIsAddModalOpen}>
                <DialogContent className="max-w-2xl max-h-[90vh] overflow-hidden flex flex-col">
                    <DialogHeader>
                        <DialogTitle>{editingStaff ? "Edit Staff Member" : "Add New Staff Member"}</DialogTitle>
                        <DialogDescription>
                            Fill in the details to manage staff access and roles.
                        </DialogDescription>
                    </DialogHeader>

                    <ScrollArea className="flex-1 pr-4">
                        <form id="staff-form" onSubmit={handleSubmit} className="space-y-6 py-4">
                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <Label htmlFor="name">Full Name</Label>
                                    <Input id="name" required value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })} />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="email">Email</Label>
                                    <Input id="email" type="email" required value={formData.email} onChange={(e) => setFormData({ ...formData, email: e.target.value })} />
                                </div>
                                {!editingStaff && (
                                    <div className="space-y-2">
                                        <Label htmlFor="password">Password</Label>
                                        <Input id="password" type="password" required value={formData.password} onChange={(e) => setFormData({ ...formData, password: e.target.value })} />
                                    </div>
                                )}
                                <div className="space-y-2">
                                    <Label htmlFor="pin">Access PIN</Label>
                                    <Input id="pin" placeholder="4-digit PIN" value={formData.pin} onChange={(e) => setFormData({ ...formData, pin: e.target.value })} />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="role">Role</Label>
                                    <select
                                        id="role"
                                        className="w-full h-10 px-3 py-2 bg-background border rounded-md text-sm outline-none ring-offset-background"
                                        value={formData.role}
                                        onChange={(e) => setFormData({ ...formData, role: e.target.value })}
                                    >
                                        {roles.map(r => <option key={r} value={r}>{r.charAt(0).toUpperCase() + r.slice(1)}</option>)}
                                    </select>
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="designation">Designation</Label>
                                    <Input id="designation" placeholder="e.g. Senior Cashier" value={formData.designation} onChange={(e) => setFormData({ ...formData, designation: e.target.value })} />
                                </div>
                            </div>

                            <div className="space-y-3">
                                <Label>Shift Hours</Label>
                                <div className="flex items-center gap-4">
                                    <div className="flex-1 space-y-1">
                                        <span className="text-[10px] text-muted-foreground uppercase">Starts</span>
                                        <Input type="time" value={formData.shift.start} onChange={(e) => setFormData({ ...formData, shift: { ...formData.shift, start: e.target.value } })} />
                                    </div>
                                    <div className="flex-1 space-y-1">
                                        <span className="text-[10px] text-muted-foreground uppercase">Ends</span>
                                        <Input type="time" value={formData.shift.end} onChange={(e) => setFormData({ ...formData, shift: { ...formData.shift, end: e.target.value } })} />
                                    </div>
                                </div>
                            </div>

                            <div className="space-y-3">
                                <Label className="flex items-center gap-2">
                                    <ShieldCheck className="size-4 text-teal-700" /> System Permissions
                                </Label>
                                <div className="grid grid-cols-2 gap-3 p-4 bg-muted/30 rounded-lg border border-dashed">
                                    {commonPermissions.map(perm => (
                                        <div key={perm} className="flex items-center space-x-2">
                                            <Checkbox
                                                id={perm}
                                                checked={formData.permissions.includes(perm)}
                                                onCheckedChange={() => handlePermissionChange(perm)}
                                            />
                                            <label htmlFor={perm} className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 capitalize cursor-pointer">
                                                {perm.replace("_", " ")}
                                            </label>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </form>
                    </ScrollArea>

                    <DialogFooter className="pt-4 border-t">
                        <Button variant="outline" onClick={handleCloseModal}>Cancel</Button>
                        <Button type="submit" form="staff-form" className="bg-teal-700 hover:bg-teal-800" disabled={isLoading}>
                            {editingStaff ? "Save Changes" : "Create Staff Account"}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
};

export default StaffManagement;
