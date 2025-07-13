
"use client";

import React, { useState, useEffect, useMemo } from "react";
import { useRouter } from 'next/navigation';
import type { Tax } from "@/types";
import { useAuth } from "@/contexts/AuthContext";
import { useTranslations } from "@/contexts/LanguageContext";
import { getTaxes } from "@/app/actions";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { Plus, Landmark, PlusCircle, DollarSign, CheckCircle } from "lucide-react";
import { cn } from "@/lib/utils";
import { useScrollDirection } from "@/hooks/use-scroll-direction";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";


interface AggregatedTax {
  latestRecord: Tax;
  history: Tax[];
}

export default function TaxesPage() {
  const { user } = useAuth();
  const { translations, translateMonth } = useTranslations();
  const router = useRouter();
  const scrollDirection = useScrollDirection();
  
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

  if (isLoading) {
    return (
      <div className="space-y-4">
        <Card className="shadow-xl border-2 border-primary">
          <CardHeader><Skeleton className="h-8 w-1/4" /></CardHeader>
          <CardContent><Skeleton className="h-48" /></CardContent>
        </Card>
      </div>
    );
  }

  return (
    <TooltipProvider>
      <div className="space-y-8">
        <Card className="shadow-xl border-2 border-primary">
          <CardHeader>
            <CardTitle className="flex items-center">
              <Landmark className="h-5 w-5 mr-2 text-primary" />
              {translations.taxes}
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            {aggregatedTaxes.length === 0 ? (
              <div className="text-center py-10 px-6 text-muted-foreground">
                <Landmark className="mx-auto h-12 w-12 mb-4" />
                <p className="text-lg">{translations.noTaxes}</p>
              </div>
            ) : (
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
                      <TableCell className="font-medium">{latestRecord.name}</TableCell>
                      <TableCell>
                        <div className="flex items-center">
                          <span>{translateMonth(latestRecord.month)}</span>
                          {history.length > 0 && (
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <Button variant="ghost" size="icon" className="h-6 w-6 ml-2">
                                  <PlusCircle className="h-4 w-4 text-primary/70" />
                                </Button>
                              </TooltipTrigger>
                              <TooltipContent>
                                <div className="p-2">
                                  <h4 className="font-semibold text-center mb-2">{translations.history}</h4>
                                   {history.length === 0 ? (
                                    <p className="text-sm text-muted-foreground">{translations.noHistory}</p>
                                  ) : (
                                  <table className="w-full text-center">
                                    <thead>
                                      <tr>
                                        {history.sort((a, b) => a.month - b.month).map((rec) => (
                                          <th key={rec.id} className="px-3 py-1 font-normal text-muted-foreground">{translateMonth(rec.month)}</th>
                                        ))}
                                      </tr>
                                    </thead>
                                    <tbody>
                                      <tr>
                                        {history.sort((a, b) => a.month - b.month).map((rec) => (
                                          <td key={rec.id} className="px-3 py-1 font-semibold">
                                            {rec.isPaid ? (
                                              <span className="text-green-500">{formatCurrency(rec.amount)}</span>
                                            ) : (
                                              <Button variant="ghost" className="h-auto px-2 text-red-500 hover:text-red-600" onClick={() => handlePayClick(rec)}>
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
                              </TooltipContent>
                            </Tooltip>
                          )}
                        </div>
                      </TableCell>
                      <TableCell className="text-right font-semibold">{formatCurrency(latestRecord.amount)}</TableCell>
                       <TableCell className="text-center">
                        {latestRecord.isPaid ? (
                           <Tooltip>
                              <TooltipTrigger>
                                <CheckCircle className="h-6 w-6 text-green-500" />
                              </TooltipTrigger>
                              <TooltipContent>
                                <p>{translations.paid}</p>
                              </TooltipContent>
                            </Tooltip>
                        ) : (
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <Button variant="ghost" size="icon" onClick={() => handlePayClick(latestRecord)}>
                                <DollarSign className="h-6 w-6 text-red-500" />
                              </Button>
                            </TooltipTrigger>
                            <TooltipContent>
                              <p>{translations.payTax}</p>
                            </TooltipContent>
                          </Tooltip>
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      </div>

      <Button
        onClick={() => router.push('/add-tax')}
        className={cn(
          "group fixed bottom-6 right-6 h-16 w-16 rounded-full bg-primary p-0 shadow-lg transition-all duration-300 ease-in-out hover:w-48 hover:bg-primary/90 gap-0 hover:gap-2",
          scrollDirection === "down" ? "scale-0" : "scale-100"
        )}
        aria-label={translations.newTax}
      >
        <Plus className="h-8 w-8 text-primary-foreground transition-transform duration-300 group-hover:rotate-90" strokeWidth={3} />
        <span className="w-0 overflow-hidden whitespace-nowrap text-lg font-semibold text-primary-foreground opacity-0 transition-all duration-300 group-hover:w-auto group-hover:opacity-100">
          {translations.newTax}
        </span>
      </Button>
    </TooltipProvider>
  );
}
