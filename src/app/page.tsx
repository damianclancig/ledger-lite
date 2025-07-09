
"use client";

import React, { useState, useEffect, useMemo, useCallback } from "react";
import { useRouter } from 'next/navigation';
import type { Transaction, TransactionType, Category } from "@/types";
import { CATEGORIES } from "@/types";
import { TransactionList } from "@/components/transactions/TransactionList";
import { TransactionForm, type TransactionFormValues } from "@/components/transactions/TransactionForm";
import { TotalsDisplay } from "@/components/transactions/TotalsDisplay";
import { DeleteConfirmationDialog } from "@/components/transactions/DeleteConfirmationDialog";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
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
import { Plus, Filter, CalendarIcon, Search, Loader2 } from "lucide-react";
import { useTranslations } from "@/contexts/LanguageContext";
import { useToast } from "@/hooks/use-toast";
import { useIsMobile } from "@/hooks/use-mobile";
import { format } from "date-fns";
import { es, pt, enUS } from 'date-fns/locale';
import { cn } from "@/lib/utils";
import { getTransactions, updateTransaction, deleteTransaction } from "@/app/actions";
import { Skeleton } from "@/components/ui/skeleton";
import { useAuth } from "@/contexts/AuthContext";
import { useScrollDirection } from "@/hooks/use-scroll-direction";


