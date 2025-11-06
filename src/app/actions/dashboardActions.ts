
'use server';

import { getTransactions, getInstallmentProjection } from './transactionActions';
import { getCategories } from './categoryActions';
import { getPaymentMethods } from './paymentMethodActions';
import { getSavingsFunds } from './savingsFundActions';
import { getCurrentBillingCycle, getBillingCycles } from './billingCycleActions';
import { subDays, isWithinInterval, startOfDay, endOfDay } from 'date-fns';
import type { Transaction } from '@/types';


// This function gets the start/end of today/yesterday in UTC.
// All DB dates are normalized to UTC start of day, this is the correct way to compare.
const getUTCTodayYesterday = () => {
    const now = new Date(); // Server's current time, assumed to be UTC or close to it.
    
    const todayUTCStart = startOfDay(now);
    const todayUTCEnd = endOfDay(now);

    const yesterday = subDays(now, 1);
    const yesterdayUTCStart = startOfDay(yesterday);
    const yesterdayUTCEnd = endOfDay(yesterday);
    
    return {
        todayRange: { start: todayUTCStart, end: todayUTCEnd },
        yesterdayRange: { start: yesterdayUTCStart, end: yesterdayUTCEnd },
    };
};

const calculateDailyExpenses = (transactions: Transaction[]) => {
    const { todayRange, yesterdayRange } = getUTCTodayYesterday();

    const todayExpenses = transactions
        .filter(t => t.type === 'expense' && isWithinInterval(new Date(t.date), todayRange))
        .reduce((sum, t) => sum + t.amount, 0);

    const yesterdayExpenses = transactions
        .filter(t => t.type === 'expense' && isWithinInterval(new Date(t.date), yesterdayRange))
        .reduce((sum, t) => sum + t.amount, 0);

    return {
        today: todayExpenses,
        yesterday: yesterdayExpenses,
    };
};


export async function getDashboardData(userId: string) {
    if (!userId) {
        throw new Error("User not authenticated.");
    }

    const [
        transactions, 
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

    const dailyExpenses = calculateDailyExpenses(transactions);
    const totalCyclesCount = billingCycles.length;

    return {
        transactions,
        categories,
        paymentMethods,
        installmentProjection,
        savingsFunds,
        currentCycle,
        billingCycles,
        totalCyclesCount,
        dailyExpenses,
    };
}
