
"use client";

import React, { useState, useEffect, useMemo, useCallback, useRef } from "react";
import { useRouter } from 'next/navigation';
import type { Transaction, TransactionType, Category, DateRange, PaymentMethod, SavingsFund, BillingCycle, InstallmentProjection, BudgetInsights } from "@/types";
import { DeleteConfirmationDialog } from "@/components/transactions/DeleteConfirmationDialog";
import { LayoutDashboard, Plus } from "lucide-react";
import { useTranslations } from "@/contexts/LanguageContext";
import { useToast } from "@/hooks/use-toast";
import { deleteTransaction } from "@/app/actions/transactionActions";
import { getDashboardData } from "@/app/actions/dashboardActions";
import { startNewCycle } from "@/app/actions/billingCycleActions";
import { Skeleton } from "@/components/ui/skeleton";
import { useAuth } from "@/contexts/AuthContext";
import { CycleSelector } from "@/components/common/CycleSelector";
import { FloatingActionButton } from "@/components/common/FloatingActionButton";
import { TransactionList } from "@/components/transactions/TransactionList";
import { TotalsDisplay } from "@/components/transactions/TotalsDisplay";
import { FiltersCard } from "@/components/dashboard/cards/FiltersCard";
import { ExpensesChartCard } from "@/components/dashboard/cards/ExpensesChartCard";
import { IncomeExpenseChartCard } from "@/components/dashboard/cards/IncomeExpenseChartCard";
import { DailyExpensesCard } from "@/components/dashboard/cards/DailyExpensesCard";
import { SavingsFundsCard } from "@/components/dashboard/cards/SavingsFundsCard";
import { InstallmentProjectionCard } from "@/components/dashboard/cards/InstallmentProjectionCard";
import { NewCycleDialog } from "@/components/dashboard/NewCycleDialog";
import { BudgetInsightsCard } from "@/components/dashboard/cards/BudgetInsightsCard";
import { differenceInDays, endOfMonth, isPast } from 'date-fns';

const ALL_CYCLES_ID = "all";

const calculateBudgetInsightsClient = (transactionsInCycle: Transaction[], allTransactions: Transaction[], currentCycle: BillingCycle | null): BudgetInsights => {
    const now = new Date();
    
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

    const dailyAverage7Days = last7DaysExpenses > 0 ? last7DaysExpenses / 7 : 0;

    const balance = transactionsInCycle.reduce((acc, t) => {
        if (t.type === 'income') return acc + t.amount;
        if (t.type === 'expense' && !t.savingsFundId) return acc - t.amount;
        return acc;
    }, 0);

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
            
            const cycleTotalExpenses = transactionsInCycle
                .filter(t => t.type === 'expense' && !t.savingsFundId)
                .reduce((sum, t) => sum + t.amount, 0);

            cycleDailyAverage = cycleTotalExpenses / cycleDurationDays;
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
        dailyAverage7Days,
        weeklyExpensesTotal: last7DaysExpenses,
        weeklyBudget,
        dailyBudget,
        isHistoric,
        cycleDailyAverage,
        cycleWeeklyAverage,
    };
};

const getDayName = (date: Date): string => {
    const dayIndex = date.getDay();
    const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    return days[dayIndex];
}

const calculateDailyExpenses = (transactions: Transaction[]) => {
    const dailyData: { name: string; amount: number; isToday: boolean }[] = [];
    const now = new Date();

    for (let i = 6; i >= 0; i--) {
        const date = new Date(now);
        date.setDate(now.getDate() - i);

        const dayStart = new Date(date);
        dayStart.setHours(0, 0, 0, 0);

        const dayEnd = new Date(date);
        dayEnd.setHours(23, 59, 59, 999);

        const expensesForDay = transactions
            .filter(t => {
                const transactionDate = new Date(t.date);
                return t.type === 'expense' && !t.savingsFundId && transactionDate >= dayStart && transactionDate <= dayEnd;
            })
            .reduce((sum, t) => sum + t.amount, 0);
        
        let dayLabel: string;
        if (i === 0) dayLabel = 'today';
        else if (i === 1) dayLabel = 'yesterday';
        else dayLabel = getDayName(date);

        dailyData.push({
            name: dayLabel,
            amount: expensesForDay,
            isToday: i === 0,
        });
    }

    return dailyData;
};

