import React, { useEffect, useState } from "react";
import {
    Search, User, ShoppingBag, Calendar, Phone, Mail,
    ArrowRight, ChevronRight, History, DollarSign, ExternalLink,
    Filter, Download, Trash2, ArrowLeft
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
    Table, TableBody, TableCell, TableHead, TableHeader, TableRow
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import useClientStore from "@/store/useClientStore";
import { format } from "date-fns";

const CustomerHistory = () => {
    const { clients, selectedClient, isLoading, fetchClients, fetchClientHistory, deleteClient, clearSelectedClient } = useClientStore();
    const [searchTerm, setSearchTerm] = useState("");
    const [viewMode, setViewMode] = useState("list"); // "list" or "detail"

    useEffect(() => {
        fetchClients();
    }, [fetchClients]);

    const handleViewDetail = async (id) => {
        await fetchClientHistory(id);
        setViewMode("detail");
    };

    const handleBackToList = () => {
        setViewMode("list");
        clearSelectedClient();
    };

    const filteredClients = clients.filter(c =>
        c.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        c.phone.includes(searchTerm) ||
        (c.email && c.email.toLowerCase().includes(searchTerm.toLowerCase()))
    );

    if (viewMode === "detail" && selectedClient) {
        return (
            <div className="p-6 space-y-6 bg-background min-h-screen animate-in fade-in slide-in-from-right-4 duration-300">
                <div className="flex items-center gap-4">
                    <Button variant="ghost" size="icon" onClick={handleBackToList}>
                        <ArrowLeft className="size-5" />
                    </Button>
                    <div>
                        <h1 className="text-3xl font-bold tracking-tight">Customer Detail</h1>
                        <p className="text-muted-foreground">Detailed purchase history and preferences.</p>
                    </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    {/* Customer Profile Card */}
                    <Card className="lg:col-span-1 border-teal-500/20 shadow-lg">
                        <CardHeader className="text-center pb-2">
                            <div className="size-24 bg-teal-700/10 rounded-full flex items-center justify-center mx-auto mb-4 border-4 border-background shadow-inner">
                                <User className="size-12 text-teal-700" />
                            </div>
                            <CardTitle className="text-2xl">{selectedClient.name}</CardTitle>
                            <CardDescription className="flex items-center justify-center gap-2">
                                <Badge variant="secondary" className="bg-teal-700/10 text-teal-800">Regular Customer</Badge>
                            </CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <Separator />
                            <div className="space-y-3">
                                <div className="flex items-center gap-3 text-sm">
                                    <Phone className="size-4 text-muted-foreground" />
                                    <span>{selectedClient.phone}</span>
                                </div>
                                <div className="flex items-center gap-3 text-sm">
                                    <Mail className="size-4 text-muted-foreground" />
                                    <span>{selectedClient.email || "No email provided"}</span>
                                </div>
                                <div className="flex items-center gap-3 text-sm">
                                    <Calendar className="size-4 text-muted-foreground" />
                                    <span>First Joined: {format(new Date(selectedClient.createdAt), "PPP")}</span>
                                </div>
                            </div>
                            <Separator />
                            <div className="grid grid-cols-2 gap-4">
                                <div className="p-3 bg-muted/40 rounded-lg text-center">
                                    <p className="text-[10px] text-muted-foreground uppercase font-bold tracking-wider">Total Orders</p>
                                    <p className="text-xl font-bold text-teal-700">{selectedClient.orders?.length || 0}</p>
                                </div>
                                <div className="p-3 bg-muted/40 rounded-lg text-center">
                                    <p className="text-[10px] text-muted-foreground uppercase font-bold tracking-wider">Total Spent</p>
                                    <p className="text-xl font-bold text-teal-700">${selectedClient.totalSpent?.toLocaleString()}</p>
                                </div>
                            </div>
                            <Separator />
                            <div className="space-y-2">
                                <Label className="text-xs font-bold text-muted-foreground uppercase">Preferences & Notes</Label>
                                <p className="text-sm p-3 bg-muted/30 rounded-md italic text-muted-foreground">
                                    {selectedClient.preferences || "No specific preferences recorded for this customer."}
                                </p>
                            </div>
                        </CardContent>
                    </Card>

                    {/* Order History Timeline */}
                    <Card className="lg:col-span-2 shadow-sm border-muted">
                        <CardHeader className="flex flex-row items-center justify-between pb-2">
                            <div>
                                <CardTitle className="flex items-center gap-2">
                                    <History className="size-5 text-teal-700" /> Purchase History
                                </CardTitle>
                                <CardDescription>Timeline of all orders placed by this customer.</CardDescription>
                            </div>
                            <Button variant="outline" size="sm">
                                <Download className="size-4 mr-2" /> Export History
                            </Button>
                        </CardHeader>
                        <CardContent>
                            <ScrollArea className="h-[600px] pr-4">
                                <div className="space-y-4">
                                    {(selectedClient.orders || []).length === 0 ? (
                                        <div className="text-center py-20 text-muted-foreground">
                                            <ShoppingBag className="size-12 mx-auto mb-4 opacity-20" />
                                            <p>No orders found for this customer.</p>
                                        </div>
                                    ) : (
                                        selectedClient.orders.map((order) => (
                                            <div key={order._id} className="relative pl-6 border-l-2 border-muted pb-6 last:pb-0">
                                                <div className="absolute -left-[9px] top-0 size-4 rounded-full bg-teal-700 border-4 border-background shadow-sm" />
                                                <div className="p-4 bg-muted/30 rounded-xl border border-muted group hover:border-teal-500/30 transition-all">
                                                    <div className="flex flex-col md:flex-row justify-between gap-4">
                                                        <div className="space-y-1">
                                                            <div className="flex items-center gap-2">
                                                                <span className="font-bold text-sm tracking-tight">{order.orderId}</span>
                                                                <Badge variant="outline" className="text-[10px] uppercase font-bold px-1.5 py-0">
                                                                    {order.type}
                                                                </Badge>
                                                                <Badge className={
                                                                    order.status === "Completed" ? "bg-emerald-500/10 text-emerald-600 border-emerald-500/20" :
                                                                        order.status === "Pending" ? "bg-amber-500/10 text-amber-600 border-amber-500/20" :
                                                                            "bg-rose-500/10 text-rose-600 border-rose-500/20"
                                                                }>
                                                                    {order.status}
                                                                </Badge>
                                                            </div>
                                                            <p className="text-xs text-muted-foreground">
                                                                Ordered on {format(new Date(order.createdAt), "PPP 'at' p")}
                                                            </p>
                                                            <div className="text-sm mt-3 pt-3 border-t border-dashed">
                                                                <ul className="space-y-1">
                                                                    {order.items.map((item, idx) => (
                                                                        <li key={idx} className="flex justify-between text-xs">
                                                                            <span className="text-muted-foreground">{item.quantity}x {item.name}</span>
                                                                            <span className="font-medium">${(item.price * item.quantity).toLocaleString()}</span>
                                                                        </li>
                                                                    ))}
                                                                </ul>
                                                            </div>
                                                        </div>
                                                        <div className="flex flex-col justify-between items-end gap-4 min-w-[120px]">
                                                            <div className="text-right">
                                                                <p className="text-xs text-muted-foreground uppercase font-bold tracking-wider">Total</p>
                                                                <p className="text-2xl font-black text-teal-700">${order.totalAmount.toLocaleString()}</p>
                                                            </div>
                                                            <Button variant="ghost" size="sm" className="group-hover:text-teal-700">
                                                                View Bill <ArrowRight className="size-3 ml-1" />
                                                            </Button>
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>
                                        ))
                                    )}
                                </div>
                            </ScrollArea>
                        </CardContent>
                    </Card>
                </div>
            </div>
        );
    }

    return (
        <div className="p-6 space-y-6 bg-background min-h-screen">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">Customer History</h1>
                    <p className="text-muted-foreground">Track behavior and purchases across your entire customer base.</p>
                </div>
            </div>

            {/* Filter Card */}
            <Card className="border-muted shadow-sm">
                <CardContent className="p-4">
                    <div className="flex flex-col md:flex-row gap-4">
                        <div className="relative flex-1">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
                            <Input
                                placeholder="Search by name, phone or email..."
                                className="pl-10"
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                            />
                        </div>
                        <Button variant="outline" className="md:w-auto w-full">
                            <Filter className="size-4 mr-2" /> Advanced Filters
                        </Button>
                    </div>
                </CardContent>
            </Card>

            {/* Customer List Card */}
            <Card className="shadow-sm">
                <CardHeader className="pb-2">
                    <CardTitle>Customer Directory</CardTitle>
                    <CardDescription>All recorded customers and their aggregated activity.</CardDescription>
                </CardHeader>
                <CardContent className="p-0">
                    <Table>
                        <TableHeader>
                            <TableRow className="bg-muted/50">
                                <TableHead className="w-[300px] pl-6">Customer</TableHead>
                                <TableHead className="text-center">Total Orders</TableHead>
                                <TableHead className="text-center">Total Spent</TableHead>
                                <TableHead className="text-center">Last Visit</TableHead>
                                <TableHead className="text-right pr-6">Action</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {isLoading ? (
                                <TableRow>
                                    <TableCell colSpan={5} className="h-40 text-center">
                                        <History className="size-8 mx-auto mb-2 animate-spin text-muted-foreground" />
                                        <p className="text-muted-foreground">Loading customer data...</p>
                                    </TableCell>
                                </TableRow>
                            ) : filteredClients.map((client) => (
                                <TableRow key={client._id} className="group cursor-pointer hover:bg-muted/30 transition-all" onClick={() => handleViewDetail(client._id)}>
                                    <TableCell className="pl-6">
                                        <div className="flex items-center gap-3">
                                            <div className="size-10 bg-teal-700/10 rounded-full flex items-center justify-center font-bold text-teal-700">
                                                {client.name.charAt(0)}
                                            </div>
                                            <div>
                                                <p className="font-semibold group-hover:text-teal-700 transition-colors uppercase text-sm tracking-tight">{client.name}</p>
                                                <p className="text-xs text-muted-foreground">{client.phone}</p>
                                            </div>
                                        </div>
                                    </TableCell>
                                    <TableCell className="text-center">
                                        <Badge variant="outline">{client.orderCount}</Badge>
                                    </TableCell>
                                    <TableCell className="text-center">
                                        <p className="font-bold text-teal-700">${client.totalSpent.toLocaleString()}</p>
                                    </TableCell>
                                    <TableCell className="text-center text-sm text-muted-foreground">
                                        {client.lastVisit ? format(new Date(client.lastVisit), "MMM d, yyyy") : "N/A"}
                                    </TableCell>
                                    <TableCell className="text-right pr-6">
                                        <div className="flex justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                            <Button variant="ghost" size="icon" className="h-8 w-8 text-teal-700" onClick={(e) => {
                                                e.stopPropagation();
                                                handleViewDetail(client._id);
                                            }}>
                                                <ExternalLink className="size-4" />
                                            </Button>
                                            <Button variant="ghost" size="icon" className="h-8 w-8 text-rose-500 hover:text-rose-600 hover:bg-rose-50" onClick={(e) => {
                                                e.stopPropagation();
                                                deleteClient(client._id);
                                            }}>
                                                <Trash2 className="size-4" />
                                            </Button>
                                        </div>
                                    </TableCell>
                                </TableRow>
                            ))}
                            {!isLoading && filteredClients.length === 0 && (
                                <TableRow>
                                    <TableCell colSpan={5} className="h-40 text-center text-muted-foreground">
                                        No customers found matching your search.
                                    </TableCell>
                                </TableRow>
                            )}
                        </TableBody>
                    </Table>
                </CardContent>
            </Card>
        </div>
    );
};

// Helpfully added a Label since it was used but not imported
const Label = ({ children, className }) => <label className={`text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 ${className}`}>{children}</label>;

export default CustomerHistory;
