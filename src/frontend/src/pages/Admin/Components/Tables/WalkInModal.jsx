import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Loader2, Users, Layers, PersonStanding } from 'lucide-react';
import { useTableStore } from '@/store/useTableStore';
import { motion as Motion, AnimatePresence } from 'framer-motion';
import { toast } from 'sonner';

const WalkInModal = ({ isOpen, onClose }) => {
    const { handleWalkIn, isLoading, tables } = useTableStore();
    
    const [formData, setFormData] = useState({
        guests: 1,
        tableId: "auto"
    });

    const handleSubmit = async (e) => {
        e.preventDefault();
        
        if (formData.guests < 1) {
            toast.error("Party size must be at least 1");
            return;
        }
        
        const payload = { ...formData };
        if (payload.tableId === "auto") {
            delete payload.tableId;
        }

        const result = await handleWalkIn(payload);
        
        if (result.success) {
            toast.success(`Walk-in seated at ${result.data.table.label}`);
            onClose();
        } else {
            toast.error(result.message || "Failed to seat walk-in guest");
        }
    };

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent className="sm:max-w-[400px] p-0 overflow-hidden border sm:rounded-lg bg-background">
                <AnimatePresence mode="wait">
                    {isOpen && (
                        <Motion.div
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -10 }}
                            transition={{ duration: 0.2 }}
                            className="flex flex-col h-full"
                        >
                            <DialogHeader className="p-6 pb-4 border-b">
                                <div className="flex items-center gap-3">
                                    <div className="w-10 h-10 bg-primary/10 rounded-md flex items-center justify-center">
                                        <PersonStanding className="w-5 h-5 text-primary" />
                                    </div>
                                    <div>
                                        <DialogTitle className="text-xl font-semibold text-foreground tracking-tight">
                                            Walk-In Guest
                                        </DialogTitle>
                                        <DialogDescription className="text-sm mt-1">
                                            Automatically find and assign the best table for a new arrival.
                                        </DialogDescription>
                                    </div>
                                </div>
                            </DialogHeader>

                            <form onSubmit={handleSubmit} className="p-6 space-y-6">
                                <div className="space-y-4">
                                    {/* Party Size */}
                                    <div className="space-y-2">
                                        <Label htmlFor="guests" className="text-sm font-medium">Party Size</Label>
                                        <div className="relative">
                                            <Users className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                                            <Input
                                                id="guests"
                                                type="number"
                                                min="1"
                                                className="pl-9 rounded-md h-10"
                                                value={formData.guests}
                                                onChange={(e) => setFormData({ ...formData, guests: parseInt(e.target.value) || "" })}
                                                required
                                            />
                                        </div>
                                    </div>

                                    {/* Table Selection */}
                                    <div className="space-y-2">
                                        <Label htmlFor="tableId" className="text-sm font-medium">Table Selection</Label>
                                        <div className="relative">
                                            <Layers className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground pointer-events-none" />
                                            <select 
                                                id="tableId"
                                                className="flex h-10 w-full rounded-md border border-input bg-background pl-9 pr-8 text-sm ring-offset-background placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 appearance-none cursor-pointer"
                                                value={formData.tableId} 
                                                onChange={(e) => setFormData({ ...formData, tableId: e.target.value })}
                                            >
                                                <option value="auto">Auto-Assign Best Fit (Recommended)</option>
                                                {tables && tables
                                                    .filter(t => t.status === "Available")
                                                    .map(table => (
                                                    <option key={table._id} value={table._id}>
                                                        {table.label} (Capacity: {table.capacity})
                                                    </option>
                                                ))}
                                            </select>
                                            <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-muted-foreground">
                                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="m6 9 6 6 6-6"></path></svg>
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                <DialogFooter className="pt-4 sm:justify-end items-center gap-2">
                                    <Button 
                                        type="button" 
                                        variant="outline" 
                                        onClick={onClose} 
                                        disabled={isLoading}
                                        className="rounded-md"
                                    >
                                        Cancel
                                    </Button>
                                    <Button 
                                        type="submit" 
                                        disabled={isLoading} 
                                        className="rounded-md min-w-[120px]"
                                    >
                                        {isLoading ? (
                                            <Loader2 className="h-4 w-4 animate-spin" />
                                        ) : (
                                            "Seat Guest"
                                        )}
                                    </Button>
                                </DialogFooter>
                            </form>
                        </Motion.div>
                    )}
                </AnimatePresence>
            </DialogContent>
        </Dialog>
    );
};

export default WalkInModal;
