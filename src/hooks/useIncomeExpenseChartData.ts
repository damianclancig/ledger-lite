import { useMemo } from 'react';
import type { BudgetInsights } from '@/types';

interface IncomeExpenseChartData {
    name: string;
    current: number;
    previous: number;
}

export const useIncomeExpenseChartData = (
    budgetInsights: BudgetInsights | null,
    incomeLabel: string,
    expenseLabel: string
): IncomeExpenseChartData[] => {
    return useMemo(() => {
        if (!budgetInsights) {
            return [
                { name: incomeLabel, current: 0, previous: 0 },
                { name: expenseLabel, current: 0, previous: 0 },
            ];
        }
        return [
            {
                name: incomeLabel,
                current: budgetInsights.totalIncome,
                previous: budgetInsights.previousCycleIncome
            },
            {
                name: expenseLabel,
                current: budgetInsights.totalExpenses,
                previous: budgetInsights.previousCycleExpenses
            },
        ];
    }, [budgetInsights, incomeLabel, expenseLabel]);
};
