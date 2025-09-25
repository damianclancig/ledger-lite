
"use client";

import React from 'react';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Edit3, Trash2, TrendingUp, TrendingDown, ChevronLeft, ChevronRight, ListTree, CalendarIcon, Tag, CreditCard } from "lucide-react";
import type { Transaction, Category, PaymentMethod } from "@/types";
import { useTranslations } from "@/contexts/LanguageContext";
import { format } from "date-fns";
import { es, pt, enUS } from 'date-fns/locale';
import { Card, CardContent } from "@/components/ui/card";
import { useIsMobile } from '@/hooks/use-mobile';
import { Separator } from '../ui/separator';
import { formatCurrency } from '@/lib/utils';

interface TransactionListProps {
  transactions: Transaction[];
  categories: Category[];
  paymentMethods: PaymentMethod[];
  onEdit: (transaction: Transaction) => void;
  onDelete: (id: string) => void;
  itemsPerPage?: number;
  currentPage: number;
  onNextPage: () => void;
  onPreviousPage: () => void;
  totalTransactionsCount: number;
}

export const TransactionList = React.forwardRef<HTMLDivElement, TransactionListProps>(
  ({
    transactions,
    categories,
    paymentMethods,
    onEdit,
    onDelete,
    itemsPerPage = 10,
    currentPage,
    onNextPage,
    onPreviousPage,
    totalTransactionsCount,
  }, ref) => {
    const { translations, language, translateCategory } = useTranslations();
    const isMobile = useIsMobile();

    const totalPages = Math.max(1, Math.ceil(transactions.length / itemsPerPage));
    const startIndex = (currentPage - 1) * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;
    const currentTransactions = transactions.slice(startIndex, endIndex);
    
    const locales = {
      en: enUS,
      es: es,
      pt: pt,
    };

    const formatDate = (date: Date | string) => {
      try {
        const dateObj = typeof date === 'string' ? new Date(date) : date;
        if (isNaN(dateObj.getTime())) {
          return "Invalid Date";
        }
        return format(dateObj, "PPP", { locale: locales[language] || enUS });
      } catch (e) {
        return "Invalid Date";
      }
    };

    const categoryMap = React.useMemo(() => new Map(categories.map(c => [c.id, c])), [categories]);
    const paymentMethodMap = React.useMemo(() => new Map(paymentMethods.map(p => [p.id, p.name])), [paymentMethods]);
    
    if (transactions.length === 0) {
      return (
        <div className="text-center py-10 text-muted-foreground">
          <ListTree className="mx-auto h-12 w-12 mb-4" />
          <p className="text-lg">
            {totalTransactionsCount > 0 ? translations.noTransactionsForFilters : translations.noTransactions}
          </p>
        </div>
      );
    }

    if (isMobile) {
      return (
        <div className="space-y-0">
          <Card className="shadow-xl border-2 border-primary overflow-hidden">
            <CardContent className="p-0">
              {currentTransactions.map((transaction, index) => {
                const category = categoryMap.get(transaction.categoryId);
                return (
                <React.Fragment key={transaction.id}>
                  <div id={`transaction-${transaction.id}`} className="flex flex-col">
                    <div className="p-4 flex-grow space-y-1">
                      <div className="flex flex-col">
                        <span className="text-sm text-muted-foreground">{formatDate(new Date(transaction.date))}</span>
                        <p className="text-base text-foreground/90 break-words w-full whitespace-pre-wrap">{transaction.description}</p>
                      </div>
                      
                      <Separator />

                      <div className="space-y-1 text-sm text-muted-foreground">
                        <div className="flex items-center">
                          <Tag className="mr-3 h-4 w-4" />
                          <span className="text-base">{category ? translateCategory(category) : 'N/A'}</span>
                        </div>
                        <div className="flex items-center">
                          <CreditCard className="mr-3 h-4 w-4" />
                          <span className="text-base">{paymentMethodMap.get(transaction.paymentMethodId) || transaction.paymentMethodId}</span>
                        </div>
                      </div>
                      <div className="flex items-center justify-end text-lg font-semibold font-mono">
                          <span className={transaction.type === 'income' ? 'text-green-600' : 'text-red-600'}>
                            {transaction.type === 'income' ? '+' : '-'} {formatCurrency(Math.abs(transaction.amount))}
                          </span>
                        </div>
                    </div>
                    
                    <div className="bg-muted/30 border-t flex">
                        <Button variant="ghost" className="flex-1 rounded-none" onClick={() => onEdit(transaction)}>
                          <Edit3 className="mr-2 h-4 w-4" />
                          {translations.edit}
                        </Button>
                        <Separator orientation="vertical" className="h-full" />
                        <Button variant="ghost" className="flex-1 rounded-none text-destructive hover:bg-destructive hover:text-destructive-foreground" onClick={() => onDelete(transaction.id)}>
                          <Trash2 className="mr-2 h-4 w-4" />
                          {translations.delete}
                        </Button>
                    </div>
                  </div>
                  {index < currentTransactions.length - 1 && <Separator />}
                </React.Fragment>
              )})}
            </CardContent>
          </Card>
          
          {totalPages > 1 && (
            <div ref={ref} className="flex items-center justify-end space-x-2 py-4 scroll-mt-24">
              <span className="text-sm text-muted-foreground">
                {translations.page} {currentPage} {translations.of} {totalPages}
              </span>
              <Button
                variant="outline"
                size="sm"
                onClick={onPreviousPage}
                disabled={currentPage === 1}
              >
                <ChevronLeft className="h-4 w-4 mr-1" />
                {translations.previous}
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={onNextPage}
                disabled={currentPage === totalPages}
              >
                {translations.next}
                <ChevronRight className="h-4 w-4 ml-1" />
              </Button>
            </div>
          )}
        </div>
      );
    }

    return (
      <div className="space-y-4">
         <Card className="shadow-xl border-2 border-primary">
          <CardContent className="p-0">
        <Table>
          <TableHeader>
            <TableRow className="bg-muted/50 hover:bg-muted/50">
              <TableHead>{translations.date}</TableHead>
              <TableHead>{translations.description}</TableHead>
              <TableHead>{translations.category}</TableHead>
              <TableHead className="text-center">{translations.type}</TableHead>
              <TableHead className="text-right">{translations.amount}</TableHead>
              <TableHead className="text-center">{translations.actions}</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {currentTransactions.map((transaction) => {
              const category = categoryMap.get(transaction.categoryId);
              return (
              <TableRow key={transaction.id} id={`transaction-${transaction.id}`} className="hover:bg-muted/50 transition-colors">
                <TableCell className="text-base">{format(new Date(transaction.date), "dd/MM/yyyy")}</TableCell>
                <TableCell className="text-base break-words whitespace-pre-wrap">{transaction.description}</TableCell>
                <TableCell>
                  <Badge variant="outline" className="text-base">{category ? translateCategory(category) : 'N/A'}</Badge>
                </TableCell>
                <TableCell className="text-center">
                  {transaction.type === "income" ? (
                    <TrendingUp className="h-5 w-5 text-green-500 inline-block" />
                  ) : (
                    <TrendingDown className="h-5 w-5 text-red-500 inline-block" />
                  )}
                </TableCell>
                <TableCell className={`text-right text-base font-mono ${transaction.type === 'income' ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}>
                  {formatCurrency(transaction.amount)}
                </TableCell>
                <TableCell className="text-center">
                  <div className="flex items-center justify-center">
                    <Button variant="ghost" size="icon" onClick={() => onEdit(transaction)} aria-label={translations.editTransaction} className="text-primary hover:text-accent-foreground">
                      <Edit3 className="h-4 w-4" />
                    </Button>
                    <Button variant="ghost" size="icon" onClick={() => onDelete(transaction.id)} aria-label={translations.deleteTransaction} className="text-destructive hover:bg-destructive hover:text-destructive-foreground">
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            )})}
          </TableBody>
        </Table>
        </CardContent>
        </Card>
        {totalPages > 1 && (
          <div ref={ref} className="flex items-center justify-end space-x-2 py-4 scroll-mt-24">
            <span className="text-sm text-muted-foreground">
              {translations.page} {currentPage} {translations.of} {totalPages}
            </span>
            <Button
              variant="outline"
              size="sm"
              onClick={onPreviousPage}
              disabled={currentPage === 1}
            >
              <ChevronLeft className="h-4 w-4 mr-1" />
              {translations.previous}
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={onNextPage}
              disabled={currentPage === totalPages}
            >
              {translations.next}
              <ChevronRight className="h-4 w-4 ml-1" />
            </Button>
          </div>
        )}
      </div>
    );
  }
);

TransactionList.displayName = "TransactionList";
