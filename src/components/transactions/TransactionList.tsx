
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
import { Edit3, Trash2, TrendingUp, TrendingDown, ChevronLeft, ChevronRight, ListTree } from "lucide-react";
import type { Transaction } from "@/types";
import { useTranslations } from "@/contexts/LanguageContext";
import { format } from "date-fns";
import { es, pt, enUS } from 'date-fns/locale';
import { Card, CardContent } from "@/components/ui/card";

interface TransactionListProps {
  transactions: Transaction[];
  onEdit: (transaction: Transaction) => void;
  onDelete: (id: string) => void;
  itemsPerPage?: number;
}

export function TransactionList({
  transactions,
  onEdit,
  onDelete,
  itemsPerPage = 10,
}: TransactionListProps) {
  const { translations, language, translateCategory } = useTranslations();
  const [currentPage, setCurrentPage] = React.useState(1);

  const totalPages = Math.max(1, Math.ceil(transactions.length / itemsPerPage));
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const currentTransactions = transactions.slice(startIndex, endIndex);
  
  const locales = {
    en: enUS,
    es: es,
    pt: pt,
  };

  const formatDate = (date: Date) => {
    try {
      return format(date, "dd/MM/yyyy", { locale: locales[language] || enUS });
    } catch (e) {
      return format(new Date(), "dd/MM/yyyy"); // Fallback to default locale if specific one fails
    }
  };
  
  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
    }).format(value);
  };


  const handlePreviousPage = () => {
    setCurrentPage((prev) => Math.max(1, prev - 1));
  };

  const handleNextPage = () => {
    setCurrentPage((prev) => Math.min(totalPages, prev + 1));
  };
  
  if (transactions.length === 0) {
    return (
      <div className="text-center py-10 text-muted-foreground">
        <ListTree className="mx-auto h-12 w-12 mb-4" />
        <p className="text-lg">{translations.noTransactions}</p>
      </div>
    );
  }


  return (
    <div className="space-y-4">
       <Card className="shadow-xl border-2 border-primary">
        <CardContent className="p-0">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>{translations.date}</TableHead>
            <TableHead>{translations.description}</TableHead>
            <TableHead>{translations.category}</TableHead>
            <TableHead className="text-center">{translations.type}</TableHead>
            <TableHead className="text-right">{translations.amount}</TableHead>
            <TableHead className="text-center">{translations.actions}</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {currentTransactions.map((transaction) => (
            <TableRow key={transaction.id} className="hover:bg-muted/50 transition-colors">
              <TableCell>{formatDate(new Date(transaction.date))}</TableCell>
              <TableCell className="font-medium max-w-xs truncate">{transaction.description}</TableCell>
              <TableCell>
                <Badge variant="outline">{translateCategory(transaction.category)}</Badge>
              </TableCell>
              <TableCell className="text-center">
                {transaction.type === "income" ? (
                  <TrendingUp className="h-5 w-5 text-green-500 inline-block" />
                ) : (
                  <TrendingDown className="h-5 w-5 text-red-500 inline-block" />
                )}
              </TableCell>
              <TableCell className={`text-right font-semibold ${transaction.type === 'income' ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}>
                {formatCurrency(transaction.amount)}
              </TableCell>
              <TableCell className="text-center">
                <Button variant="ghost" size="icon" onClick={() => onEdit(transaction)} aria-label={translations.editTransaction}>
                  <Edit3 className="h-4 w-4 text-blue-500" />
                </Button>
                <Button variant="ghost" size="icon" onClick={() => onDelete(transaction.id)} aria-label={translations.deleteTransaction}>
                  <Trash2 className="h-4 w-4 text-destructive" />
                </Button>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
      </CardContent>
      </Card>
      {totalPages > 1 && (
        <div className="flex items-center justify-end space-x-2 py-4">
          <span className="text-sm text-muted-foreground">
            {translations.page} {currentPage} {translations.of} {totalPages}
          </span>
          <Button
            variant="outline"
            size="sm"
            onClick={handlePreviousPage}
            disabled={currentPage === 1}
          >
            <ChevronLeft className="h-4 w-4 mr-1" />
            {translations.previous}
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={handleNextPage}
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
