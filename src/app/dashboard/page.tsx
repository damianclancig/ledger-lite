"use client";

import React, { useState, useEffect, useMemo, useCallback, useRef } from "react";
import { useRouter } from 'next/navigation';
import type { Transaction, TransactionType, Category, DateRange, PaymentMethod, InstallmentProjection } from "@/types";
import { TransactionList } from "@/components/transactions/TransactionList";
import { TotalsDisplay } from "@/components/transactions/TotalsDisplay";
import { DeleteConfirmationDialog } from "@/components/transactions/DeleteConfirmationDialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Plus, Filter, CalendarIcon, Search, XCircle, PieChart, BarChart, LayoutDashboard, LineChart } from "lucide-react";
import { useTranslations } from "@/contexts/LanguageContext";
import { useToast } from "@/hooks/use-toast";
import { useIsMobile } from "@/hooks/use-mobile";
import { format, isSameMonth, isSameYear, subMonths } from "date-fns";
import { es, pt, enUS } from 'date-fns/locale';
import { cn } from "@/lib/utils";
import { getTransactions, deleteTransaction, getInstallmentProjection } from "@/app/actions/transactionActions";
import { getCategories } from "@/app/actions/categoryActions";
import { getPaymentMethods } from "@/app/actions/paymentMethodActions";
import { Skeleton } from "@/components/ui/skeleton";
import { useAuth } from "@/contexts/AuthContext";
import { TransactionTypeToggle } from "@/components/transactions/TransactionTypeToggle";
import { MonthSelector } from "@/components/common/MonthSelector";
import { ExpensesChart } from "@/components/transactions/ExpensesChart";
import { IncomeExpenseChart } from "@/components/transactions/IncomeExpenseChart";
import { FloatingActionButton } from "@/components/common/FloatingActionButton";
import { InstallmentProjectionChart } from "@/components/transactions/InstallmentProjectionChart";


