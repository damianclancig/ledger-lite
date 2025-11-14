
'use server';

import { getTransactions } from './transactionActions';
import { getCategories } from './categoryActions';
import { getPaymentMethods } from './paymentMethodActions';
import { getSavingsFunds } from './savingsFundActions';
import { getCurrentBillingCycle, getBillingCycles } from './billingCycleActions';
import { endOfMonth, isPast, differenceInDays, startOfDay, format, startOfToday, subDays } from 'date-fns';
import type { Transaction, BudgetInsights, BillingCycle, InstallmentProjection } from '@/types';
import { getDb } from '@/lib/actions-helpers';
import { ObjectId } from 'mongodb';

export async function getBudgetInsights(userId: string, startDate: Date, endDate: Date): Promise<Pick<BudgetInsights, 'dailyAverage7Days' | 'weeklyExpensesTotal' | 'weeklyAverage28Days' | 'dailyExpenses'>> {
    if (!userId) {
        return { dailyAverage7Days: 0, weeklyExpensesTotal: 0, weeklyAverage28Days: 0, dailyExpenses: [] };
    }
    
    try {
        const { transactionsCollection } = await getDb();
        const twentyEightDaysAgoStart = subDays(startOfToday(), 27);

        // Fetch expenses for the last 28 days to calculate both 7-day and 28-day metrics
        const last28DaysExpenses = await transactionsCollection.find({
            userId,
            type: 'expense',
            isCardPayment: { $ne: true }, // Exclude unpaid card expenses
            savingsFundId: { $exists: false },
            date: {
                $gte: twentyEightDaysAgoStart,
                $lte: endDate
            }
        }, { projection: { date: 1, amount: 1, _id: 0 } }).toArray();

        // Calculate 28-day average
        const totalExpenses28Days = last28DaysExpenses.reduce((sum, t) => sum + t.amount, 0);
        const weeklyAverage28Days = totalExpenses28Days > 0 ? totalExpenses28Days / 4 : 0;
        
        // Filter for last 7 days from the 28-day data
        const last7DaysExpenses = last28DaysExpenses.filter(t => new Date(t.date) >= startDate);
        
        const weeklyExpensesTotal = last7DaysExpenses.reduce((sum, t) => sum + t.amount, 0);
        const dailyAverage7Days = weeklyExpensesTotal > 0 ? weeklyExpensesTotal / 7 : 0;
        
        const dailyExpenses = last7DaysExpenses.map(t => ({
            date: new Date(t.date).toISOString(),
            total: t.amount,
        }));

        return { dailyAverage7Days, weeklyExpensesTotal, weeklyAverage28Days, dailyExpenses };

    } catch (error) {
        console.error('Error fetching budget insights:', error);
        return { dailyAverage7Days: 0, weeklyExpensesTotal: 0, weeklyAverage28Days: 0, dailyExpenses: [] };
    }
}

async function getExpensesByCategory(userId: string, startDate: Date, endDate: Date) {
    if (!userId) return [];
    try {
      const { transactionsCollection } = await getDb();
      const pipeline = [
        {
          $match: {
            userId: userId,
            type: 'expense',
            isCardPayment: { $ne: true }, // Exclude unpaid card expenses
            savingsFundId: { $exists: false },
            date: { $gte: startDate, $lte: endDate }
          }
        },
        {
          $addFields: {
             categoryIdObj: { $toObjectId: "$categoryId" }
          }
        },
        {
          $group: {
            _id: "$categoryIdObj",
            total: { $sum: "$amount" }
          }
        },
        {
          $lookup: {
            from: 'categories',
            localField: '_id',
            foreignField: '_id',
            as: 'categoryInfo'
          }
        },
        {
          $unwind: {
            path: "$categoryInfo",
            preserveNullAndEmptyArrays: true
          }
        },
        {
          $project: {
            _id: 0,
            categoryId: '$_id',
            name: { $ifNull: ["$categoryInfo.name", "Uncategorized"] },
            isSystem: { $ifNull: ["$categoryInfo.isSystem", false] },
            total: "$total"
          }
        }
      ];
  
      const result = await transactionsCollection.aggregate(pipeline).toArray();
      return result.map(item => ({ ...item, categoryId: item.categoryId.toString() }));
      
    } catch (error) {
      console.error('Error fetching expenses by category:', error);
      return [];
    }
}