export default function DashboardPage() {
  const { translations, language } = useTranslations();
  const { toast } = useToast();
  const { user } = useAuth();
  const router = useRouter();
  const filterCardRef = useRef<HTMLDivElement>(null);
  const paginationRef = useRef<HTMLDivElement>(null);
  
  const [allTransactions, setAllTransactions] = useState<Transaction[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [paymentMethods, setPaymentMethods] = useState<PaymentMethod[]>([]);
  const [installmentProjection, setInstallmentProjection] = useState<InstallmentProjection[]>([]);
  const [savingsFunds, setSavingsFunds] = useState<SavingsFund[]>([]);
  const [billingCycles, setBillingCycles] = useState<BillingCycle[]>([]);
  const [budgetInsights, setBudgetInsights] = useState<BudgetInsights | null>(null);
  
  const [isLoading, setIsLoading] = useState(true);
  const [deletingTransaction, setDeletingTransaction] = useState<Transaction | null>(null);

  const [selectedCycle, setSelectedCycle] = useState<BillingCycle | null>(null);
  
  // Filters & Pagination
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedType, setSelectedType] = useState<TransactionType | "all">("all");
  const [selectedCategory, setSelectedCategory] = useState<string | "all">("all");
  const [dateRange, setDateRange] = useState<DateRange | undefined>(undefined);
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);
  const wasLoadingRef = useRef(true);
  const prevPageRef = useRef(currentPage);

    useEffect(() => {
        const pageFromStorage = sessionStorage.getItem('editedTransactionPage');
        if (pageFromStorage) {
            setCurrentPage(Number(pageFromStorage));
        }
    }, []);

  useEffect(() => {
    if (wasLoadingRef.current && !isLoading) {
      setTimeout(() => {
        const editedTransactionId = sessionStorage.getItem('editedTransactionId');
        if (editedTransactionId) {
          const element = document.getElementById(`transaction-${editedTransactionId}`);
          if (element) {
            element.scrollIntoView({
              behavior: 'smooth',
              block: 'center'
            });
          }
          sessionStorage.removeItem('editedTransactionId');
          sessionStorage.removeItem('editedTransactionPage');
        }
      }, 0);
    }
    wasLoadingRef.current = isLoading;
  }, [isLoading]);

  const loadAllData = useCallback(async () => {
    if (!user) return;
    setIsLoading(true);
    try {
      const data = await getDashboardData(user.uid);
      
      if (!data.currentCycle && data.totalCyclesCount === 0) {
        router.push('/welcome');
        return;
      }
      
      setAllTransactions(data.transactions);
      setCategories(data.categories);
      setPaymentMethods(data.paymentMethods);
      setInstallmentProjection(data.installmentProjection);
      setSavingsFunds(data.savingsFunds);
      setBillingCycles(data.billingCycles);
      // setBudgetInsights(data.budgetInsights); // Initial insights are now calculated on client

      const savedCycleId = sessionStorage.getItem('selectedCycleId');
      const savedCycle = savedCycleId ? data.billingCycles.find(c => c.id === savedCycleId) : null;
      
      if (savedCycle) {
        setSelectedCycle(savedCycle);
      } else if (savedCycleId === ALL_CYCLES_ID) {
        setSelectedCycle({ id: ALL_CYCLES_ID, userId: user.uid, startDate: new Date(0).toISOString() });
      } else if (data.currentCycle) {
        setSelectedCycle(data.currentCycle);
        sessionStorage.setItem('selectedCycleId', data.currentCycle.id);
      } else {
        setSelectedCycle(data.billingCycles[0] || null);
      }

    } catch (error) {
      console.error("Failed to load dashboard data:", error);
      toast({ title: translations.errorTitle, description: "Could not load dashboard data.", variant: "destructive" });
    } finally {
      setIsLoading(false);
    }
  }, [user, router, toast, translations]);


  useEffect(() => {
    loadAllData();
  }, [loadAllData]);


  useEffect(() => {
    if (prevPageRef.current === currentPage) return;
  
    if (currentPage > prevPageRef.current) {
      filterCardRef.current?.scrollIntoView({ behavior: 'smooth' });
    } else if (currentPage < prevPageRef.current) {
      paginationRef.current?.scrollIntoView({ behavior: 'smooth', block: 'end' });
    }
    prevPageRef.current = currentPage;
  }, [currentPage]);
  
  const handleSelectCycle = (cycle: BillingCycle | null) => {
    if (cycle) {
      setSelectedCycle(cycle);
      sessionStorage.setItem('selectedCycleId', cycle.id);
    }
  };

  const handleStartNewCycle = async (startDate: Date) => {
    if (!user) return;
    const result = await startNewCycle(user.uid, startDate);
    if ('error' in result) {
        toast({ title: translations.errorTitle, description: result.error, variant: "destructive" });
    } else {
        toast({ title: translations.newCycleStartedTitle, description: translations.newCycleStartedDesc });
        sessionStorage.removeItem('selectedCycleId'); // Clear saved cycle to default to new current one
        loadAllData();
    }
  }

  const handleEdit = (transaction: Transaction) => {
    sessionStorage.setItem('editedTransactionId', transaction.id);
    sessionStorage.setItem('editedTransactionPage', String(currentPage));
    
    if (transaction.groupId) {
      router.push(`/edit-installment-purchase/${transaction.groupId}`);
    } else {
      router.push(`/edit-transaction/${transaction.id}`);
    }
  };

  const handleDelete = (transaction: Transaction) => {
    setDeletingTransaction(transaction);
  };

  const confirmDelete = async () => {
    if (deletingTransaction && user) {
      const result = await deleteTransaction(deletingTransaction.id, user.uid);
      if (result.success) {
        loadAllData(); // Reload all data to ensure consistency
        toast({ title: translations.transactionDeletedTitle, description: translations.transactionDeletedDesc, variant: "destructive" });
      } else {
        toast({ title: translations.errorTitle, description: result.error, variant: "destructive" });
      }
      setDeletingTransaction(null);
    }
  };
  
  const cycleDateRange = useMemo(() => {
    if (!selectedCycle || selectedCycle.id === ALL_CYCLES_ID) return null;
    return {
      start: new Date(selectedCycle.startDate),
      end: selectedCycle.endDate ? new Date(selectedCycle.endDate) : new Date(),
    };
  }, [selectedCycle]);

  const transactionsForCycle = useMemo(() => {
    const baseTransactions = allTransactions.filter(t => !t.savingsFundId);
    if (!cycleDateRange) {
        return baseTransactions; // All cycles are selected
    }
    return baseTransactions.filter(t => {
      const transactionDate = new Date(t.date);
      return transactionDate >= cycleDateRange.start && transactionDate <= cycleDateRange.end;
    });
  }, [allTransactions, cycleDateRange]);

  // Recalculate budget insights whenever the selected cycle or transactions change
  useEffect(() => {
    if (selectedCycle && allTransactions.length > 0) {
      const insights = calculateBudgetInsightsClient(transactionsForCycle, allTransactions, selectedCycle);
      setBudgetInsights(insights);
    }
  }, [selectedCycle, transactionsForCycle, allTransactions]);

  const filteredTransactionsForList = useMemo(() => {
    return transactionsForCycle.filter((t) => {
      const lowerSearchTerm = searchTerm.toLowerCase();
      const matchesSearch = t.description.toLowerCase().includes(lowerSearchTerm);
      const matchesType = selectedType === "all" || t.type === selectedType;
      const matchesCategory = selectedCategory === "all" || t.categoryId === selectedCategory;
      
      let matchesDateRange = true;
      if (dateRange?.from) {
        const from = new Date(dateRange.from);
        from.setHours(0,0,0,0);
        matchesDateRange = new Date(t.date) >= from;
      }
      if (dateRange?.to) {
        const to = new Date(dateRange.to);
        to.setHours(23,59,59,999);
        matchesDateRange = matchesDateRange && new Date(t.date) <= to;
      }
      
      return matchesSearch && matchesType && matchesCategory && matchesDateRange;
    }).sort((a,b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  }, [transactionsForCycle, searchTerm, selectedType, selectedCategory, dateRange]);

  useEffect(() => {
    if (!sessionStorage.getItem('editedTransactionId')) {
        setCurrentPage(1);
    }
  }, [searchTerm, selectedType, selectedCategory, dateRange, selectedCycle, itemsPerPage]);

   const handleDateSelect = (range: DateRange | undefined) => {
    setDateRange(range);
  };
  
  const incomeExpenseChartData = useMemo(() => {
    const currentTotals = transactionsForCycle.reduce((acc, t) => {
      if (t.type === 'income') acc.income += t.amount;
      if (t.type === 'expense' && !t.savingsFundId) acc.expense += t.amount;
      return acc;
    }, { income: 0, expense: 0 });
    
    let previousCycle;
    if (selectedCycle && selectedCycle.id !== ALL_CYCLES_ID) {
      const selectedCycleIndex = billingCycles.findIndex(c => c.id === selectedCycle.id);
      if (selectedCycleIndex > -1 && selectedCycleIndex + 1 < billingCycles.length) {
          previousCycle = billingCycles[selectedCycleIndex + 1];
      }
    }
    
    let previousTotals = { income: 0, expense: 0 };
    if (previousCycle && previousCycle.endDate) {
      const prevCycleStart = new Date(previousCycle.startDate);
      const prevCycleEnd = new Date(previousCycle.endDate);
      previousTotals = allTransactions.filter(t => !t.savingsFundId && new Date(t.date) >= prevCycleStart && new Date(t.date) <= prevCycleEnd)
        .reduce((acc, t) => {
          if (t.type === 'income') acc.income += t.amount;
          if (t.type === 'expense' && !t.savingsFundId) acc.expense += t.amount;
          return acc;
        }, { income: 0, expense: 0 });
    }

    return [
        { name: translations.income, current: currentTotals.income, previous: previousTotals.income },
        { name: translations.expense, current: currentTotals.expense, previous: previousTotals.expense },
    ];
  }, [transactionsForCycle, billingCycles, selectedCycle, translations, allTransactions]);

  const dailyExpenses = useMemo(() => calculateDailyExpenses(allTransactions), [allTransactions]);

  const handleSeeDailyExpenses = () => {
    const today = new Date();
    const sevenDaysAgo = new Date(today);
    sevenDaysAgo.setDate(today.getDate() - 6);
    setDateRange({ from: sevenDaysAgo, to: today });
    setSelectedType('expense');
    filterCardRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const allCyclesWithVirtualOption: BillingCycle[] = useMemo(() => {
    const allCyclesOption: BillingCycle = {
      id: ALL_CYCLES_ID,
      userId: user?.uid || '',
      startDate: new Date(0).toISOString(),
    };
    return [...billingCycles, allCyclesOption];
  }, [billingCycles, user]);

  if (isLoading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-10 mb-8" />
        <div className="grid gap-6 md:grid-cols-3 mb-8">
            <Skeleton className="h-24" />
            <Skeleton className="h-24" />
            <Skeleton className="h-24" />
        </div>
        <Skeleton className="h-[120px] w-full" />
        <Skeleton className="h-96 w-full" />
      </div>
    );
  }
  
  const isInstallment = !!deletingTransaction?.groupId;
  const deleteDialogDescription = isInstallment 
    ? translations.areYouSureDeleteInstallment 
    : translations.areYouSureDelete;

  return (
    <>
    <div className="space-y-8">
        <div className="flex items-center justify-between">
            <div className="flex items-center">
                <LayoutDashboard className="h-8 w-8 mr-3 text-primary" />
                <h1 className="text-3xl font-bold">Dashboard</h1>
            </div>
            <NewCycleDialog 
              selectedCycle={selectedCycle}
              onCycleStarted={handleStartNewCycle}
            />
        </div>

       <CycleSelector 
         cycles={allCyclesWithVirtualOption}
         selectedCycle={selectedCycle}
         onSelectCycle={handleSelectCycle}
       />

        <TotalsDisplay 
          transactions={transactionsForCycle} 
          onSetSelectedType={setSelectedType}
        />

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
           <ExpensesChartCard 
             transactions={transactionsForCycle.filter(t => t.type === 'expense')} 
             categories={categories}
           />
           <IncomeExpenseChartCard chartData={incomeExpenseChartData} />
           <SavingsFundsCard funds={savingsFunds} />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <DailyExpensesCard data={dailyExpenses} onSeeDetails={handleSeeDailyExpenses} />
            {budgetInsights && <BudgetInsightsCard insights={budgetInsights} />}
        </div>
        
        <div className="grid grid-cols-1 gap-8">
            <InstallmentProjectionCard data={installmentProjection} />
        </div>
      
      <FiltersCard
        ref={filterCardRef}
        categories={categories}
        dateRange={dateRange}
        searchTerm={searchTerm}
        selectedCategory={selectedCategory}
        selectedType={selectedType}
        onDateChange={handleDateSelect}
        onSearchTermChange={setSearchTerm}
        onSelectedCategoryChange={setSelectedCategory}
        onSelectedTypeChange={setSelectedType}
        onClearFilters={() => {
          setSearchTerm("");
          setSelectedType("all");
          setSelectedCategory("all");
          setDateRange(undefined);
          setCurrentPage(1);
        }}
        isAnyFilterActive={searchTerm !== "" || selectedType !== "all" || selectedCategory !== "all" || dateRange?.from !== undefined}
        currentCycleStartDate={cycleDateRange?.start}
      />
      
      <div>
        <TransactionList
          ref={paginationRef}
          transactions={filteredTransactionsForList}
          categories={categories}
          paymentMethods={paymentMethods}
          onEdit={handleEdit}
          onDelete={handleDelete}
          currentPage={currentPage}
          onNextPage={() => setCurrentPage(p => p + 1)}
          onPreviousPage={() => setCurrentPage(p => p - 1)}
          itemsPerPage={itemsPerPage}
          onItemsPerPageChange={setItemsPerPage}
        />
      </div>

      <DeleteConfirmationDialog
        isOpen={!!deletingTransaction}
        onClose={() => setDeletingTransaction(null)}
        onConfirm={confirmDelete}
        description={deleteDialogDescription}
      />
    </div>

    <FloatingActionButton
        onClick={() => router.push('/add-transaction')}
        label={translations.addTransaction}
        icon={Plus}
    />
    </>
  );
}
