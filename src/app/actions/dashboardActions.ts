'use server';

import { getTransactions, getInstallmentProjection } from './transactionActions';
import { getCategories } from './categoryActions';
import { getPaymentMethods } from './paymentMethodActions';
import { getSavingsFunds } from './savingsFundActions';
import { getCurrentBillingCycle, getBillingCycles } from './billingCycleActions';
import { differenceInDays, endOfMonth, isPast } from 'date-fns';
import type { Transaction, BudgetInsights, BillingCycle } from '@/types';


const calculateBudgetInsights = (transactionsInCycle: Transaction[], allTransactions: Transaction[], currentCycle: BillingCycle | null): BudgetInsights => {
    const now = new Date();
    
    // Metrics for the last 7 days (independent of the selected cycle)
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(now.getDate() - 7);
    sevenDaysAgo.setHours(0, 0, 0, 0);

    const today = new Date();
    today.setHours(23, 59, 59, 999);

    const last7DaysExpenses = allTransactions
        .filter(t => {
            const transactionDate = new Date(t.date);
            return t.type === 'expense' && !t.savingsFundId && transactionDate >= sevenDaysAgo && transactionDate <= today;
        })
        .reduce((sum, t) => sum + t.amount, 0);

    const dailyAverage7Days = last7DaysExpenses / 7;

    // Cycle-specific metrics
    const balance = transactionsInCycle.reduce((acc, t) => {
        if (t.type === 'income') return acc + t.amount;
        if (t.type === 'expense') return acc - t.amount;
        return acc;
    }, 0);

    let weeklyBudget = 0;
    let dailyBudget = 0;
    let isHistoric = false;
    let cycleDailyAverage = 0;
    let cycleWeeklyAverage = 0;
    
    if (currentCycle && currentCycle.id !== 'all') {
        const cycleStart = new Date(currentCycle.startDate);
        
        // Active cycle: Project based on days left in the current month.
        if (!currentCycle.endDate || isPast(new Date(currentCycle.endDate)) === false) {
            isHistoric = false;
            const endOfCurrentMonth = endOfMonth(now);
            const daysLeft = differenceInDays(endOfCurrentMonth, now);
            if (balance > 0 && daysLeft > 0) {
                dailyBudget = balance / daysLeft;
                weeklyBudget = dailyBudget * 7;
            }
        }
        // Past cycle: Calculate historical average.
        else {
            isHistoric = true;
            const cycleEnd = new Date(currentCycle.endDate);
            const cycleDurationDays = differenceInDays(cycleEnd, cycleStart) + 1;
            
            if (cycleDurationDays > 0) {
                const cycleTotalExpenses = transactionsInCycle
                    .filter(t => t.type === 'expense' && !t.savingsFundId)
                    .reduce((sum, t) => sum + t.amount, 0);

                cycleDailyAverage = cycleTotalExpenses / cycleDurationDays;
                cycleWeeklyAverage = cycleDailyAverage * 7;
            }
        }
    }
    
    return {
        dailyAverage7Days,
        weeklyExpensesTotal: last7DaysExpenses,
        weeklyBudget,
        dailyBudget,
        isHistoric,
        cycleDailyAverage,
        cycleWeeklyAverage,
    };
};

export async function getDashboardData(userId: string) {
    if (!userId) {
        throw new Error("User not authenticated.");
    }

    const [
        allTransactions, 
        categories, 
        paymentMethods, 
        installmentProjection, 
        savingsFunds,
        currentCycle,
        billingCycles
    ] = await Promise.all([
        getTransactions(userId),
        getCategories(userId),
        getPaymentMethods(userId),
        getInstallmentProjection(userId),
        getSavingsFunds(userId),
        getCurrentBillingCycle(userId),
        getBillingCycles(userId)
    ]);
    
    // This logic must be outside Promise.all because it depends on `currentCycle`
    const savedCycleId = null; // We will handle this logic on the client
    const activeCycle = savedCycleId 
        ? billingCycles.find(c => c.id === savedCycleId) || currentCycle
        : currentCycle;

    const transactionsForSelectedCycle = allTransactions.filter(t => {
      if (!activeCycle || activeCycle.id === 'all') return !t.savingsFundId;
      const transactionDate = new Date(t.date);
      const cycleStart = new Date(activeCycle.startDate);
      // For active cycles, the end date is now. For past cycles, it's the stored end date.
      const cycleEnd = activeCycle.endDate ? new Date(activeCycle.endDate) : new Date();
      return !t.savingsFundId && transactionDate >= cycleStart && transactionDate <= cycleEnd;
    });

    // The budget insights should be calculated based on the currently selected cycle on the client,
    // so we pass all transactions and let the client-side re-calculate if needed.
    // However, we calculate an initial one based on the *current* active cycle.
    const budgetInsights = calculateBudgetInsights(transactionsForSelectedCycle, allTransactions, activeCycle);
    const totalCyclesCount = billingCycles.length;

    return {
        transactions: allTransactions,
        categories,
        paymentMethods,
        installmentProjection,
        savingsFunds,
        currentCycle,
        billingCycles,
        totalCyclesCount,
        budgetInsights, // Initial insights
    };
}
