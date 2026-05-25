import React, { useEffect, useState } from 'react';
import useClientStore from '@/store/useClientStore';
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
    Search,
    User,
    Phone,
    Mail,
    Calendar,
    DollarSign,
    MoreVertical,
    Eye,
    Trash2,
    Loader2
} from 'lucide-react';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import Pagination from '@/components/ui/custom-pagination';

const Customer = () => {
    const { clients, fetchClients, deleteClient, isLoading, pagination } = useClientStore();
    const [searchTerm, setSearchTerm] = useState("");

    useEffect(() => {
        fetchClients(1, 10);
    }, [fetchClients]);

    const handlePageChange = (newPage) => {
        fetchClients(newPage, 10);
    };

    const filteredClients = clients.filter(client =>
        client.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        client.phone?.includes(searchTerm) ||
        client.email?.toLowerCase().includes(searchTerm.toLowerCase())
    );

    const formatDate = (dateString) => {
        if (!dateString) return 'Never';
        return new Date(dateString).toLocaleDateString('en-US', {
            month: 'short',
            day: 'numeric',
            year: 'numeric'
        });
    };

    return (
        <div className="p-6 space-y-6 bg-gray-50/50 dark:bg-transparent min-h-[calc(100vh-5rem)]">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">Customers</h1>
                    <p className="text-muted-foreground mt-1">
                        Manage your customer database and view their order history
                    </p>
                </div>
                <div className="flex items-center gap-3">
                    <div className="relative w-full md:w-72">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                        <Input
                            placeholder="Search customers..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="pl-9 bg-white dark:bg-gray-900"
                        />
                    </div>
                </div>
            </div>

            <div className="bg-card rounded-xl border shadow-sm overflow-hidden">
                <Table>
                    <TableHeader className="bg-gray-50 dark:bg-gray-800/50">
                        <TableRow>
                            <TableHead className="w-[250px]">Customer</TableHead>
                            <TableHead>Contact Info</TableHead>
                            <TableHead>Activity</TableHead>
                            <TableHead>Financials</TableHead>
                            <TableHead className="text-right">Actions</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {isLoading ? (
                            <TableRow>
                                <TableCell colSpan={5} className="h-64 text-center">
                                    <div className="flex flex-col items-center justify-center gap-2">
                                        <Loader2 className="h-8 w-8 animate-spin text-teal-600" />
                                        <p className="text-sm text-muted-foreground font-medium">Loading customers...</p>
                                    </div>
                                </TableCell>
                            </TableRow>
                        ) : filteredClients.length === 0 ? (
                            <TableRow>
                                <TableCell colSpan={5} className="h-64 text-center">
                                    <div className="flex flex-col items-center justify-center gap-2 opacity-50">
                                        <User className="h-10 w-10 text-muted-foreground" />
                                        <p className="text-lg font-medium">No customers found</p>
                                        <p className="text-sm text-muted-foreground">Try adjusting your search terms</p>
                                    </div>
                                </TableCell>
                            </TableRow>
                        ) : (
                            filteredClients.map((client) => (
                                <TableRow key={client._id} className="hover:bg-muted/50 transition-colors">
                                    <TableCell>
                                        <div className="flex items-center gap-3">
                                            <div className="h-10 w-10 rounded-full bg-teal-100 dark:bg-teal-900/30 flex items-center justify-center text-teal-700 dark:text-teal-400 font-bold">
                                                {client.name?.charAt(0).toUpperCase()}
                                            </div>
                                            <div className="flex flex-col">
                                                <span className="font-bold text-sm">{client.name}</span>
                                                <span className="text-xs text-muted-foreground">ID: {client._id.slice(-6).toUpperCase()}</span>
                                            </div>
                                        </div>
                                    </TableCell>
                                    <TableCell>
                                        <div className="flex flex-col gap-1">
                                            <div className="flex items-center gap-2 text-xs text-muted-foreground">
                                                <Phone className="h-3 w-3" />
                                                {client.phone}
                                            </div>
                                            {client.email && (
                                                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                                                    <Mail className="h-3 w-3" />
                                                    {client.email}
                                                </div>
                                            )}
                                        </div>
                                    </TableCell>
                                    <TableCell>
                                        <div className="flex flex-col gap-1">
                                            <div className="flex items-center gap-2 text-xs">
                                                <Calendar className="h-3 w-3 text-muted-foreground" />
                                                <span className="text-muted-foreground">Last visit:</span>
                                                <span className="font-medium">{formatDate(client.lastVisit)}</span>
                                            </div>
                                            <div className="flex items-center gap-2 text-xs">
                                                <Badge variant="secondary" className="text-[10px] font-bold px-1.5 h-4">
                                                    {client.orderCount || 0} Orders
                                                </Badge>
                                            </div>
                                        </div>
                                    </TableCell>
                                    <TableCell>
                                        <div className="flex flex-col gap-1">
                                            <div className="flex items-center gap-1 text-sm font-bold text-teal-600 dark:text-teal-400">
                                                <DollarSign className="h-3 w-3" />
                                                {client.totalSpent?.toLocaleString() || 0}
                                            </div>
                                            <span className="text-[10px] uppercase tracking-wider text-muted-foreground font-bold">Total Revenue</span>
                                        </div>
                                    </TableCell>
                                    <TableCell className="text-right">
                                        <DropdownMenu>
                                            <DropdownMenuTrigger asChild>
                                                <Button variant="ghost" size="icon" className="h-8 w-8">
                                                    <MoreVertical className="h-4 w-4" />
                                                </Button>
                                            </DropdownMenuTrigger>
                                            <DropdownMenuContent align="end" className="w-48">
                                                <DropdownMenuLabel>Customer Actions</DropdownMenuLabel>
                                                <DropdownMenuSeparator />
                                                <DropdownMenuItem className="gap-2">
                                                    <Eye className="h-4 w-4 text-teal-600" />
                                                    View Profile
                                                </DropdownMenuItem>
                                                <DropdownMenuItem className="gap-2">
                                                    <Calendar className="h-4 w-4 text-blue-600" />
                                                    Order History
                                                </DropdownMenuItem>
                                                <DropdownMenuSeparator />
                                                <DropdownMenuItem
                                                    className="gap-2 text-destructive focus:text-destructive"
                                                    onClick={() => {
                                                        if (window.confirm("Are you sure you want to delete this customer?")) {
                                                            deleteClient(client._id);
                                                        }
                                                    }}
                                                >
                                                    <Trash2 className="h-4 w-4" />
                                                    Delete Record
                                                </DropdownMenuItem>
                                            </DropdownMenuContent>
                                        </DropdownMenu>
                                    </TableCell>
                                </TableRow>
                            ))
                        )}
                    </TableBody>
                </Table>

                <div className="p-4 border-t bg-gray-50/30 dark:bg-gray-800/10">
                    <Pagination
                        pagination={pagination}
                        onPageChange={handlePageChange}
                    />
                </div>
            </div>
        </div>
    );
};

export default Customer;