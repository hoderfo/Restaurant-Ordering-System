import React, { useState } from 'react';
import { useTableStore } from '@/store/useTableStore';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";

const NewReservationModal = ({ isOpen, onClose }) => {
    const { createReservation, tables } = useTableStore();
    const [isLoading, setIsLoading] = useState(false);
    
    const [formData, setFormData] = useState({
        bookedBy: "",
        contact: "",
        guests: 1,
        date: new Date().toISOString().slice(0, 16),
        duration: 90,
        notes: "",
        tableId: "auto" // "auto" means system picks
    });

    const [warningModal, setWarningModal] = useState({
        isOpen: false,
        message: "",
        pendingData: null
    });

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData({ ...formData, [name]: value });
    };

    const submitReservation = async (data, overrideConfirmed = false) => {
        setIsLoading(true);
        const payload = { ...data };
        if (payload.tableId === "auto") {
            delete payload.tableId;
        } else {
            payload.overrideWarningConfirmed = overrideConfirmed;
        }

        const result = await createReservation(payload);
        setIsLoading(false);

        if (result.success) {
            toast.success(`Reservation Confirmed! Assigned to Table: ${result.table.name}`);
            onClose();
        } else if (result.requiresOverride) {
            // Show warning modal
            setWarningModal({
                isOpen: true,
                message: result.message,
                pendingData: data,
                suggestedTableId: result.suggestedTableId,
                suggestedTime: result.suggestedTime
            });
        } else {
            toast.error("Error: " + result.message);
        }
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        submitReservation(formData, false);
    };

    const handleConfirmWarning = () => {
        setWarningModal(prev => ({ ...prev, isOpen: false }));
        const updatedData = { ...warningModal.pendingData };
        if (warningModal.suggestedTableId) {
            updatedData.tableId = warningModal.suggestedTableId;
        }
        if (warningModal.suggestedTime) {
            // Adjust the date field to the new suggested time. The input expects YYYY-MM-DDTHH:MM formatting.
            const d = new Date(warningModal.suggestedTime);
            // Format to local datetime string for the datetime-local input, handling timezone offsets
            const tzOffset = d.getTimezoneOffset() * 60000;
            const localISOTime = (new Date(d.getTime() - tzOffset)).toISOString().slice(0, 16);
            updatedData.date = localISOTime;
        }
        submitReservation(updatedData, true);
    };

    return (
        <>
            <Dialog open={isOpen} onOpenChange={onClose}>
                <DialogContent className="sm:max-w-[425px]">
                    <DialogHeader>
                        <DialogTitle>New Reservation</DialogTitle>
                    </DialogHeader>
                    <form onSubmit={handleSubmit} className="space-y-4 py-4">
                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label>Guest Name *</Label>
                                <Input name="bookedBy" value={formData.bookedBy} onChange={handleChange} required placeholder="John Doe" />
                            </div>
                            <div className="space-y-2">
                                <Label>Contact *</Label>
                                <Input name="contact" value={formData.contact} onChange={handleChange} required placeholder="Phone Number" />
                            </div>
                        </div>

                        <div className="grid grid-cols-3 gap-4">
                            <div className="space-y-2">
                                <Label>Date & Time *</Label>
                                <Input type="datetime-local" name="date" value={formData.date} onChange={handleChange} required />
                            </div>
                            <div className="space-y-2">
                                <Label>Duration (min) *</Label>
                                <Input type="number" name="duration" value={formData.duration} onChange={handleChange} required min="15" step="15" />
                            </div>
                            <div className="space-y-2">
                                <Label>Party Size *</Label>
                                <Input type="number" name="guests" value={formData.guests} onChange={handleChange} required min="1" />
                            </div>
                        </div>

                        <div className="space-y-2">
                            <Label>Table Selection</Label>
                            <select 
                                name="tableId"
                                value={formData.tableId} 
                                onChange={handleChange}
                                className="flex h-10 w-full items-center justify-between rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                            >
                                <option value="auto">Auto-Assign Best Fit (Recommended)</option>
                                {tables.map(table => (
                                    <option key={table._id} value={table._id}>
                                        {table.label} (Capacity: {table.capacity})
                                    </option>
                                ))}
                            </select>
                            <p className="text-xs text-muted-foreground">Select 'Auto-Assign' to let the system find the best table automatically.</p>
                        </div>

                        <div className="space-y-2">
                            <Label>Special Notes</Label>
                            <Textarea name="notes" value={formData.notes} onChange={handleChange} placeholder="Allergies, special occasions, etc." />
                        </div>

                        <DialogFooter>
                            <Button type="button" variant="outline" onClick={onClose}>Cancel</Button>
                            <Button type="submit" disabled={isLoading}>{isLoading ? "Processing..." : "Create Reservation"}</Button>
                        </DialogFooter>
                    </form>
                </DialogContent>
            </Dialog>

            {/* Warning Override Modal */}
            <Dialog open={warningModal.isOpen} onOpenChange={(open) => !open && setWarningModal({ ...warningModal, isOpen: false })}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle className="text-orange-600">Capacity Warning</DialogTitle>
                    </DialogHeader>
                    <p className="py-4 text-sm">{warningModal.message}</p>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setWarningModal({ ...warningModal, isOpen: false })}>Cancel</Button>
                        <Button variant="destructive" onClick={handleConfirmWarning}>Confirm & Override</Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </>
    );
};

export default NewReservationModal;
