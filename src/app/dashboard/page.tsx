
"use client";

import React, { useState, useEffect, useMemo, useCallback, useRef } from "react";
import { useRouter } from 'next/navigation';
import type { Transaction, TransactionType, Category, DateRange, PaymentMethod, SavingsFund, BillingCycle } from "@/types";
import { DeleteConfirmationDialog } from "@/components/transactions/DeleteConfirmationDialog";
import { Plus, LayoutDashboard, Rocket, Sparkles, Calendar as CalendarIcon } from "lucide-react";
import { useTranslations } from "@/contexts/LanguageContext";
import { useToast } from "@/hooks/use-toast";
import { getTransactions, deleteTransaction, getInstallmentProjection } from "@/app/actions/transactionActions";
import { getCategories } from "@/app/actions/categoryActions";
import { getPaymentMethods } from "@/app/actions/paymentMethodActions";
import { getSavingsFunds } from "@/app/actions/savingsFundActions";
import { getCurrentBillingCycle, startNewCycle, getBillingCycles } from "@/app/actions/billingCycleActions";
import { Skeleton } from "@/components/ui/skeleton";
import { useAuth } from "@/contexts/AuthContext";
import { CycleSelector } from "@/components/common/CycleSelector";
import { FloatingActionButton } from "@/components/common/FloatingActionButton";
import { TransactionList } from "@/components/transactions/TransactionList";
import { TotalsDisplay } from "@/components/transactions/TotalsDisplay";
import { FiltersCard } from "@/components/dashboard/cards/FiltersCard";
import { ExpensesChartCard } from "@/components/dashboard/cards/ExpensesChartCard";
import { IncomeExpenseChartCard } from "@/components/dashboard/cards/IncomeExpenseChartCard";
import { SavingsFundsCard } from "@/components/dashboard/cards/SavingsFundsCard";
import { InstallmentProjectionCard } from "@/components/dashboard/cards/InstallmentProjectionCard";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { subDays, startOfDay, format } from "date-fns";
import { es, pt, enUS } from "date-fns/locale";
import { cn } from "@/lib/utils";

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
  const [deletingTransaction, setDeletingTransaction] = useState<Transaction | null>(null);

  // Billing Cycles
  const [billingCycles, setBillingCycles] = useState<BillingCycle[]>([]);
  const [selectedCycle, setSelectedCycle] = useState<BillingCycle | null>(null);
  const [isStartingNewCycle, setIsStartingNewCycle] = useState(false);
  const [newCycleStartDate, setNewCycleStartDate] = useState<Date | undefined>(new Date());
  const [isNewCycleDialogOpen, setIsNewCycleDialogOpen] = useState(false);

  const locales = { en: enUS, es, pt };
  const currentLocale = locales[language] || enUS;

  // Filters
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedType, setSelectedType] = useState<TransactionType | "all">("all");
  const [selectedCategory, setSelectedCategory] = useState<string | "all">("all");
  const [dateRange, setDateRange] = useState<DateRange | undefined>(undefined);
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
      const [
        initialTransactions, 
        initialCategories, 
        initialPaymentMethods, 
        projectionData, 
        fundsData,
        currentCycle,
        allCycles
      ] = await Promise.all([
        getTransactions(user.uid),
        getCategories(user.uid),
        getPaymentMethods(user.uid),
        getInstallmentProjection(user.uid),
        getSavingsFunds(user.uid),
        getCurrentBillingCycle(user.uid),
        getBillingCycles(user.uid)
      ]);

      if (!currentCycle) {
        router.push('/welcome');
        return;
      }

      const parsed = initialTransactions.map((t) => ({ ...t, date: new Date(t.date) }));
      setTransactions(parsed);
      setCategories(initialCategories);
      setPaymentMethods(initialPaymentMethods);
      setInstallmentProjection(projectionData);
      setSavingsFunds(fundsData);
      setBillingCycles(allCycles);
      setSelectedCycle(currentCycle);
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
        setTransactions(prev => {
          if (result.deletedGroupId) {
            return prev.filter(t => t.groupId !== result.deletedGroupId);
          }
          return prev.filter((t) => t.id !== deletingTransaction.id);
        });
        toast({ title: translations.transactionDeletedTitle, description: translations.transactionDeletedDesc, variant: "destructive" });
      } else {
        toast({ title: translations.errorTitle, description: result.error, variant: "destructive" });
      }
      setDeletingTransaction(null);
    }
  };

  const handleStartNewCycle = async () => {
    if (!user || !newCycleStartDate) {
      toast({ title: translations.errorTitle, description: translations.dateRequired, variant: "destructive" });
      return;
    };
    setIsStartingNewCycle(true);
    const result = await startNewCycle(user.uid, startOfDay(newCycleStartDate));
    if ('error' in result) {
      toast({ title: translations.errorTitle, description: result.error, variant: "destructive" });
    } else {
      toast({ title: translations.newCycleStartedTitle, description: translations.newCycleStartedDesc });
      await loadAllData();
    }
    setIsStartingNewCycle(false);
    setIsNewCycleDialogOpen(false);
    setNewCycleStartDate(new Date());
  };
  
  const cycleDateRange = useMemo(() => {
    if (!selectedCycle) return { start: new Date(0), end: new Date() };
    return {
      start: new Date(selectedCycle.startDate),
      end: selectedCycle.endDate ? new Date(selectedCycle.endDate) : new Date(),
    };
  }, [selectedCycle]);

  const transactionsForCycle = useMemo(() => {
    return transactions.filter(t => {
      if (t.savingsFundId) return false;
      const transactionDate = new Date(t.date);
      return transactionDate >= cycleDateRange.start && transactionDate <= cycleDateRange.end;
    });
  }, [transactions, cycleDateRange]);

  const filteredTransactionsForList = useMemo(() => {
    return transactionsForCycle.filter((t) => {
      const lowerSearchTerm = searchTerm.toLowerCase();
      const matchesSearch = t.description.toLowerCase().includes(lowerSearchTerm);
      const matchesType = selectedType === "all" || t.type === selectedType;
      const matchesCategory = selectedCategory === "all" || t.categoryId === selectedCategory;
      const transactionDate = new Date(t.date);
      const matchesDateRange = !dateRange?.from || transactionDate >= dateRange.from;
      const matchesDateRangeEnd = !dateRange?.to || transactionDate <= dateRange.to;
      return matchesSearch && matchesType && matchesCategory && matchesDateRange && matchesDateRangeEnd;
    }).sort((a,b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  }, [transactionsForCycle, searchTerm, selectedType, selectedCategory, dateRange]);

  useEffect(() => {
    if (!sessionStorage.getItem('editedTransactionId')) {
        setCurrentPage(1);
    }
  }, [searchTerm, selectedType, selectedCategory, dateRange, selectedCycle]);

   const handleDateSelect = (range: DateRange | undefined) => {
    if (dateRange?.from && dateRange?.to && range?.from) {
      setDateRange({ from: range.from, to: undefined });
    } else {
      setDateRange(range);
    }
  };

  const incomeExpenseChartData = useMemo(() => {
    const currentTotals = transactionsForCycle.reduce((acc, t) => {
      if (t.type === 'income') acc.income += t.amount;
      if (t.type === 'expense') acc.expense += t.amount;
      return acc;
    }, { income: 0, expense: 0 });
    
    let previousCycle;
    if (selectedCycle) {
      const selectedCycleIndex = billingCycles.findIndex(c => c.id === selectedCycle.id);
      if (selectedCycleIndex > -1 && selectedCycleIndex + 1 < billingCycles.length) {
          previousCycle = billingCycles[selectedCycleIndex + 1];
      }
    }
    
    let previousTotals = { income: 0, expense: 0 };
    if (previousCycle) {
      const prevCycleStart = new Date(previousCycle.startDate);
      const prevCycleEnd = new Date(previousCycle.endDate!);
      previousTotals = transactions.filter(t => !t.savingsFundId && new Date(t.date) >= prevCycleStart && new Date(t.date) <= prevCycleEnd)
        .reduce((acc, t) => {
          if (t.type === 'income') acc.income += t.amount;
          if (t.type === 'expense') acc.expense += t.amount;
          return acc;
        }, { income: 0, expense: 0 });
    }

    return [
        { name: translations.income, current: currentTotals.income, previous: previousTotals.income },
        { name: translations.expense, current: currentTotals.expense, previous: previousTotals.expense },
    ];
  }, [transactionsForCycle, billingCycles, selectedCycle, translations, transactions]);


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
            <Dialog open={isNewCycleDialogOpen} onOpenChange={setIsNewCycleDialogOpen}>
                <DialogTrigger asChild>
                    <Button variant="outline" className="border-primary border-2">
                        <Rocket className="mr-2 h-4 w-4" />
                        {translations.startNewCycle}
                    </Button>
                </DialogTrigger>
                <DialogContent>
                <DialogHeader>
                    <DialogTitle>{translations.confirmNewCycleTitle}</DialogTitle>
                    <DialogDescription className="text-base">
                    {translations.confirmNewCycleDesc}
                    </DialogDescription>
                </DialogHeader>
                <div className="py-4 space-y-2">
                     <p className="font-semibold">{translations.selectStartDate}</p>
                    <Popover>
                        <PopoverTrigger asChild>
                            <Button
                            variant={"outline"}
                            className={cn(
                                "w-full justify-start text-left font-normal h-11 text-base",
                                !newCycleStartDate && "text-muted-foreground"
                            )}
                            >
                            <CalendarIcon className="mr-2 h-5 w-5" />
                            {newCycleStartDate ? format(newCycleStartDate, "PPP", { locale: currentLocale }) : <span>{translations.date}</span>}
                            </Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-auto p-0">
                            <Calendar
                                mode="single"
                                selected={newCycleStartDate}
                                onSelect={setNewCycleStartDate}
                                disabled={(date) => date > new Date() || date < subDays(new Date(), 30)}
                                initialFocus
                            />
                        </PopoverContent>
                    </Popover>
                </div>
                <DialogFooter>
                    <Button variant="ghost" onClick={() => setIsNewCycleDialogOpen(false)}>{translations.cancel}</Button>
                    <Button onClick={handleStartNewCycle} disabled={isStartingNewCycle || !newCycleStartDate}>
                    {isStartingNewCycle ? translations.starting : translations.confirmAndStart}
                    </Button>
                </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>

       <CycleSelector 
         cycles={billingCycles}
         selectedCycle={selectedCycle}
         onSelectCycle={setSelectedCycle}
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
        onDateChange={setDateRange}
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
        currentCycleStartDate={cycleDateRange.start}
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
          totalTransactionsCount={transactions.length}
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