const calculateCycleBudgetInsights = (transactions: Transaction[], currentCycle: BillingCycle | null): Pick<BudgetInsights, 'totalIncome' | 'totalExpenses' | 'balance' | 'weeklyBudget' | 'dailyBudget' | 'isHistoric' | 'cycleDailyAverage' | 'cycleWeeklyAverage' | 'previousCycleIncome' | 'previousCycleExpenses'> => {
    const now = new Date();
    
    // Filter out credit card expenses that are not yet paid
    const relevantTransactions = transactions.filter(t => !t.isCardPayment);

    const income = relevantTransactions.filter(t => t.type === 'income' && !t.savingsFundId).reduce((sum, t) => sum + t.amount, 0);
    const expenses = relevantTransactions.filter(t => t.type === 'expense' && !t.savingsFundId).reduce((sum, t) => sum + t.amount, 0);
    const balance = income - expenses;

    let weeklyBudget = 0;
    let dailyBudget = 0;
    let isHistoric = false;
    let cycleDailyAverage = 0;
    let cycleWeeklyAverage = 0;
    
    if (currentCycle && currentCycle.id !== 'all') {
        const cycleStart = new Date(currentCycle.startDate);
        
        if (currentCycle.endDate && isPast(new Date(currentCycle.endDate))) {
            isHistoric = true;
            const cycleEnd = new Date(currentCycle.endDate);
            const cycleDurationDays = Math.max(1, differenceInDays(cycleEnd, cycleStart) + 1);
            
            cycleDailyAverage = expenses > 0 ? expenses / cycleDurationDays : 0;
            cycleWeeklyAverage = cycleDailyAverage * 7;
        } else {
            isHistoric = false;
            const endOfCurrentMonth = endOfMonth(now);
            const daysLeft = Math.max(1, differenceInDays(endOfCurrentMonth, now));
            
            if (balance > 0) {
                dailyBudget = balance / daysLeft;
                weeklyBudget = dailyBudget * 7;
            }
        }
    }
    
    return {
        totalIncome: income,
        totalExpenses: expenses,
        balance,
        weeklyBudget,
        dailyBudget,
        isHistoric,
        cycleDailyAverage,
        cycleWeeklyAverage,
        previousCycleIncome: 0, // Will be filled in getDashboardData
        previousCycleExpenses: 0, // Will be filled in getDashboardData
    };
};

export async function getDashboardData(userId: string, cycleId: string | null) {
    if (!userId) {
        throw new Error("User not authenticated.");
    }

    const todayEnd = new Date();
    todayEnd.setHours(23, 59, 59, 999);
    const sevenDaysAgoStart = subDays(startOfToday(), 6);

    const [
        paymentMethods,
        savingsFunds,
        currentCycle,
        billingCycles,
        categories,
        weeklyInsights,
        installmentProjection,
    ] = await Promise.all([
        getPaymentMethods(userId),
        getSavingsFunds(userId),
        getCurrentBillingCycle(userId),
        getBillingCycles(userId),
        getCategories(userId),
        getBudgetInsights(userId, sevenDaysAgoStart, todayEnd),
        getTransactions(userId, { projection: true }),
    ]);
    
    let activeCycle = currentCycle;
    if (cycleId) {
        if (cycleId === 'all') {
            activeCycle = { id: 'all', userId, startDate: new Date(0).toISOString() };
        } else {
            activeCycle = billingCycles.find(c => c.id === cycleId) || null;
        }
    }

    const transactionsForCycle = await getTransactions(userId, { cycle: activeCycle });

    const cycleStartDate = activeCycle ? new Date(activeCycle.startDate) : new Date(0);
    const cycleEndDate = activeCycle?.endDate ? new Date(activeCycle.endDate) : (activeCycle?.id === 'all' ? new Date() : endOfMonth(new Date()));

    const expensesByCategory = await getExpensesByCategory(userId, cycleStartDate, cycleEndDate);

    let budgetInsights = calculateCycleBudgetInsights(transactionsForCycle, activeCycle);
    
    // Find previous cycle and get its totals
    if (activeCycle && activeCycle.id !== 'all') {
        const selectedCycleIndex = billingCycles.findIndex(c => c.id === activeCycle!.id);
        if (selectedCycleIndex > -1 && selectedCycleIndex + 1 < billingCycles.length) {
            const previousCycle = billingCycles[selectedCycleIndex + 1];
            const transactionsForPreviousCycle = await getTransactions(userId, { cycle: previousCycle });
            const prevIncome = transactionsForPreviousCycle.filter(t => t.type === 'income' && !t.savingsFundId && !t.isCardPayment).reduce((sum, t) => sum + t.amount, 0);
            const prevExpenses = transactionsForPreviousCycle.filter(t => t.type === 'expense' && !t.savingsFundId && !t.isCardPayment).reduce((sum, t) => sum + t.amount, 0);
            
            budgetInsights.previousCycleIncome = prevIncome;
            budgetInsights.previousCycleExpenses = prevExpenses;
        }
    }

    const totalCyclesCount = billingCycles.length;

    return {
        transactionsForCycle,
        categories,
        paymentMethods,
        savingsFunds,
        currentCycle,
        billingCycles,
        totalCyclesCount,
        budgetInsights: { ...budgetInsights, ...weeklyInsights },
        expensesByCategory,
        installmentProjection,
    };
}

    