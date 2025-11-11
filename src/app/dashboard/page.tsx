
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
import { isSameDay, parseISO, differenceInDays, startOfDay, format as formatDate } from "date-fns";

const ALL_CYCLES_ID = "all";

export default function DashboardPage() {
  const { translations } = useTranslations();
  const { toast } = useToast();
  const { user } = useAuth();
  const router = useRouter();
  const filterCardRef = useRef<HTMLDivElement>(null);
  const paginationRef = useRef<HTMLDivElement>(null);
  
  const [categories, setCategories] = useState<Category[]>([]);
  const [paymentMethods, setPaymentMethods] = useState<PaymentMethod[]>([]);
  const [savingsFunds, setSavingsFunds] = useState<SavingsFund[]>([]);
  const [billingCycles, setBillingCycles] = useState<BillingCycle[]>([]);
  
  const [transactionsForCycle, setTransactionsForCycle] = useState<Transaction[]>([]);
  const [budgetInsights, setBudgetInsights] = useState<BudgetInsights | null>(null);
  const [selectedCycle, setSelectedCycle] = useState<BillingCycle | null>(null);
  const [expensesByCategory, setExpensesByCategory] = useState<any[]>([]);
  const [installmentProjection, setInstallmentProjection] = useState<InstallmentProjection[]>([]);

  const [isLoading, setIsLoading] = useState(true);
  const [deletingTransaction, setDeletingTransaction] = useState<Transaction | null>(null);
  
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

  const loadDataForCycle = useCallback(async (cycle: BillingCycle | null) => {
    if (!user) return;
    setIsLoading(true);
    try {
        const cycleId = cycle ? cycle.id : null;
        const data = await getDashboardData(user.uid, cycleId);

        if (!data.currentCycle && data.totalCyclesCount === 0) {
            router.push('/welcome');
            return;
        }

        setTransactionsForCycle(data.transactionsForCycle);
        setBudgetInsights(data.budgetInsights);
        setExpensesByCategory(data.expensesByCategory);
        setInstallmentProjection(data.installmentProjection);
        setCategories(data.categories);
        setPaymentMethods(data.paymentMethods);
        setSavingsFunds(data.savingsFunds);
        setBillingCycles(data.billingCycles);
        
        const savedCycleId = sessionStorage.getItem('selectedCycleId');
        if (savedCycleId && !selectedCycle) {
            const cycleToSelect = data.billingCycles.find(c => c.id === savedCycleId) || (savedCycleId === ALL_CYCLES_ID ? { id: ALL_CYCLES_ID, userId: user.uid, startDate: new Date(0).toISOString() } : null);
            setSelectedCycle(cycleToSelect || data.currentCycle);
        } else if (!selectedCycle) {
            setSelectedCycle(data.currentCycle);
        }

    } catch (error) {
        console.error("Failed to load dashboard data:", error);
        toast({ title: translations.errorTitle, description: "Could not load dashboard data.", variant: "destructive" });
    } finally {
        setIsLoading(false);
    }
  }, [user, router, toast, translations, selectedCycle]);

  useEffect(() => {
    if (user && !selectedCycle) {
        loadDataForCycle(null);
    }
  }, [user, selectedCycle, loadDataForCycle]);

  const handleSelectCycle = (cycle: BillingCycle | null) => {
    if (cycle) {
        setSelectedCycle(cycle);
        sessionStorage.setItem('selectedCycleId', cycle.id);
        loadDataForCycle(cycle);
    }
  };

  useEffect(() => {
    if (prevPageRef.current === currentPage) return;
  
    if (currentPage > prevPageRef.current) {
      filterCardRef.current?.scrollIntoView({ behavior: 'smooth' });
    } else if (currentPage < prevPageRef.current) {
      paginationRef.current?.scrollIntoView({ behavior: 'smooth', block: 'end' });
    }
    prevPageRef.current = currentPage;
  }, [currentPage]);
  
  const handleStartNewCycle = async (startDate: Date) => {
    if (!user) return;
    const result = await startNewCycle(user.uid, startDate);
    if ('error' in result) {
        toast({ title: translations.errorTitle, description: result.error, variant: "destructive" });
    } else {
        toast({ title: translations.newCycleStartedTitle, description: translations.newCycleStartedDesc });
        sessionStorage.removeItem('selectedCycleId');
        setSelectedCycle(null);
        loadDataForCycle(null);
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
        loadDataForCycle(selectedCycle);
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

  const dailyExpensesChartData = useMemo(() => {
    if (!budgetInsights?.dailyExpenses) return [];

    const now = new Date();
    const userLocale = typeof navigator !== 'undefined' ? navigator.language : 'en-US';
    
    // 1. Create a map for the last 7 days in the user's local timezone
    const dailyTotals = new Map<string, number>();
    for (let i = 0; i < 7; i++) {
        const date = new Date(now);
        date.setDate(date.getDate() - i);
        const dayKey = formatDate(date, 'yyyy-MM-dd');
        dailyTotals.set(dayKey, 0);
    }

    // 2. Process transactions and aggregate amounts into the local timezone days
    budgetInsights.dailyExpenses.forEach(expense => {
        const expenseDate = new Date(expense.date); // This is UTC date
        const localDayKey = formatDate(expenseDate, 'yyyy-MM-dd'); // Convert to local 'YYYY-MM-DD'
        if (dailyTotals.has(localDayKey)) {
            dailyTotals.set(localDayKey, dailyTotals.get(localDayKey)! + expense.total);
        }
    });

    // 3. Format the data for the chart
    const getDayName = (date: Date): string => {
        return date.toLocaleDateString(userLocale, { weekday: 'long' });
    }

    return Array.from(dailyTotals.entries())
        .map(([dayKey, total]) => {
            const itemDate = new Date(dayKey + 'T12:00:00'); // Use noon to avoid TZ shifts
            let dayLabel: string;
            const diff = differenceInDays(startOfDay(now), startOfDay(itemDate));

            if (diff === 0) dayLabel = 'today';
            else if (diff === 1) dayLabel = 'yesterday';
            else dayLabel = getDayName(itemDate);

            return {
                name: dayLabel,
                amount: total,
                isToday: diff === 0,
            };
        })
        .reverse(); // To have the oldest day first

  }, [budgetInsights?.dailyExpenses]);

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
    if (!budgetInsights) {
        return [
            { name: translations.income, current: 0, previous: 0 },
            { name: translations.expense, current: 0, previous: 0 },
        ];
    }
    return [
        { name: translations.income, current: budgetInsights.totalIncome, previous: budgetInsights.previousCycleIncome },
        { name: translations.expense, current: budgetInsights.totalExpenses, previous: budgetInsights.previousCycleExpenses },
    ];
  }, [budgetInsights, translations]);

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

  if (isLoading || !selectedCycle) {
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
          totalIncome={budgetInsights?.totalIncome || 0}
          totalExpenses={budgetInsights?.totalExpenses || 0}
          balance={budgetInsights?.balance || 0}
          onSetSelectedType={setSelectedType}
        />

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
           <ExpensesChartCard 
             expensesByCategory={expensesByCategory}
           />
           <IncomeExpenseChartCard chartData={incomeExpenseChartData} />
           <SavingsFundsCard funds={savingsFunds} />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <DailyExpensesCard data={dailyExpensesChartData} onSeeDetails={handleSeeDailyExpenses} />
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
