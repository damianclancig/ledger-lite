
"use client";

import React, { useState, useEffect, useMemo, useCallback, useRef } from "react";
import { useRouter, usePathname } from 'next/navigation';
import type { Transaction, TransactionType, Category, DateRange, PaymentMethod, SavingsFund } from "@/types";
import { DeleteConfirmationDialog } from "@/components/transactions/DeleteConfirmationDialog";
import { Plus, LayoutDashboard, PiggyBank } from "lucide-react";
import { useTranslations } from "@/contexts/LanguageContext";
import { useToast } from "@/hooks/use-toast";
import { isSameMonth, isSameYear, subMonths } from "date-fns";
import { getTransactions, deleteTransaction, getInstallmentProjection } from "@/app/actions/transactionActions";
import { getCategories } from "@/app/actions/categoryActions";
import { getPaymentMethods } from "@/app/actions/paymentMethodActions";
import { getSavingsFunds } from "@/app/actions/savingsFundActions";
import { Skeleton } from "@/components/ui/skeleton";
import { useAuth } from "@/contexts/AuthContext";
import { MonthSelector } from "@/components/common/MonthSelector";
import { FloatingActionButton } from "@/components/common/FloatingActionButton";
import { TransactionList } from "@/components/transactions/TransactionList";
import { TotalsDisplay } from "@/components/transactions/TotalsDisplay";
import { FiltersCard } from "@/components/dashboard/cards/FiltersCard";
import { ExpensesChartCard } from "@/components/dashboard/cards/ExpensesChartCard";
import { IncomeExpenseChartCard } from "@/components/dashboard/cards/IncomeExpenseChartCard";
import { SavingsFundsCard } from "@/components/dashboard/cards/SavingsFundsCard";
import { InstallmentProjectionCard } from "@/components/dashboard/cards/InstallmentProjectionCard";
import Link from "next/link";

