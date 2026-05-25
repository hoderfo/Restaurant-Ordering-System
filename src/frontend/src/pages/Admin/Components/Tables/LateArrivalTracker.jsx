import React, { useEffect, useState } from 'react';
import { useTableStore } from '@/store/useTableStore';
import { toast } from 'sonner';

export const LateArrivalTracker = () => {
    const { reservations, markNoShow } = useTableStore();
    const [notifiedIds, setNotifiedIds] = useState(new Set());

    useEffect(() => {
        const checkLateArrivals = () => {
            const now = new Date();
            reservations.forEach(res => {
                if (res.status === 'Pending' && !notifiedIds.has(res._id)) {
                    const startTime = new Date(res.startTime);
                    const diffMins = (now - startTime) / 60000;

                    if (diffMins >= 15) {
                        // Mark as notified so we don't spam toasts
                        setNotifiedIds(prev => new Set(prev).add(res._id));
                        
                        toast.warning(`Late Arrival: ${res.bookedBy}`, {
                            description: `Reservation at Table ${res.table?.name || 'N/A'} is 15+ minutes late.`,
                            duration: 10000,
                            action: {
                                label: 'Mark No-Show',
                                onClick: async () => {
                                    await markNoShow(res._id);
                                    toast.success('Reservation marked as No-Show');
                                }
                            },
                            cancel: {
                                label: 'Keep Pending',
                                onClick: () => console.log('Staff confirmed late arrival')
                            }
                        });
                    }
                }
            });
        };

        const interval = setInterval(checkLateArrivals, 60000); // Check every minute
        checkLateArrivals(); // Initial check

        return () => clearInterval(interval);
    }, [reservations, notifiedIds, markNoShow]);

    return null; // This is a logic-only component
};
