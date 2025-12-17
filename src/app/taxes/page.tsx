
"use client";

import React, { useState, useEffect, useMemo } from "react";
import { useRouter } from 'next/navigation';
import type { Tax } from "@/types";
import { useAuth } from "@/contexts/AuthContext";
import { useTranslations } from "@/contexts/LanguageContext";
import { getTaxes } from "@/app/actions/taxActions";
import { isErrorResponse } from "@/lib/error-types";
import { Card, CardContent, CardHeader, CardTitle, CardFooter, CardDescription } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { Landmark, CalendarPlus, DollarSign, CheckCircle, Edit, Plus, PlusCircle } from "lucide-react";
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
import { formatCurrency } from "@/lib/utils";
import { IntroAccordion } from "@/components/common/IntroAccordion";


interface AggregatedTax {
  latestRecord: Tax;
  history: Tax[];
}

export default function TaxesPage() {
  const { user, dbUser } = useAuth();
  const { translations, translateMonth } = useTranslations();
  const router = useRouter();
  const isMobile = useIsMobile();

  const [taxes, setTaxes] = useState<Tax[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function loadTaxes() {
      if (!dbUser) {
        setTaxes([]);
        setIsLoading(false);
        return;
      }
      setIsLoading(true);
      const result = await getTaxes(dbUser.id);
      if (isErrorResponse(result)) {
        console.error('Error loading taxes:', result.error);
        setTaxes([]);
      } else {
        setTaxes(result);
      }
      setIsLoading(false);
    }
    loadTaxes();
  }, [dbUser]);

  const handlePayClick = (tax: Tax) => {
    const description = `${translations.taxPayment} ${tax.name}\n${translateMonth(tax.month)} ${tax.year}`;
    const params = new URLSearchParams({
      taxId: tax.id,
      description: description,
      amount: tax.amount.toString(),
      category: 'Taxes',
      type: 'expense'
    });
    router.push(`/add-transaction?${params.toString()}`);
  }

  const handleEditClick = (taxId: string) => {
    router.push(`/edit-tax/${taxId}`);
  };

  const handleAddNewPeriodClick = (tax: Tax) => {
    let nextMonth = tax.month + 1;
    let nextYear = tax.year;
    if (nextMonth > 11) {
      nextMonth = 0;
      nextYear++;
    }

    const params = new URLSearchParams({
      name: tax.name,
      month: String(nextMonth),
      year: String(nextYear),
    });
    router.push(`/add-tax?${params.toString()}`);
  }

  const aggregatedTaxes = useMemo((): AggregatedTax[] => {
    const taxGroups = new Map<string, Tax[]>();

    // Sort by year, then month, both descending.
    const sortedTaxes = [...taxes].sort((a, b) => {
      if (a.year !== b.year) {
        return b.year - a.year;
      }
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
      // The group is already sorted by date descending. The first one is the latest.
      const latestRecord = group[0];
      const history = group.slice(1); // All records except the most recent one

      result.push({
        latestRecord,
        history,
      });
    });

    return result.sort((a, b) => a.latestRecord.name.localeCompare(b.latestRecord.name));
  }, [taxes]);


  const historyPopover = (history: Tax[]) => (
    <Popover>
      <Tooltip>
        <TooltipTrigger asChild>
          <PopoverTrigger asChild>
            <Button variant="ghost" size="icon" className="h-6 w-6 ml-2 group">
              <PlusCircle className="h-4 w-4 text-primary/70 group-hover:text-accent-foreground" />
            </Button>
          </PopoverTrigger>
        </TooltipTrigger>
        <TooltipContent>
          <p className="text-base">{translations.history}</p>
        </TooltipContent>
      </Tooltip>
      <PopoverContent className="w-auto max-w-[90vw] p-0">
        <div className="overflow-x-auto p-2">
          <h4 className="font-semibold text-center mb-1 text-base">{translations.history}</h4>
          {history.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-1">{translations.noHistory}</p>
          ) : (
            <table className="w-full text-center">
              <thead>
                <tr>
                  {history.map((rec) => (
                    <th key={rec.id} className="px-1.5 py-1 font-normal text-muted-foreground text-base">{`${translateMonth(rec.month)} ${rec.year}`}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                <tr>
                  {history.map((rec) => (
                    <td key={rec.id} className="px-1.5 py-1 font-semibold font-mono text-base">
                      <div className="flex items-center justify-center gap-1">
                        {rec.isPaid ? (
                          <span className="text-green-500">{formatCurrency(rec.amount)}</span>
                        ) : (
                          <Button variant="link" className="h-auto p-0 text-red-500 hover:text-red-600 text-base" onClick={() => handlePayClick(rec)}>
                            {formatCurrency(rec.amount)}
                          </Button>
                        )}
                        {!rec.isPaid && (
                          <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => handleEditClick(rec.id)}>
                            <Edit className="h-3 w-3" />
                          </Button>
                        )}
                      </div>
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
                  <div className="flex items-center">
                    <span className="font-medium text-base">{latestRecord.name}</span>
                    {history.length > 0 && historyPopover(history)}
                  </div>
                  <div className="flex items-center">
                    <span className="text-sm text-muted-foreground">{`${translateMonth(latestRecord.month)} ${latestRecord.year}`}</span>
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
                  <>
                    <div className="flex-1 flex items-center justify-center p-3 text-green-600">
                      <CheckCircle className="mr-2 h-6 w-6" />
                      <span className="font-semibold text-base">{translations.paid}</span>
                    </div>
                    <Separator orientation="vertical" className="h-full" />
                    <Button variant="ghost" className="flex-shrink-0 rounded-none px-4" onClick={() => handleAddNewPeriodClick(latestRecord)}>
                      <CalendarPlus className="h-5 w-5" />
                    </Button>
                  </>
                ) : (
                  <>
                    <Button variant="ghost" className="flex-grow justify-center rounded-none text-base" onClick={() => handlePayClick(latestRecord)}>
                      <DollarSign className="mr-2 h-6 w-6 text-red-500" />
                      {translations.pay}
                    </Button>
                    <Separator orientation="vertical" className="h-full" />
                    <Button variant="ghost" className="flex-shrink-0 rounded-none px-4" onClick={() => handleAddNewPeriodClick(latestRecord)}>
                      <CalendarPlus className="h-5 w-5" />
                    </Button>
                    <Separator orientation="vertical" className="h-full" />
                    <Button variant="ghost" className="flex-shrink-0 rounded-none px-4" onClick={() => handleEditClick(latestRecord.id)}>
                      <Edit className="h-5 w-5" />
                    </Button>
                  </>
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
                <TableHead className="text-right">{translations.actions}</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {aggregatedTaxes.map(({ latestRecord, history }) => (
                <TableRow key={latestRecord.id} className="hover:bg-muted/50 transition-colors">
                  <TableCell className="font-medium text-base">{latestRecord.name}</TableCell>
                  <TableCell className="text-base">
                    <div className="flex items-center">
                      <span>{`${translateMonth(latestRecord.month)} ${latestRecord.year}`}</span>
                      {history.length > 0 && historyPopover(history)}
                    </div>
                  </TableCell>
                  <TableCell className="text-right text-base font-semibold font-mono">{formatCurrency(latestRecord.amount)}</TableCell>
                  <TableCell>
                    <div className="flex items-center justify-end gap-2 text-right">
                      <div className="w-10 h-10 flex items-center justify-center">
                        {latestRecord.isPaid ? (
                          <Tooltip>
                            <TooltipTrigger>
                              <CheckCircle className="h-8 w-8 text-green-500" />
                            </TooltipTrigger>
                            <TooltipContent>
                              <p className="text-base">{translations.paid}</p>
                            </TooltipContent>
                          </Tooltip>
                        ) : (
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <Button variant="destructive" size="icon" onClick={() => handlePayClick(latestRecord)} className="h-10 w-10 rounded-full bg-red-600 hover:bg-red-700">
                                <DollarSign className="h-8 w-8" strokeWidth={2.5} />
                              </Button>
                            </TooltipTrigger>
                            <TooltipContent>
                              <p className="text-base">{translations.pay}</p>
                            </TooltipContent>
                          </Tooltip>
                        )}
                      </div>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Button variant="ghost" size="icon" onClick={() => handleAddNewPeriodClick(latestRecord)} className="h-10 w-10">
                            <CalendarPlus className="h-8 w-8" />
                          </Button>
                        </TooltipTrigger>
                        <TooltipContent>
                          <p className="text-base">{translations.newTax}</p>
                        </TooltipContent>
                      </Tooltip>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Button variant="ghost" size="icon" onClick={() => handleEditClick(latestRecord.id)} className="h-10 w-10" disabled={latestRecord.isPaid}>
                            {!latestRecord.isPaid && <Edit className="h-8 w-8" />}
                          </Button>
                        </TooltipTrigger>
                        <TooltipContent>
                          <p className="text-base">{translations.edit}</p>
                        </TooltipContent>
                      </Tooltip>
                    </div>
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

        <IntroAccordion
          titleKey="taxesIntroTitle"
          contentKeys={["taxesIntroText1", "taxesIntroText2", "taxesIntroText3"]}
          storageKey="taxesIntroVisible"
        />

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
