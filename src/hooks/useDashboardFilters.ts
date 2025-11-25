import { useState, useCallback } from 'react';
import type { TransactionType, DateRange } from '@/types';

export interface DashboardFilters {
    searchTerm: string;
    selectedType: TransactionType | "all" | "savings";
    selectedCategory: string[] | "all";
    dateRange: DateRange | undefined;
}

const initialFilters: DashboardFilters = {
    searchTerm: "",
    selectedType: "all",
    selectedCategory: "all",
    dateRange: undefined,
};

export const useDashboardFilters = () => {
    const [filters, setFilters] = useState<DashboardFilters>(initialFilters);

    const updateSearchTerm = useCallback((searchTerm: string) => {
        setFilters(prev => ({ ...prev, searchTerm }));
    }, []);

    const updateSelectedType = useCallback((selectedType: TransactionType | "all" | "savings") => {
        setFilters(prev => ({ ...prev, selectedType }));
    }, []);

    const updateSelectedCategory = useCallback((selectedCategory: string[] | "all") => {
        setFilters(prev => ({ ...prev, selectedCategory }));
    }, []);

    const updateDateRange = useCallback((dateRange: DateRange | undefined) => {
        setFilters(prev => ({ ...prev, dateRange }));
    }, []);

    const clearFilters = useCallback(() => {
        setFilters(initialFilters);
    }, []);

    const isAnyFilterActive =
        filters.searchTerm !== "" ||
        filters.selectedType !== "all" ||
        (Array.isArray(filters.selectedCategory) && filters.selectedCategory.length > 0) ||
        filters.dateRange?.from !== undefined;

    return {
        filters,
        updateSearchTerm,
        updateSelectedType,
        updateSelectedCategory,
        updateDateRange,
        clearFilters,
        isAnyFilterActive,
    };
};