export default function DashboardPage() {
  const { translations, language } = useTranslations();
  const { toast } = useToast();
  const { user } = useAuth();
  const router = useRouter();
  const filterCardRef = useRef<HTMLDivElement>(null);
  const paginationRef = useRef<HTMLDivElement>(null);
  
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [paymentMethods, setPaymentMethods] = useState<PaymentMethod[]>([]);
  const [installmentProjection, setInstallmentProjection] = useState<any[]>([]);
  const [savingsFunds, setSavingsFunds] = useState<SavingsFund[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [deletingTransactionId, setDeletingTransactionId] = useState<string | null>(null);

  // Filters
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedType, setSelectedType] = useState<TransactionType | "all">("all");
  const [selectedCategory, setSelectedCategory] = useState<string | "all">("all");
  const [dateRange, setDateRange] = useState<DateRange | undefined>(undefined);
  const [selectedMonth, setSelectedMonth] = useState<Date | null>(new Date());
  const [currentPage, setCurrentPage] = useState(1);
  const wasLoadingRef = useRef(true);
  const prevPageRef = useRef(currentPage);

    useEffect(() => {
        const pageFromStorage = sessionStorage.getItem('editedTransactionPage');
        if (pageFromStorage) {
            setCurrentPage(Number(pageFromStorage));
        }
    }, []);

  useEffect(() => {
    // This effect runs when isLoading transitions from true to false
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

  useEffect(() => {
    async function loadData() {
      if (!user) {
        setTransactions([]);
        setCategories([]);
        setIsLoading(false);
        return;
      }
      setIsLoading(true);
      const [initialTransactions, initialCategories, initialPaymentMethods, projectionData, fundsData] = await Promise.all([
        getTransactions(user.uid),
        getCategories(user.uid),
        getPaymentMethods(user.uid),
        getInstallmentProjection(user.uid),
        getSavingsFunds(user.uid),
      ]);
      const parsed = initialTransactions.map((t) => ({
        ...t,
        date: new Date(t.date),
      }));
      setTransactions(parsed);
      setCategories(initialCategories);
      setPaymentMethods(initialPaymentMethods);
      setInstallmentProjection(projectionData);
      setSavingsFunds(fundsData);
      setIsLoading(false);
    }
    loadData();
  }, [user]);

  useEffect(() => {
    // We don't want to scroll on the initial render.
    if (prevPageRef.current === currentPage) return;
  
    if (currentPage > prevPageRef.current) { // Navigated forward
      filterCardRef.current?.scrollIntoView({ behavior: 'smooth' });
    } else if (currentPage < prevPageRef.current) { // Navigated backward
      paginationRef.current?.scrollIntoView({ behavior: 'smooth', block: 'end' });
    }
    prevPageRef.current = currentPage;
  }, [currentPage]);

  const handleEdit = (transaction: Transaction) => {
    sessionStorage.setItem('editedTransactionId', transaction.id);
    sessionStorage.setItem('editedTransactionPage', String(currentPage));
    router.push(`/edit-transaction/${transaction.id}`);
  };

  const handleDelete = (id: string) => {
    setDeletingTransactionId(id);
  };

  const confirmDelete = async () => {
    if (deletingTransactionId && user) {
      const result = await deleteTransaction(deletingTransactionId, user.uid);
      if (result.success) {
        setTransactions(transactions.filter((t) => t.id !== deletingTransactionId));
        toast({ title: translations.transactionDeletedTitle, description: translations.transactionDeletedDesc, variant: "destructive" });
      } else {
        toast({ title: translations.errorTitle, description: result.error, variant: "destructive" });
      }
      setDeletingTransactionId(null);
    }
  };

  const filteredTransactions = useMemo(() => {
    return transactions.filter((t) => {
      // Exclude transactions belonging to a savings fund from the main dashboard
      if (t.savingsFundId) {
        return false;
      }

      const transactionDate = new Date(t.date);
      const lowerSearchTerm = searchTerm.toLowerCase();
      
      const matchesSearch = t.description.toLowerCase().includes(lowerSearchTerm);
      const matchesType = selectedType === "all" || t.type === selectedType;
      const matchesCategory = selectedCategory === "all" || t.categoryId === selectedCategory;
      
      const matchesDateRange =
        !dateRange?.from || transactionDate >= dateRange.from;

      const matchesDateRangeEnd = 
        !dateRange?.to || transactionDate <= dateRange.to;

      const matchesMonth = 
        !selectedMonth || 
        (isSameMonth(transactionDate, selectedMonth) && isSameYear(transactionDate, selectedMonth));

      return matchesSearch && matchesType && matchesCategory && matchesDateRange && matchesDateRangeEnd && matchesMonth;
    }).sort((a,b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  }, [transactions, searchTerm, selectedType, selectedCategory, dateRange, selectedMonth]);

  useEffect(() => {
    // Only reset to page 1 if not coming from an edit
    if (!sessionStorage.getItem('editedTransactionId')) {
        setCurrentPage(1);
    }
  }, [searchTerm, selectedType, selectedCategory, dateRange, selectedMonth]);

   const handleDateSelect = (range: DateRange | undefined) => {
    // If a complete range is already selected, the next click should reset and start a new range.
    if (dateRange?.from && dateRange?.to && range?.from) {
      setDateRange({ from: range.from, to: undefined });
    } else {
      setDateRange(range);
    }
  };

  const handleNextPage = () => {
    setCurrentPage((prev) => prev + 1);
  };

  const handlePreviousPage = () => {
    setCurrentPage((prev) => prev - 1);
  };

  const incomeExpenseChartData = useMemo(() => {
    const getTotalsForMonth = (monthDate: Date) => {
        const monthlyTransactions = transactions.filter(t => isSameMonth(t.date, monthDate) && isSameYear(t.date, monthDate) && !t.savingsFundId);
        const income = monthlyTransactions.filter(t => t.type === 'income').reduce((sum, t) => sum + t.amount, 0);
        const expense = monthlyTransactions.filter(t => t.type === 'expense').reduce((sum, t) => sum + t.amount, 0);
        return { income, expense };
    };

    const currentMonthDate = selectedMonth || new Date();
    const previousMonthDate = subMonths(currentMonthDate, 1);
    
    const currentTotals = getTotalsForMonth(currentMonthDate);
    const previousTotals = getTotalsForMonth(previousMonthDate);

    return [
        {
            name: translations.income,
            current: currentTotals.income,
            previous: previousTotals.income,
        },
        {
            name: translations.expense,
            current: currentTotals.expense,
            previous: previousTotals.expense,
        },
    ];
}, [transactions, selectedMonth, translations]);

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

  return (
    <>
    <div className="space-y-8">
      <div className="flex items-center">
            <LayoutDashboard className="h-8 w-8 mr-3 text-primary" />
            <h1 className="text-3xl font-bold">Dashboard</h1>
      </div>
       <MonthSelector selectedMonth={selectedMonth} onSelectMonth={setSelectedMonth} />

        <TotalsDisplay transactions={filteredTransactions} />

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
           <ExpensesChartCard 
             transactions={filteredTransactions.filter(t => t.type === 'expense')} 
             categories={categories}
           />
           <IncomeExpenseChartCard chartData={incomeExpenseChartData} />
           <SavingsFundsCard funds={savingsFunds} />
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
        selectedMonth={selectedMonth}
        onDateChange={handleDateSelect}
        onSearchTermChange={setSearchTerm}
        onSelectedCategoryChange={setSelectedCategory}
        onSelectedTypeChange={setSelectedType}
        onSetSelectedMonth={setSelectedMonth}
        onCurrentPageChange={setCurrentPage}
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
          onNextPage={handleNextPage}
          onPreviousPage={handlePreviousPage}
          totalTransactionsCount={transactions.length}
        />
      </div>

      <DeleteConfirmationDialog
        isOpen={!!deletingTransactionId}
        onClose={() => setDeletingTransactionId(null)}
        onConfirm={confirmDelete}
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
