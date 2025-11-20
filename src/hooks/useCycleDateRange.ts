import { useMemo } from 'react';
import { endOfMonth } from 'date-fns';
import type { BillingCycle } from '@/types';

const ALL_CYCLES_ID = "all";

interface CycleDateRange {
    start: Date;
    end: Date;
}

export const useCycleDateRange = (selectedCycle: BillingCycle | null): CycleDateRange | null => {
    return useMemo(() => {
        if (!selectedCycle || selectedCycle.id === ALL_CYCLES_ID) return null;
        return {
            start: new Date(selectedCycle.startDate),
            end: selectedCycle.endDate ? new Date(selectedCycle.endDate) : new Date(),
        };
    }, [selectedCycle]);
};