export default function LedgerPage() {
  const { translations, translateCategory, language } = useTranslations();
  const { toast } = useToast();
  const { user } = useAuth();
  const isMobile = useIsMobile();
  const router = useRouter();
  const scrollDirection = useScrollDirection();
  
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingTransaction, setEditingTransaction] = useState<Transaction | null>(null);
  const [deletingTransactionId, setDeletingTransactionId] = useState<string | null>(null);

  // Filters
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedType, setSelectedType] = useState<TransactionType | "all">("all");
  const [selectedCategory, setSelectedCategory] = useState<Category | "all">("all");
  const [dateRange, setDateRange] = useState<{ from?: Date; to?: Date }>({});

  const locales = {
    en: enUS,
    es: es,
    pt: pt,
  };
  const currentLocale = locales[language] || enUS;

  useEffect(() => {
    async function loadTransactions() {
      if (!user) {
        setTransactions([]);
        setIsLoading(false);
        return;
      }
      setIsLoading(true);
      const initialTransactions = await getTransactions(user.uid);
      const parsed = initialTransactions.map((t) => ({
        ...t,
        date: new Date(t.date),
      }));
      setTransactions(parsed);
      setIsLoading(false);
    }
    loadTransactions();
  }, [user]);

  const handleUpdateSubmit = async (values: TransactionFormValues) => {
    if (!user || !editingTransaction) return;

    const result = await updateTransaction(editingTransaction.id, values, user.uid);

    if (result && 'error' in result) {
        toast({ title: "Error", description: result.error, variant: "destructive" });
    } else if(result) {
        const updatedTransaction = { ...result, date: new Date(result.date) };
        setTransactions(transactions.map((t) => (t.id === editingTransaction.id ? updatedTransaction : t)));
        toast({ title: "Transaction updated", description: "Your transaction has been successfully updated." });
        
        setIsFormOpen(false);
        setEditingTransaction(null);
    }
  };


  const handleEdit = (transaction: Transaction) => {
    setEditingTransaction(transaction);
    setIsFormOpen(true);
  };

  const handleDelete = (id: string) => {
    setDeletingTransactionId(id);
  };

  const confirmDelete = async () => {
    if (deletingTransactionId && user) {
      const result = await deleteTransaction(deletingTransactionId, user.uid);
      if (result.success) {
        setTransactions(transactions.filter((t) => t.id !== deletingTransactionId));
        toast({ title: "Transaction deleted", description: "The transaction has been removed.", variant: "destructive" });
      } else {
        toast({ title: "Error", description: result.error, variant: "destructive" });
      }
      setDeletingTransactionId(null);
    }
  };

  const filteredTransactions = useMemo(() => {
    return transactions.filter((t) => {
      const lowerSearchTerm = searchTerm.toLowerCase();
      const matchesSearch = t.description.toLowerCase().includes(lowerSearchTerm);
      const matchesType = selectedType === "all" || t.type === selectedType;
      const matchesCategory = selectedCategory === "all" || t.category === selectedCategory;
      const matchesDate =
        (!dateRange.from || new Date(t.date) >= dateRange.from) &&
        (!dateRange.to || new Date(t.date) <= dateRange.to);
      return matchesSearch && matchesType && matchesCategory && matchesDate;
    }).sort((a,b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  }, [transactions, searchTerm, selectedType, selectedCategory, dateRange]);

  if (isLoading) {
    return (
      <div className="space-y-8">
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
      <TotalsDisplay transactions={filteredTransactions} />

      <Card className="shadow-xl border-2 border-primary">
        <CardHeader>
          <CardTitle className="flex items-center">
            <Filter className="h-5 w-5 mr-2 text-primary" />
            {translations.transactions}
          </CardTitle>
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
          <Select
            value={selectedType}
            onValueChange={(value: string) => setSelectedType(value as TransactionType | "all")}
          >
            <SelectTrigger>
              <SelectValue placeholder={translations.filterByType} />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">{translations.allTypes}</SelectItem>
              <SelectItem value="income">{translations.income}</SelectItem>
              <SelectItem value="expense">{translations.expense}</SelectItem>
            </SelectContent>
          </Select>
          <Select
            value={selectedCategory}
            onValueChange={(value: string) => setSelectedCategory(value as Category | "all")}
          >
            <SelectTrigger>
              <SelectValue placeholder={translations.filterByCategory} />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">{translations.allCategories}</SelectItem>
              {CATEGORIES.map((cat) => (
                <SelectItem key={cat} value={cat}>
                  {translateCategory(cat)}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Popover>
            <PopoverTrigger asChild>
              <Button
                variant={"outline"}
                className={cn(
                  "w-full justify-start text-left font-normal",
                  !dateRange.from && !dateRange.to && "text-muted-foreground"
                )}
              >
                <CalendarIcon className="mr-2 h-4 w-4" />
                {dateRange.from && dateRange.to
                  ? `${format(dateRange.from, "PPP", {locale: currentLocale})} - ${format(dateRange.to, "PPP", {locale: currentLocale})}`
                  : dateRange.from 
                  ? `${translations.startDate}: ${format(dateRange.from, "PPP", {locale: currentLocale})}`
                  : dateRange.to
                  ? `${translations.endDate}: ${format(dateRange.to, "PPP", {locale: currentLocale})}`
                  : <span>{translations.filterByDateRange}</span>}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0" align="start">
              <Calendar
                locale={currentLocale}
                mode="range"
                selected={dateRange}
                onSelect={(range) => setDateRange(range || {})}
                initialFocus
                numberOfMonths={isMobile ? 1 : 2}
              />
            </PopoverContent>
          </Popover>
        </CardContent>
      </Card>

      <TransactionList
        transactions={filteredTransactions}
        onEdit={handleEdit}
        onDelete={handleDelete}
      />
      
      <Dialog open={isFormOpen} onOpenChange={setIsFormOpen}>
        <DialogContent className="sm:max-w-lg border-2 border-primary shadow-xl">
          <DialogHeader>
            <DialogTitle>
              {translations.editTransaction}
            </DialogTitle>
          </DialogHeader>
          <TransactionForm
            onSubmit={handleUpdateSubmit}
            initialData={editingTransaction || undefined}
            onClose={() => {
              setIsFormOpen(false);
              setEditingTransaction(null);
            }}
          />
        </DialogContent>
      </Dialog>

      <DeleteConfirmationDialog
        isOpen={!!deletingTransactionId}
        onClose={() => setDeletingTransactionId(null)}
        onConfirm={confirmDelete}
      />
    </div>

    <Button
      onClick={() => router.push('/add-transaction')}
      className={cn(
        "group fixed bottom-6 right-6 h-16 w-16 rounded-full bg-primary p-0 shadow-lg transition-all duration-300 ease-in-out hover:w-56 hover:bg-primary/90 gap-0 hover:gap-2",
        scrollDirection === "down" ? "scale-0" : "scale-100"
      )}
      aria-label={translations.addTransaction}
    >
      <Plus className="h-8 w-8 text-primary-foreground transition-transform duration-300 group-hover:rotate-90" strokeWidth={3} />
      <span className="w-0 overflow-hidden whitespace-nowrap text-lg font-semibold text-primary-foreground opacity-0 transition-all duration-300 group-hover:w-auto group-hover:opacity-100">
        {translations.addTransaction}
      </span>
    </Button>
    </>
  );
}
