import { useMemo } from 'react';
import type { Transaction, TransactionType, DateRange } from '@/types';

interface FilterOptions {
    searchTerm: string;
    selectedType: TransactionType | "all" | "savings";
    selectedCategory: string[] | "all";
    dateRange: DateRange | undefined;
}

export const useFilteredTransactions = (
    transactions: Transaction[],
    filters: FilterOptions
) => {
    return useMemo(() => {
        return transactions.filter((t) => {
            const lowerSearchTerm = filters.searchTerm.toLowerCase();
            const matchesSearch = t.description.toLowerCase().includes(lowerSearchTerm);

            let matchesType = true;
            if (filters.selectedType === "all") {
                matchesType = true;
            } else if (filters.selectedType === 'savings') {
                matchesType = t.type === 'deposit' || t.type === 'withdrawal';
            } else {
                matchesType = t.type === filters.selectedType;
            }

            const matchesCategory = 
                filters.selectedCategory === "all" || 
                (Array.isArray(filters.selectedCategory) && filters.selectedCategory.includes(t.categoryId));

            let matchesDateRange = true;
            if (filters.dateRange?.from) {
                const from = new Date(filters.dateRange.from);
                from.setHours(0, 0, 0, 0);
                matchesDateRange = new Date(t.date) >= from;
            }
            if (filters.dateRange?.to) {
                const to = new Date(filters.dateRange.to);
                to.setHours(23, 59, 59, 999);
                matchesDateRange = matchesDateRange && new Date(t.date) <= to;
            }

            return matchesSearch && matchesType && matchesCategory && matchesDateRange;
        }).sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
    }, [transactions, filters.searchTerm, filters.selectedType, filters.selectedCategory, filters.dateRange]);
};
