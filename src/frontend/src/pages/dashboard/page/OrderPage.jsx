import React, { useEffect, useState, useRef } from 'react';
import { useMenuStore } from '@/store/useMenuStore';
import { useOrderStore } from '@/store/useOrderStore';
import { useTableStore } from '@/store/useTableStore';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area";
import { Card, CardContent } from "@/components/ui/card";
import { Search, Plus, Minus, ShoppingCart, Trash2, Banknote, CreditCard, User, Utensils, Receipt, X, Loader2, Phone } from 'lucide-react';
import { cn } from "@/lib/utils";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { useReactToPrint } from 'react-to-print';
import { toast } from 'sonner';
import { Skeleton } from '@/components/ui/skeleton';
import { EmptyState } from '@/components/ui/empty-state';
import Pagination from '@/components/ui/custom-pagination';

const OrderPage = () => {
    const { menu, getAllMenuItems, category: categoriesList, getAllCategories, isLoading: isMenuLoading, paginationMenu } = useMenuStore();
    const { cart, addToCart, removeFromCart, placeOrder, lastOrder, resetLastOrder, isLoading: isOrderLoading } = useOrderStore();
    const { tables, getTables } = useTableStore();

    const [checkoutStep, setCheckoutStep] = useState(1); // 1: Cart, 2: Details

    // Local State
    const [searchQuery, setSearchQuery] = useState("");
    const [selectedCategoryId, setSelectedCategoryId] = useState(""); // "" means All
    const [orderType, setOrderType] = useState("Dine-in"); // Dine-in, Takeaway
    const [paymentMethod, setPaymentMethod] = useState("Cash");
    const [selectedTable, setSelectedTable] = useState("");

    const [clientDetails, setClientDetails] = useState({
        name: "",
        phone: ""
    });

    const [receiptMetadata, setReceiptMetadata] = useState({
        cardLastFour: "",
        authCode: ""
    });

    const slipRef = useRef();

    useEffect(() => {
        getAllCategories(1, 100);
        getTables();
    }, [getAllCategories, getTables]);

    useEffect(() => {
        const timeoutId = setTimeout(() => {
            getAllMenuItems(1, 10, selectedCategoryId, searchQuery);
        }, 300);
        return () => clearTimeout(timeoutId);
    }, [searchQuery, selectedCategoryId, getAllMenuItems]);

    useEffect(() => {
        if (lastOrder) {
            setReceiptMetadata({
                cardLastFour: (Math.floor(Math.random() * 9000) + 1000).toString(),
                authCode: (Math.random().toString(36).substring(2, 8)).toUpperCase()
            });
        }
    }, [lastOrder]);

    const handlePageChange = (newPage) => {
        getAllMenuItems(newPage, 10, selectedCategoryId, searchQuery);
    };

    const handleCategoryChange = (catId) => {
        setSelectedCategoryId(catId);
    };

    const categories = [{ _id: "", name: "All" }, ...categoriesList];
    const totalAmount = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);
    const tax = totalAmount * 0.05; // 5% Tax example
    const finalTotal = totalAmount + tax;

    const handlePlaceOrder = async () => {
        if (cart.length === 0) return toast.error("Your cart is empty!");
        if (!clientDetails.phone) return toast.error("Customer phone is required!");
        if (!clientDetails.name) return toast.error("Customer name is required!");

        const orderData = {
            type: orderType,
            paymentMethod,
            items: cart.map(item => ({
                menuItem: item.menuItem._id,
                quantity: item.quantity
            })),
            clientName: clientDetails.name,
            clientPhone: clientDetails.phone,
            tableId: orderType === "Dine-in" ? selectedTable : null
        };

        await placeOrder(orderData);
    };

    // Printing Logic
    const handlePrint = useReactToPrint({
        content: () => slipRef.current,
        documentTitle: `Order_${lastOrder?.orderId || 'Receipt'}`,
    });

    // Keyboard Shortcuts
    useEffect(() => {
        const handleKeyDown = (e) => {
            // Ignore if typing in an input field
            if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') return;

            if (e.key === 'Enter' && cart.length > 0 && !isOrderLoading && !lastOrder) {
                e.preventDefault();
                handlePlaceOrder();
            }
        };
        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [cart, isOrderLoading, lastOrder, clientDetails, orderType, paymentMethod, selectedTable]);

    return (
        <div className="flex flex-col lg:flex-row h-full w-full bg-gray-50 dark:bg-black/20 overflow-hidden">
            {/* Left Side: Menu */}
            <div className="flex-1 flex flex-col border-r border-gray-200 dark:border-gray-800 overflow-hidden min-w-0">
                {/* Header */}
                <div className="p-6 bg-white dark:bg-card/50 border-b border-gray-200 dark:border-border space-y-4">
                    <div className="flex justify-between items-center">
                        <h1 className="text-2xl font-bold flex items-center gap-2">
                            Menu
                        </h1>
                        <div className="relative">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                            <Input
                                placeholder="Search items..."
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                className="pl-9 w-64 rounded-full"
                            />
                        </div>
                    </div>
                    {/* Categories */}

                    <div className="w-full">
                        <ScrollArea className="w-full whitespace-nowrap">
                            <div className="flex w-max gap-2 pb-4 px-1">
                                {categories.map(cat => (
                                    <button
                                        key={cat._id}
                                        onClick={() => handleCategoryChange(cat._id)}
                                        className={cn(
                                            "px-6 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-colors flex-shrink-0",
                                            selectedCategoryId === cat._id
                                                ? "bg-primary text-primary-foreground shadow-sm"
                                                : "bg-secondary text-secondary-foreground hover:bg-secondary/80"
                                        )}
                                    >
                                        {cat.name}
                                    </button>
                                ))}
                            </div>
                            <ScrollBar orientation="horizontal" />
                        </ScrollArea>
                    </div>
                </div>

                <div className="flex-1 overflow-y-auto p-6 min-h-0 custom-scrollbar relative">
                    {isMenuLoading ? (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 xl:grid-cols-3 gap-x-6 gap-y-20 mt-12 pb-12">
                            {[1, 2, 3, 4, 5, 6].map((i) => (
                                <Skeleton key={i} className="h-64 rounded-2xl" />
                            ))}
                        </div>
                    ) : menu.length === 0 ? (
                        <EmptyState
                            title="No Items Found"
                            description="We couldn't find any dishes matching your search."
                            className="h-[50vh]"
                        />
                    ) : (
                        <div className="space-y-6">
                            <div className="grid grid-cols-1 sm:grid-cols-1 md:grid-cols-2 lg:grid-cols-2 xl:grid-cols-2 2xl:grid-cols-2 gap-x-6 gap-y-20 mt-12 pb-12">
                                {menu.map(item => {
                                    const cartItem = cart.find(c => c.menuItem._id === item._id);
                                    const quantity = cartItem ? cartItem.quantity : 0;

                                    return (
                                        <Card
                                            key={item._id}
                                            className="relative pt-16 pb-4 px-4 overflow-visible border transition-all duration-300 shadow-sm hover:shadow-md cursor-default bg-white dark:bg-card border-gray-100 dark:border-border hover:border-primary dark:hover:border-primary group"
                                        >
                                            {/* Circular Image */}
                                            <div className="absolute -top-12 left-1/2 -translate-x-1/2 w-32 h-32 rounded-full shadow-lg overflow-hidden border-4 border-white dark:border-gray-900 group-hover:scale-105 transition-transform duration-300 bg-gray-100">
                                                {item.image ? (
                                                    <img src={item.image} alt={item.name} className="w-full h-full object-cover" />
                                                ) : (
                                                    <div className="w-full h-full flex items-center justify-center bg-gray-200 text-gray-400">
                                                        <Utensils className="w-10 h-10" />
                                                    </div>
                                                )}
                                            </div>

                                            <div className="flex flex-col items-center text-center mt-6 space-y-4">
                                                {/* Details */}
                                                <div className="space-y-1 w-full">
                                                    <span className="text-sm text-gray-400 font-medium tracking-wide uppercase">
                                                        {item.category?.name || "Uncategorized"}
                                                    </span>
                                                    <h3 className="text-gray-900 dark:text-white font-bold text-lg leading-tight px-1 truncate w-full" title={item.name}>
                                                        {item.name}
                                                    </h3>
                                                    <p className="text-xs text-gray-500 line-clamp-2 h-8 px-2">{item.description}</p>
                                                </div>

                                                {/* Price and Controls */}
                                                <div className="flex items-center justify-between w-full pt-2 px-2">
                                                    <span className="text-xl font-bold text-primary">
                                                        Rs {item.price.toFixed(2)}
                                                    </span>

                                                    <div className="flex items-center gap-3">
                                                        <button
                                                            onClick={(e) => { e.stopPropagation(); removeFromCart(item._id); }}
                                                            className="w-8 h-8 rounded-full flex items-center justify-center bg-gray-100 dark:bg-red-800/50 text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-red-700/50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                                                            disabled={quantity === 0}
                                                        >
                                                            <Minus className="w-4 h-4" />
                                                        </button>

                                                        <span className="text-gray-900 dark:text-white font-semibold w-4">
                                                            {quantity}
                                                        </span>

                                                        <button
                                                            onClick={(e) => { e.stopPropagation(); addToCart(item); }}
                                                            className="w-8 h-8 rounded-full flex items-center justify-center bg-green-600 text-white hover:bg-green-700 transition-colors shadow-sm"
                                                        >
                                                            <Plus className="w-4 h-4" />
                                                        </button>
                                                    </div>
                                                </div>
                                            </div>
                                        </Card>
                                    );
                                })}
                            </div>
                            <Pagination
                                pagination={paginationMenu}
                                onPageChange={handlePageChange}
                            />
                        </div>
                    )}
                </div>
            </div>

            {/* Right Side: Cart / Checkout Sidebar */}
            <div className="w-full lg:w-[400px] h-[50vh] lg:h-full bg-white dark:bg-teal-900/20 flex flex-col shadow-xl border-t lg:border-t-0 lg:border-l border-gray-200 dark:border-teal-800 z-10 transition-all duration-300">
                <div className="p-4 border-b border-gray-200 dark:border-teal-800 flex items-center justify-between">
                    <h2 className="text-lg font-bold flex items-center gap-2">
                        {checkoutStep === 1 ? <ShoppingCart className="h-5 w-5" /> : <User className="h-5 w-5" />}
                        {checkoutStep === 1 ? "Current Order" : "Customer Details"}
                    </h2>
                    {checkoutStep === 2 && (
                        <Button variant="ghost" size="sm" onClick={() => setCheckoutStep(1)} className="text-primary hover:text-primary/80">
                            Back
                        </Button>
                    )}
                </div>

                {checkoutStep === 1 ? (
                    <>
                        {/* Cart Items View */}
                        <ScrollArea className="flex-1 p-4 min-h-0">
                            {cart.length === 0 ? (
                                <div className="h-full flex flex-col items-center justify-center text-gray-400 space-y-2 opacity-60 py-20">
                                    <ShoppingCart className="h-12 w-12" />
                                    <p>Cart is empty</p>
                                </div>
                            ) : (
                                <div className="space-y-3">
                                    {cart.map(item => (
                                        <div key={item.menuItem._id} className="flex justify-between items-center bg-gray-50 dark:bg-green-800/50 p-3 rounded-lg group animate-in fade-in slide-in-from-right-4 duration-300">
                                            <div className="flex-1">
                                                <h4 className="font-medium text-sm line-clamp-1">{item.name}</h4>
                                                <p className="text-xs text-gray-500 dark:text-gray-200">Rs {item.price}</p>
                                            </div>
                                            <div className="flex items-center gap-3">
                                                <div className="flex items-center gap-2 bg-white dark:bg-green-900 rounded-md shadow-sm border px-1">
                                                    <button onClick={() => removeFromCart(item.menuItem._id)} className="p-1 hover:text-red-500 transition-colors"><Minus className="h-3 w-3" /></button>
                                                    <span className="text-xs font-semibold w-6 text-center">{item.quantity}</span>
                                                    <button onClick={() => addToCart(item.menuItem)} className="p-1 hover:text-green-500 transition-colors"><Plus className="h-3 w-3" /></button>
                                                </div>
                                                <p className="font-semibold text-xs w-16 text-right">Rs {(item.price * item.quantity).toFixed(2)}</p>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </ScrollArea>

                        {/* Footer Summary Step 1 */}
                        <div className="p-6 bg-gray-50 dark:bg-teal-800/20 border-t border-gray-200 dark:border-teal-700 space-y-4">
                            <div className="space-y-2 text-sm">
                                <div className="flex justify-between text-gray-500">
                                    <span>Subtotal</span>
                                    <span>Rs {totalAmount.toFixed(2)}</span>
                                </div>
                                <div className="flex justify-between text-gray-500">
                                    <span>Tax (5%)</span>
                                    <span>Rs {tax.toFixed(2)}</span>
                                </div>
                                <div className="flex justify-between text-lg font-bold text-gray-900 dark:text-white pt-2 border-t">
                                    <span>Total</span>
                                    <span>Rs {finalTotal.toFixed(2)}</span>
                                </div>
                            </div>
                            <Button
                                onClick={() => setCheckoutStep(2)}
                                disabled={cart.length === 0}
                                className="w-full bg-primary hover:bg-primary/90 text-primary-foreground h-12 text-lg shadow-lg"
                            >
                                Proceed to Details
                            </Button>
                        </div>
                    </>
                ) : (
                    <>
                        {/* Checkout Details View */}
                        <ScrollArea className="flex-1 p-6 space-y-6">
                            <div className="space-y-6 pb-6">
                                {/* Order Type */}
                                <div className="space-y-3">
                                    <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Order Type</label>
                                    <div className="grid grid-cols-2 gap-2 p-1 bg-gray-200 dark:bg-teal-950 rounded-lg">
                                        <button
                                            onClick={() => setOrderType("Dine-in")}
                                            className={cn("py-2 text-sm font-medium rounded-md transition-all", orderType === "Dine-in" ? "bg-primary shadow text-primary-foreground" : "text-gray-500 hover:text-gray-700 dark:text-gray-400")}
                                        >
                                            Dine-In
                                        </button>
                                        <button
                                            onClick={() => setOrderType("Takeaway")}
                                            className={cn("py-2 text-sm font-medium rounded-md transition-all", orderType === "Takeaway" ? "bg-primary shadow text-primary-foreground" : "text-gray-500 hover:text-gray-700 dark:text-gray-400")}
                                        >
                                            Takeaway
                                        </button>
                                    </div>
                                </div>

                                {/* Table Select */}
                                {orderType === "Dine-in" && (
                                    <div className="space-y-3">
                                        <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Select Table</label>
                                        <select
                                            className="w-full p-3 rounded-lg border text-sm dark:bg-teal-950 focus:ring-2 focus:ring-primary outline-none transition-all"
                                            value={selectedTable}
                                            onChange={(e) => setSelectedTable(e.target.value)}
                                        >
                                            <option value="">Choose Table...</option>
                                            {tables.filter(t => t.status === 'Available' || t.status === 'Occupied').map(t => (
                                                <option key={t._id} value={t._id}>{t.name} ({t.zone})</option>
                                            ))}
                                        </select>
                                    </div>
                                )}

                                {/* Customer Info */}
                                <div className="space-y-4">
                                    <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Customer Information</label>
                                    <div className="space-y-3">
                                        <div className="flex items-center gap-3 bg-gray-50 dark:bg-teal-950 p-3 rounded-lg border border-gray-200 dark:border-teal-800 transition-all focus-within:ring-2 focus-within:ring-primary">
                                            <User className="h-4 w-4 text-primary" />
                                            <Input
                                                value={clientDetails.name}
                                                onChange={(e) => setClientDetails({ ...clientDetails, name: e.target.value })}
                                                className="border-none h-auto p-0 text-sm dark:bg-transparent focus-visible:ring-0 placeholder:text-gray-400"
                                                placeholder="Customer Name *"
                                            />
                                        </div>
                                        <div className="flex items-center gap-3 bg-gray-50 dark:bg-teal-950 p-3 rounded-lg border border-gray-200 dark:border-teal-800 transition-all focus-within:ring-2 focus-within:ring-primary">
                                            <Phone className="h-4 w-4 text-primary" />
                                            <Input
                                                value={clientDetails.phone}
                                                onChange={(e) => setClientDetails({ ...clientDetails, phone: e.target.value })}
                                                className="border-none h-auto p-0 text-sm dark:bg-transparent focus-visible:ring-0 placeholder:text-gray-400"
                                                placeholder="Phone Number *"
                                            />
                                        </div>
                                    </div>
                                </div>

                                {/* Payment Method */}
                                <div className="space-y-3">
                                    <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Payment Method</label>
                                    <div className="grid grid-cols-3 gap-2">
                                        {["Cash", "Card", "Online"].map(method => (
                                            <button
                                                key={method}
                                                onClick={() => setPaymentMethod(method)}
                                                className={cn(
                                                    "flex flex-col items-center justify-center py-3 rounded-lg border text-xs font-medium transition-all group",
                                                    paymentMethod === method
                                                        ? "border-primary bg-primary/10 text-primary shadow-sm"
                                                        : "border-gray-200 hover:border-primary/50 bg-white dark:bg-teal-950 dark:border-teal-800"
                                                )}
                                            >
                                                {method === "Card" ? <CreditCard className="h-4 w-4 mb-2 group-hover:scale-110 transition-transform" /> : <Banknote className="h-4 w-4 mb-2 group-hover:scale-110 transition-transform" />}
                                                {method}
                                            </button>
                                        ))}
                                    </div>
                                </div>
                            </div>
                        </ScrollArea>

                        {/* Footer Checkout Step 2 */}
                        <div className="p-6 bg-gray-50 dark:bg-teal-800/20 border-t border-gray-200 dark:border-teal-700">
                            <Button
                                onClick={handlePlaceOrder}
                                disabled={!clientDetails.name || !clientDetails.phone || (orderType === "Dine-in" && !selectedTable) || isOrderLoading}
                                className="w-full bg-green-600 hover:bg-green-700 text-white h-14 text-lg shadow-xl shadow-green-600/20 flex flex-col items-center justify-center gap-0"
                            >
                                {isOrderLoading ? (
                                    <Loader2 className="w-6 h-6 animate-spin" />
                                ) : (
                                    <>
                                        <span className="text-sm opacity-80 font-normal">Final Total</span>
                                        <span className="font-bold">Pay Rs {finalTotal.toFixed(2)}</span>
                                    </>
                                )}
                            </Button>
                        </div>
                    </>
                )}
            </div>

            {/* Receipt Modal */}
            <Dialog open={!!lastOrder} onOpenChange={(open) => !open && resetLastOrder()}>
                <DialogContent className="max-w-[380px] sm:max-w-[400px] w-[95vw] bg-white border-none shadow-2xl overflow-hidden p-0 rounded-3xl">
                    {/* The Receipt Itself - Thermal Printer Aesthetic */}
                    <ScrollArea className="max-h-[75vh] bg-white">
                        <div ref={slipRef} className="bg-white p-6 text-black font-mono text-sm leading-tight w-full">
                            {/* Large Order Header */}
                            <div className="text-center mb-6">
                                <h1 className="text-7xl font-bold mb-2">
                                    {lastOrder?.orderId ? lastOrder.orderId.split('-').pop().slice(-3) : '---'}
                                </h1>

                                <div className="text-[10px] space-y-0.5 uppercase mb-4 border-b border-black pb-4">
                                    <p className="font-bold">Buy one get one free quarter pounder</p>
                                    <p>w/cheese or egg mcmuffin</p>
                                    <p>Go to www.pos-feedback.com within 7 days</p>
                                    <p>and tell us about your visit.</p>
                                    <p>Validation Code: ____________</p>
                                    <p>Expires 30 days after receipt date.</p>
                                    <p>Survey Code:</p>
                                    <p>03997-06660-71818-12071-00066-6</p>
                                </div>

                                <p className="text-xs font-bold uppercase">Tasty Point Restaurant #1234</p>
                                <p className="text-[10px]">123 CULINARY STREET</p>
                                <p className="text-[10px]">FOOD CITY, FC 91301-3347</p>
                                <p className="text-[10px]">TEL# 555-991-2781</p>
                            </div>

                            {/* Locator / Table */}
                            <div className="text-center border-y border-black py-2 mb-4">
                                <h2 className="text-2xl font-bold uppercase leading-none">
                                    {lastOrder?.type === 'Dine-in' ? `LOCATOR #${lastOrder?.table?.name || '??'}` : 'TAKEAWAY'}
                                </h2>
                            </div>

                            {/* Meta Info */}
                            <div className="flex justify-between text-[10px] mb-4">
                                <div className="space-y-0.5">
                                    <p>KS# 6</p>
                                    <p>Side1</p>
                                </div>
                                <div className="text-right space-y-0.5">
                                    <p>{lastOrder && new Date(lastOrder.createdAt).toLocaleDateString()} {lastOrder && new Date(lastOrder.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</p>
                                    <p>Order {lastOrder?.orderId ? lastOrder.orderId.split('-').pop().slice(-2) : '00'}</p>
                                </div>
                            </div>

                            {/* PAID HEADER */}
                            <div className="text-center mb-4">
                                <h2 className="text-3xl font-bold uppercase tracking-widest border-b-2 border-black pb-1 inline-block px-4">PAID</h2>
                            </div>

                            {/* Items Section */}
                            <div className="mb-4 border-b border-dashed border-gray-400 pb-2">
                                {lastOrder?.items.map((item, i) => (
                                    <div key={i} className="flex justify-between text-xs mb-1">
                                        <div className="flex-1 flex gap-2">
                                            <span className="w-4 font-bold">{item.quantity}</span>
                                            <span className="uppercase">{item.name}</span>
                                        </div>
                                        <span className="text-right">Rs {item.price.toFixed(2)}</span>
                                    </div>
                                ))}
                            </div>

                            {/* Totals Section */}
                            <div className="space-y-1 mb-4 text-xs">
                                <div className="flex justify-between">
                                    <span>Subtotal</span>
                                    <span>Rs {lastOrder?.items.reduce((acc, i) => acc + (i.price * i.quantity), 0).toFixed(2)}</span>
                                </div>
                                <div className="flex justify-between">
                                    <span>Tax</span>
                                    <span>Rs {(lastOrder?.totalAmount - lastOrder?.items.reduce((acc, i) => acc + (i.price * i.quantity), 0)).toFixed(2)}</span>
                                </div>
                                <div className="flex justify-between font-bold border-t border-black pt-1">
                                    <span className="uppercase">{lastOrder?.type === 'Dine-in' ? 'Eat-In Total' : 'Take-Out Total'}</span>
                                    <span>Rs {lastOrder?.totalAmount.toFixed(2)}</span>
                                </div>
                            </div>

                            {/* Payment Breakdown */}
                            <div className="space-y-1 mb-6 text-xs border-b border-black pb-4">
                                <div className="flex justify-between">
                                    <span>{lastOrder?.paymentMethod === 'Cash' ? 'Cash' : 'Cashless'}</span>
                                    <span>Rs {lastOrder?.totalAmount.toFixed(2)}</span>
                                </div>
                                <div className="flex justify-between">
                                    <span>Change</span>
                                    <span>0.00</span>
                                </div>
                            </div>

                            {/* Transaction Metadata (Mocked) */}
                            <div className="text-[9px] uppercase space-y-0.5 text-gray-600 mb-8 font-bold">
                                <p>MER# 499301</p>
                                <div className="flex justify-between">
                                    <span>CARD ISSUER</span>
                                    <span>ACCOUNT#</span>
                                </div>
                                <div className="flex justify-between">
                                    <span>{lastOrder?.paymentMethod === 'Card' ? 'Visa' : 'E-PAYMENT'} SALE</span>
                                    <span>{'************' + receiptMetadata.cardLastFour}</span>
                                </div>
                                <div className="flex justify-between font-bold text-black border-t border-gray-200 mt-1 pt-1">
                                    <span>TRANSACTION AMOUNT</span>
                                    <span>Rs {lastOrder?.totalAmount.toFixed(2)}</span>
                                </div>
                                <p>CONTACTLESS</p>
                                <p>AUTHORIZATION CODE - {receiptMetadata.authCode}</p>
                                <p>SEQ# 012247</p>
                                <p>VERIFIED BY PIN</p>
                                <p>AID: A0000000031010</p>
                            </div>

                            {/* Bottom Footer */}
                            <div className="text-center">
                                <p className="text-[10px] font-bold uppercase">Tasty Point Restaurant</p>
                            </div>
                        </div>
                    </ScrollArea>

                    {/* Action Bar */}
                    <div className="bg-gray-100 p-4 flex gap-3 border-t border-gray-200 shadow-[0_-4px_10px_rgba(0,0,0,0.05)]">
                        <Button
                            variant="outline"
                            onClick={resetLastOrder}
                            className="flex-1 bg-white hover:bg-gray-50 text-gray-700 border-gray-300 h-12"
                        >
                            Close
                        </Button>
                        <Button
                            onClick={handlePrint}
                            className="flex-1 bg-zinc-900 hover:bg-zinc-800 text-white h-12 gap-2 shadow-lg"
                        >
                            <Receipt className="w-5 h-5" /> Print Receipt
                        </Button>
                    </div>
                </DialogContent>
            </Dialog>
        </div>
    );
}

export default OrderPage;