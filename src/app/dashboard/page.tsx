"use client";

import React, { useState, useEffect, useMemo, useCallback } from "react";
import { useRouter } from 'next/navigation';
import type { Transaction, TransactionType, Category, DateRange, PaymentMethod } from "@/types";
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
import { Plus, Filter, CalendarIcon, Search, XCircle, PieChart, BarChart } from "lucide-react";
import { useTranslations } from "@/contexts/LanguageContext";
import { useToast } from "@/hooks/use-toast";
import { useIsMobile } from "@/hooks/use-mobile";
import { format, isSameMonth, isSameYear } from "date-fns";
import { es, pt, enUS } from 'date-fns/locale';
import { cn } from "@/lib/utils";
import { getTransactions, deleteTransaction, getCategories, getPaymentMethods } from "@/app/actions";
import { Skeleton } from "@/components/ui/skeleton";
import { useAuth } from "@/contexts/AuthContext";
import { useScrollDirection } from "@/hooks/use-scroll-direction";
import { TransactionTypeToggle } from "@/components/transactions/TransactionTypeToggle";
import { MonthSelector } from "@/components/common/MonthSelector";
import { ExpensesChart } from "@/components/transactions/ExpensesChart";
import { IncomeExpenseChart } from "@/components/transactions/IncomeExpenseChart";


export default function DashboardPage() {
  const { translations, translateCategory, language } = useTranslations();
  const { toast } = useToast();
  const { user } = useAuth();
  const isMobile = useIsMobile();
  const router = useRouter();
  const scrollDirection = useScrollDirection();
  
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [paymentMethods, setPaymentMethods] = useState<PaymentMethod[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [deletingTransactionId, setDeletingTransactionId] = useState<string | null>(null);

  // Filters
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedType, setSelectedType] = useState<TransactionType | "all">("all");
  const [selectedCategory, setSelectedCategory] = useState<string | "all">("all");
  const [dateRange, setDateRange] = useState<DateRange | undefined>(undefined);
  const [selectedMonth, setSelectedMonth] = useState<Date | null>(new Date());

  const locales = {
    en: enUS,
    es: es,
    pt: pt,
  };
  const currentLocale = locales[language] || enUS;

  useEffect(() => {
    async function loadData() {
      if (!user) {
        setTransactions([]);
        setCategories([]);
        setIsLoading(false);
        return;
      }
      setIsLoading(true);
      const [initialTransactions, initialCategories, initialPaymentMethods] = await Promise.all([
        getTransactions(user.uid),
        getCategories(user.uid),
        getPaymentMethods(user.uid),
      ]);
      const parsed = initialTransactions.map((t) => ({
        ...t,
        date: new Date(t.date),
      }));
      setTransactions(parsed);
      setCategories(initialCategories);
      setPaymentMethods(initialPaymentMethods);
      setIsLoading(false);
    }
    loadData();
  }, [user]);

  const handleEdit = (transaction: Transaction) => {
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

   const handleDateSelect = (range: DateRange | undefined) => {
    if (range?.from && dateRange?.from && dateRange?.to) {
        setDateRange({ from: range.from, to: undefined });
    } else {
        setDateRange(range);
    }
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

  if (isLoading) {
    return (
      <div className="space-y-8">
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
       <MonthSelector selectedMonth={selectedMonth} onSelectMonth={setSelectedMonth} />

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-1 space-y-8">
            <TotalsDisplay transactions={filteredTransactions} />
          </div>
          <div className="lg:col-span-2 grid grid-cols-1 md:grid-cols-2 gap-8">
            <Card className="shadow-xl border-2 border-primary h-full">
            <CardHeader>
                <CardTitle className="flex items-center">
                <PieChart className="h-5 w-5 mr-2 text-primary" />
                {translations.expensesByCategory}
                </CardTitle>
            </CardHeader>
            <CardContent>
                <ExpensesChart transactions={expenseTransactions} categoryIdToNameMap={categoryIdToNameMap} />
            </CardContent>
            </Card>
            <Card className="shadow-xl border-2 border-primary h-full">
            <CardHeader>
                <CardTitle className="flex items-center">
                <BarChart className="h-5 w-5 mr-2 text-primary" />
                {translations.incomeVsExpense}
                </CardTitle>
            </CardHeader>
            <CardContent>
                <IncomeExpenseChart transactions={filteredTransactions} />
            </CardContent>
            </Card>
          </div>
        </div>

      <Card className="shadow-xl border-2 border-primary">
        <CardHeader>
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
        <CardContent className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
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
                  {cat.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Popover>
            <PopoverTrigger asChild>
              <Button
                variant={"outline"}
                className={cn(
                  "w-full justify-start text-left font-normal text-base h-10",
                  !dateRange?.from && "text-muted-foreground"
                )}
              >
                <CalendarIcon className="mr-2 h-4 w-4" />
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

      <TransactionList
        transactions={filteredTransactions}
        categories={categories}
        paymentMethods={paymentMethods}
        onEdit={handleEdit}
        onDelete={handleDelete}
      />

      <DeleteConfirmationDialog
        isOpen={!!deletingTransactionId}
        onClose={() => setDeletingTransactionId(null)}
        onConfirm={confirmDelete}
      />
    </div>

    <Button
      onClick={() => router.push('/add-transaction')}
      className={cn(
        "group fixed bottom-6 right-6 h-14 w-14 rounded-full bg-primary shadow-lg transition-all duration-300 ease-in-out hover:w-56 hover:bg-primary/90 gap-0 hover:gap-2",
        scrollDirection === "down" ? "scale-0" : "scale-100"
      )}
      aria-label={translations.addTransaction}
    >
      <Plus className="h-7 w-7 text-primary-foreground transition-transform duration-300 group-hover:rotate-90" strokeWidth={3} />
      <span className="w-0 overflow-hidden whitespace-nowrap text-lg font-semibold text-primary-foreground opacity-0 transition-all duration-300 group-hover:w-auto group-hover:opacity-100">
        {translations.addTransaction}
      </span>
    </Button>
    </>
  );
}
