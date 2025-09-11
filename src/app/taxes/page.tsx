
"use client";

import React, { useState, useEffect, useMemo } from "react";
import { useRouter } from 'next/navigation';
import type { Tax } from "@/types";
import { useAuth } from "@/contexts/AuthContext";
import { useTranslations } from "@/contexts/LanguageContext";
import { getTaxes } from "@/app/actions";
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { Plus, Landmark, PlusCircle, DollarSign, CheckCircle } from "lucide-react";
import { useIsMobile } from "@/hooks/use-mobile";
import { Separator } from "@/components/ui/separator";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { FloatingActionButton } from "@/components/common/FloatingActionButton";


interface AggregatedTax {
  latestRecord: Tax;
  history: Tax[];
}

export default function TaxesPage() {
  const { user } = useAuth();
  const { translations, translateMonth } = useTranslations();
  const router = useRouter();
  const isMobile = useIsMobile();
  
  const [taxes, setTaxes] = useState<Tax[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function loadTaxes() {
      if (!user) {
        setTaxes([]);
        setIsLoading(false);
        return;
      }
      setIsLoading(true);
      const initialTaxes = await getTaxes(user.uid);
      const parsed = initialTaxes.map((t) => ({
        ...t,
        date: new Date(t.date),
      }));
      setTaxes(parsed);
      setIsLoading(false);
    }
    loadTaxes();
  }, [user]);

  const handlePayClick = (tax: Tax) => {
    const description = `${translations.taxPayment} ${tax.name} - ${translateMonth(tax.month)}`;
    const params = new URLSearchParams({
      taxId: tax.id,
      description: description,
      amount: tax.amount.toString(),
      category: 'Taxes',
      type: 'expense'
    });
    router.push(`/add-transaction?${params.toString()}`);
  }

  const aggregatedTaxes = useMemo((): AggregatedTax[] => {
    const taxGroups = new Map<string, Tax[]>();
  
    const sortedTaxes = [...taxes].sort((a, b) => {
      // Assuming a year is not stored, this will group by name and sort by month
      // If year becomes a factor, sorting logic will need to be updated.
      return b.month - a.month;
    });
  
    sortedTaxes.forEach(tax => {
      const group = taxGroups.get(tax.name);
      if (group) {
        group.push(tax);
      } else {
        taxGroups.set(tax.name, [tax]);
      }
    });
  
    const result: AggregatedTax[] = [];
  
    taxGroups.forEach((group) => {
      // The group is already sorted by month descending. The first one is the latest.
      const latestRecord = group[0];
      const history = group.slice(1); // All records except the most recent one
  
      result.push({
        latestRecord,
        history,
      });
    });
  
    return result.sort((a, b) => a.latestRecord.name.localeCompare(b.latestRecord.name));
  }, [taxes]);
  

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
    }).format(value);
  };

  const historyPopover = (history: Tax[]) => (
    <Popover>
      <PopoverTrigger asChild>
        <Button variant="ghost" size="icon" className="h-6 w-6 ml-2 group">
          <PlusCircle className="h-4 w-4 text-primary/70 group-hover:text-accent-foreground" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-auto max-w-[90vw] p-0">
        <div className="overflow-x-auto p-2">
          <h4 className="font-semibold text-center mb-1 text-base">{translations.history}</h4>
            {history.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-1">{translations.noHistory}</p>
          ) : (
          <table className="w-full text-center">
            <thead>
              <tr>
                {history.sort((a, b) => a.month - b.month).map((rec) => (
                  <th key={rec.id} className="px-1.5 py-1 font-normal text-muted-foreground text-base">{translateMonth(rec.month)}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              <tr>
                {history.sort((a, b) => a.month - b.month).map((rec) => (
                  <td key={rec.id} className="px-1.5 py-1 font-semibold font-mono text-base">
                    {rec.isPaid ? (
                      <span className="text-green-500">{formatCurrency(rec.amount)}</span>
                    ) : (
                      <Button variant="link" className="h-auto p-0 text-red-500 hover:text-red-600 text-base" onClick={() => handlePayClick(rec)}>
                        {formatCurrency(rec.amount)}
                      </Button>
                    )}
                  </td>
                ))}
              </tr>
            </tbody>
          </table>
          )}
        </div>
      </PopoverContent>
    </Popover>
  );

  if (isLoading) {
    return (
      <div className="space-y-4">
        <div className="flex items-center mb-8">
            <Skeleton className="h-8 w-8 mr-3" />
            <Skeleton className="h-8 w-64" />
        </div>
        <Skeleton className="h-96 w-full" />
      </div>
    );
  }
  
  const renderContent = () => {
    if (aggregatedTaxes.length === 0) {
       return (
        <Card className="shadow-xl border-2 border-primary">
          <CardContent>
            <div className="text-center py-10 px-6 text-muted-foreground">
              <Landmark className="mx-auto h-12 w-12 mb-4" />
              <p className="text-lg">{translations.noTaxes}</p>
            </div>
          </CardContent>
        </Card>
       )
    }

    if (isMobile) {
      return (
        <div className="space-y-4">
          {aggregatedTaxes.map(({ latestRecord, history }) => (
            <Card key={latestRecord.id} className="shadow-lg border-2 border-primary/20 overflow-hidden flex flex-col">
              <CardContent className="p-4 flex-grow space-y-3">
                <div className="flex items-center justify-between">
                  <span className="font-medium text-base">{latestRecord.name}</span>
                  <div className="flex items-center">
                    <span className="text-sm text-muted-foreground">{translateMonth(latestRecord.month)}</span>
                    {history.length > 0 && historyPopover(history)}
                  </div>
                </div>
                <Separator />
                <div className="flex items-center justify-end text-xl font-semibold pt-2 font-mono">
                  <span className={latestRecord.isPaid ? 'text-green-600' : 'text-red-600'}>
                    {formatCurrency(latestRecord.amount)}
                  </span>
                </div>
              </CardContent>
              <CardFooter className="p-0 bg-muted/30 border-t flex">
                {latestRecord.isPaid ? (
                  <div className="flex-1 flex items-center justify-center p-3 text-green-600">
                    <CheckCircle className="mr-2 h-6 w-6" />
                    <span className="font-semibold text-base">{translations.paid}</span>
                  </div>
                ) : (
                  <Button variant="ghost" className="flex-1 rounded-none text-base" onClick={() => handlePayClick(latestRecord)}>
                    <DollarSign className="mr-2 h-6 w-6 text-red-500" />
                    {translations.pay}
                  </Button>
                )}
              </CardFooter>
            </Card>
          ))}
        </div>
      );
    }

    return (
      <Card className="shadow-xl border-2 border-primary">
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>{translations.taxName}</TableHead>
                <TableHead>{translations.monthRegistered}</TableHead>
                <TableHead className="text-right">{translations.amountOfMonth}</TableHead>
                <TableHead className="text-center">{translations.pay}</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {aggregatedTaxes.map(({ latestRecord, history }) => (
                <TableRow key={latestRecord.id} className="hover:bg-muted/50 transition-colors">
                  <TableCell className="font-medium text-base">{latestRecord.name}</TableCell>
                  <TableCell className="text-base">
                    <div className="flex items-center">
                      <span>{translateMonth(latestRecord.month)}</span>
                      {history.length > 0 && historyPopover(history)}
                    </div>
                  </TableCell>
                  <TableCell className="text-right text-base font-semibold font-mono">{formatCurrency(latestRecord.amount)}</TableCell>
                    <TableCell className="text-center">
                    {latestRecord.isPaid ? (
                        <Tooltip>
                          <TooltipTrigger>
                            <CheckCircle className="h-7 w-7 text-green-500" />
                          </TooltipTrigger>
                          <TooltipContent>
                            <p className="text-base">{translations.paid}</p>
                          </TooltipContent>
                        </Tooltip>
                    ) : (
                       <Button variant="destructive" size="icon" onClick={() => handlePayClick(latestRecord)} className="h-10 w-10 rounded-full bg-red-600 hover:bg-red-700">
                          <DollarSign className="h-7 w-7" strokeWidth={2.5} />
                        </Button>
                    )}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    );
  }

  return (
    <TooltipProvider>
      <div className="space-y-8">
        <div className="flex items-center">
            <Landmark className="h-8 w-8 mr-3 text-primary" />
            <h1 className="text-3xl font-bold">{translations.taxes}</h1>
        </div>
        {renderContent()}
      </div>

      <FloatingActionButton
        onClick={() => router.push('/add-tax')}
        label={translations.newTax}
        icon={Plus}
      />
    </TooltipProvider>
  );
}
