
"use client";

import React, { useState, useEffect, useMemo, useCallback, useRef } from "react";
import { useRouter } from 'next/navigation';
import type { Transaction, TransactionType, Category, DateRange, PaymentMethod, SavingsFund, BillingCycle, InstallmentProjection, BudgetInsights } from "@/types";
import { DeleteConfirmationDialog } from "@/components/transactions/DeleteConfirmationDialog";
import { LayoutDashboard, Plus } from "lucide-react";
import { useTranslations } from "@/contexts/LanguageContext";
import { useToast } from "@/hooks/use-toast";
import { deleteTransaction } from "@/app/actions/transactions";
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

// Custom hooks
import { useDashboardFilters } from "@/hooks/useDashboardFilters";
import { usePagination } from "@/hooks/usePagination";
import { useScrollToTransaction } from "@/hooks/useScrollToTransaction";
import { useFilteredTransactions } from "@/hooks/useFilteredTransactions";
import { useDailyExpensesChartData } from "@/hooks/useDailyExpensesChartData";
import { useIncomeExpenseChartData } from "@/hooks/useIncomeExpenseChartData";
import { useCycleDateRange } from "@/hooks/useCycleDateRange";

const ALL_CYCLES_ID = "all";

interface ExpenseByCategory {
  categoryId: string;
  name: string;
  isSystem: boolean;
  total: number;
}

export default function DashboardPage() {
  const { translations } = useTranslations();
  const { toast } = useToast();
  const { user } = useAuth();
  const router = useRouter();
  const filterCardRef = useRef<HTMLDivElement>(null);
  const paginationRef = useRef<HTMLDivElement>(null);
  const prevPageRef = useRef(1);

  // Dashboard data states
  const [categories, setCategories] = useState<Category[]>([]);
  const [paymentMethods, setPaymentMethods] = useState<PaymentMethod[]>([]);
  const [savingsFunds, setSavingsFunds] = useState<SavingsFund[]>([]);
  const [billingCycles, setBillingCycles] = useState<BillingCycle[]>([]);
  const [transactionsForCycle, setTransactionsForCycle] = useState<Transaction[]>([]);
  const [budgetInsights, setBudgetInsights] = useState<BudgetInsights | null>(null);
  const [selectedCycle, setSelectedCycle] = useState<BillingCycle | null>(null);
  const [expensesByCategory, setExpensesByCategory] = useState<ExpenseByCategory[]>([]);
  const [installmentProjection, setInstallmentProjection] = useState<InstallmentProjection[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [deletingTransaction, setDeletingTransaction] = useState<Transaction | null>(null);

  // Custom hooks for filters and pagination
  const {
    filters,
    updateSearchTerm,
    updateSelectedType,
    updateSelectedCategory,
    updateDateRange,
    clearFilters,
    isAnyFilterActive,
  } = useDashboardFilters();

  const { searchTerm, selectedType, selectedCategory, dateRange } = filters;

  const filteredTransactions = useFilteredTransactions(transactionsForCycle, filters);

  const {
    currentPage,
    itemsPerPage,
    setCurrentPage,
    setItemsPerPage,
  } = usePagination(filteredTransactions.length);

  // Restore page from session storage
  useEffect(() => {
    const pageFromStorage = sessionStorage.getItem('editedTransactionPage');
    if (pageFromStorage) {
      setCurrentPage(Number(pageFromStorage));
    }
  }, [setCurrentPage]);

  // Scroll to edited transaction
  useScrollToTransaction(isLoading);


  const loadDataForCycle = useCallback(async (cycle: BillingCycle | null) => {
    if (!user) return;
    setIsLoading(true);
    try {
      let cycleId = cycle ? cycle.id : null;

      // If no specific cycle is requested (initial load), check for a saved preference
      if (!cycleId) {
        const savedCycleId = sessionStorage.getItem('selectedCycleId');
        if (savedCycleId) {
          cycleId = savedCycleId;
        }
      }

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

      // Update selected cycle state based on what we loaded
      if (cycleId) {
        const loadedCycle = data.billingCycles.find(c => c.id === cycleId) ||
          (cycleId === ALL_CYCLES_ID ? { id: ALL_CYCLES_ID, userId: user.uid, startDate: new Date(0).toISOString() } : null) ||
          data.currentCycle;
        setSelectedCycle(loadedCycle);
      } else {
        setSelectedCycle(data.currentCycle);
      }

    } catch (error) {
      console.error("Failed to load dashboard data:", error);
      toast({ title: translations.errorTitle, description: "Could not load dashboard data.", variant: "destructive" });
    } finally {
      setIsLoading(false);
    }
  }, [user, router, toast, translations]);

  useEffect(() => {
    if (user && !selectedCycle) {
      loadDataForCycle(null);
    }
  }, [user, selectedCycle, loadDataForCycle]);

  const handleSelectCycle = (cycle: BillingCycle | null) => {
    if (cycle) {
      setSelectedCycle(cycle);
      sessionStorage.setItem('selectedCycleId', cycle.id);
      clearFilters(); // Clear filters when changing cycles
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

  const dailyExpensesChartData = useDailyExpensesChartData(budgetInsights, translations);



  useEffect(() => {
    if (!sessionStorage.getItem('editedTransactionId')) {
      setCurrentPage(1);
    }
  }, [searchTerm, selectedType, selectedCategory, dateRange, selectedCycle, itemsPerPage]);



  const incomeExpenseChartData = useIncomeExpenseChartData(budgetInsights, translations.income, translations.expense);

  const handleSeeDailyExpenses = () => {
    const today = new Date();
    const sevenDaysAgo = new Date(today);
    sevenDaysAgo.setDate(today.getDate() - 6);
    updateDateRange({ from: sevenDaysAgo, to: today });
    updateSelectedType('expense');
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
          onSetSelectedType={updateSelectedType}
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
          onDateChange={updateDateRange}
          onSearchTermChange={updateSearchTerm}
          onSelectedCategoryChange={updateSelectedCategory}
          onSelectedTypeChange={(type) => updateSelectedType(type as TransactionType | "all" | "savings")}
          onClearFilters={() => {
            clearFilters();
            setCurrentPage(1);
          }}
          isAnyFilterActive={isAnyFilterActive}
          cycleDateRange={cycleDateRange}
        />

        <div>
          <TransactionList
            ref={paginationRef}
            transactions={filteredTransactions}
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