export default function DashboardPage() {
  const { translations, translateCategory, language } = useTranslations();
  const { toast } = useToast();
  const { user } = useAuth();
  const isMobile = useIsMobile();
  const router = useRouter();
  const filtersCardRef = useRef<HTMLDivElement>(null);
  const transactionListRef = useRef<HTMLDivElement>(null);
  
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [paymentMethods, setPaymentMethods] = useState<PaymentMethod[]>([]);
  const [installmentProjection, setInstallmentProjection] = useState<InstallmentProjection[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [deletingTransactionId, setDeletingTransactionId] = useState<string | null>(null);

  // Filters
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedType, setSelectedType] = useState<TransactionType | "all">("all");
  const [selectedCategory, setSelectedCategory] = useState<string | "all">("all");
  const [dateRange, setDateRange] = useState<DateRange | undefined>(undefined);
  const [selectedMonth, setSelectedMonth] = useState<Date | null>(new Date());
  const [currentPage, setCurrentPage] = useState(1);
  const prevPageRef = useRef(currentPage);
  const wasLoadingRef = useRef(true);

  const locales = {
    en: enUS,
    es: es,
    pt: pt,
  };
  const currentLocale = locales[language] || enUS;

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
      const [initialTransactions, initialCategories, initialPaymentMethods, projectionData] = await Promise.all([
        getTransactions(user.uid),
        getCategories(user.uid),
        getPaymentMethods(user.uid),
        getInstallmentProjection(user.uid),
      ]);
      const parsed = initialTransactions.map((t) => ({
        ...t,
        date: new Date(t.date),
      }));
      setTransactions(parsed);
      setCategories(initialCategories);
      setPaymentMethods(initialPaymentMethods);
      setInstallmentProjection(projectionData);
      setIsLoading(false);
    }
    loadData();
  }, [user]);

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

  useEffect(() => {
    if (prevPageRef.current !== currentPage) {
      if (currentPage > prevPageRef.current) {
        filtersCardRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
      } else if (currentPage < prevPageRef.current) {
        transactionListRef.current?.scrollIntoView({ behavior: 'smooth', block: 'end' });
      }
      prevPageRef.current = currentPage;
    }
  }, [currentPage]);

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

  const isAnyFilterActive = useMemo(() => {
    return (
      searchTerm !== "" ||
      selectedType !== "all" ||
      selectedCategory !== "all" ||
      dateRange?.from !== undefined ||
      (selectedMonth !== null && !isSameMonth(selectedMonth, new Date()))
    );
  }, [searchTerm, selectedType, selectedCategory, dateRange, selectedMonth]);

  const clearFilters = () => {
    setSearchTerm("");
    setSelectedType("all");
    setSelectedCategory("all");
    setDateRange(undefined);
    setSelectedMonth(new Date());
  };

  const expenseTransactions = useMemo(() => {
    return filteredTransactions.filter(t => t.type === 'expense');
  }, [filteredTransactions]);
  
  const categoryIdToNameMap = useMemo(() => {
    return categories.reduce((acc, cat) => {
        acc[cat.id] = cat.name;
        return acc;
    }, {} as Record<string, string>);
  }, [categories]);

  const incomeExpenseChartData = useMemo(() => {
    const getTotalsForMonth = (monthDate: Date) => {
        const monthlyTransactions = transactions.filter(t => isSameMonth(t.date, monthDate) && isSameYear(t.date, monthDate));
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

  const getCategoryDisplay = (cat: Category) => {
    if (cat.name === "Taxes" && language !== "en") {
      return `Taxes (${translateCategory("Taxes")})`;
    }
    return cat.name;
  };

  if (isLoading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-10 mb-8" />
        <div className="grid gap-6 md:grid-cols-3 mb-8">
            <Skeleton className="h-24" />
            <Skeleton className="h-24" />
            <Skeleton className="h-24" />
        </div>
        <Card className="shadow-xl border-2 border-primary"><CardHeader><Skeleton className="h-8 w-1/4" /></CardHeader><CardContent><Skeleton className="h-10" /></CardContent></Card>
        <Card className="shadow-xl border-2 border-primary"><CardContent className="p-0"><Skeleton className="h-96" /></CardContent></Card>
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

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-1 space-y-8">
            <TotalsDisplay transactions={filteredTransactions} />
          </div>
          <div className="lg:col-span-2 grid grid-cols-1 md:grid-cols-2 gap-8">
            <Card className="shadow-xl border-2 border-primary h-full">
            <CardHeader className="p-4">
                <CardTitle className="flex items-center">
                <PieChart className="h-5 w-5 mr-2 text-primary" />
                {translations.expensesByCategory}
                </CardTitle>
            </CardHeader>
            <CardContent className="p-4 pt-0">
                <ExpensesChart transactions={expenseTransactions} categoryIdToNameMap={categoryIdToNameMap} />
            </CardContent>
            </Card>
            <Card className="shadow-xl border-2 border-primary h-full">
            <CardHeader className="p-4">
                <CardTitle className="flex items-center">
                <BarChart className="h-5 w-5 mr-2 text-primary" />
                {translations.incomeVsExpense}
                </CardTitle>
            </CardHeader>
            <CardContent className="p-4 pt-0">
                <IncomeExpenseChart chartData={incomeExpenseChartData} />
            </CardContent>
            </Card>
          </div>
            <div className="lg:col-span-3">
                <Card className="shadow-xl border-2 border-primary h-full">
                    <CardHeader className="p-4">
                        <CardTitle className="flex items-center">
                        <LineChart className="h-5 w-5 mr-2 text-primary" />
                        {translations.installmentProjection}
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="p-4 pt-0">
                        <InstallmentProjectionChart data={installmentProjection} />
                    </CardContent>
                </Card>
            </div>
        </div>

      <div ref={filtersCardRef} className="scroll-mt-24">
        <Card className="shadow-xl border-2 border-primary">
          <CardHeader className="p-4">
            <div className="flex flex-col items-start md:flex-row md:items-center md:justify-between">
              <CardTitle className="flex items-center mb-2 md:mb-0">
                <Filter className="h-5 w-5 mr-2 text-primary" />
                {translations.transactions}
              </CardTitle>
              <Button
                variant="link"
                onClick={clearFilters}
                className={cn(
                  "hidden md:flex text-base text-muted-foreground hover:text-primary p-0 h-auto justify-start transition-opacity duration-300",
                  isAnyFilterActive ? "opacity-100" : "opacity-0 pointer-events-none"
                )}
                aria-hidden={!isAnyFilterActive}
              >
                <XCircle className="mr-2 h-4 w-4" />
                <span className="mr-2">{translations.clearFilters}</span>
              </Button>
            </div>
          </CardHeader>
          <CardContent className="p-4 pt-0 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                type="text"
                placeholder={translations.searchDescription}
                value={searchTerm}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            <TransactionTypeToggle
              value={selectedType}
              onChange={(value) => setSelectedType(value as TransactionType | "all")}
            />
            <Select
              value={selectedCategory}
              onValueChange={(value: string) => setSelectedCategory(value as string | "all")}
            >
              <SelectTrigger className="text-base">
                <SelectValue placeholder={translations.filterByCategory} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">{translations.allCategories}</SelectItem>
                {categories.filter(c => c.isEnabled).map((cat) => (
                  <SelectItem key={cat.id} value={cat.id}>
                    {getCategoryDisplay(cat)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <div className="relative">
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant={"outline"}
                    className={cn(
                      "w-full justify-start text-left font-normal text-base h-10 pl-10",
                      !dateRange?.from && "text-muted-foreground"
                    )}
                  >
                    {dateRange?.from ? (
                      dateRange.to ? (
                        <>
                          {format(dateRange.from, "LLL dd, y")} -{" "}
                          {format(dateRange.to, "LLL dd, y")}
                        </>
                      ) : (
                        format(dateRange.from, "LLL dd, y")
                      )
                    ) : (
                      <span>{translations.filterByDateRange}</span>
                    )}
                  </Button>
                </PopoverTrigger>
                <CalendarIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    initialFocus
                    mode="range"
                    month={selectedMonth || new Date()}
                    defaultMonth={dateRange?.from}
                    selected={dateRange}
                    onSelect={handleDateSelect}
                    numberOfMonths={1}
                  />
                </PopoverContent>
              </Popover>
            </div>
            {isMobile && isAnyFilterActive && (
                <Button
                  variant="outline"
                  onClick={clearFilters}
                  className="w-full md:hidden"
                >
                  <XCircle className="mr-2 h-4 w-4" />
                  {translations.clearFilters}
                </Button>
              )}
          </CardContent>
        </Card>
      </div>
      
      <div ref={transactionListRef}>
        <TransactionList
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
