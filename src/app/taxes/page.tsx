
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
import { Plus, Landmark } from "lucide-react";
import { cn } from "@/lib/utils";
import { useScrollDirection } from "@/hooks/use-scroll-direction";

interface AggregatedTax {
  name: string;
  monthRegistered: number;
  amountOfMonth: number;
  lastRecordDate: Date;
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

  const aggregatedTaxes = useMemo((): AggregatedTax[] => {
    const taxMap = new Map<string, AggregatedTax>();

    // Sort by month index descending to get the latest month first
    const sortedTaxes = [...taxes].sort((a, b) => {
        if (b.month !== a.month) {
            return b.month - a.month;
        }
        // If months are the same, sort by creation date as a fallback
        return b.date.getTime() - a.date.getTime();
    });

    sortedTaxes.forEach(tax => {
      // If we haven't seen this tax name yet, it's the most recent one.
      if (!taxMap.has(tax.name)) {
        taxMap.set(tax.name, {
          name: tax.name,
          monthRegistered: tax.month,
          amountOfMonth: tax.amount,
          lastRecordDate: tax.date,
        });
      }
    });

    return Array.from(taxMap.values());
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
    <>
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
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {aggregatedTaxes.map((tax) => (
                    <TableRow key={tax.name} className="hover:bg-muted/50 transition-colors">
                      <TableCell className="font-medium">{tax.name}</TableCell>
                      <TableCell>{translateMonth(tax.monthRegistered)}</TableCell>
                      <TableCell className="text-right font-semibold text-primary">{formatCurrency(tax.amountOfMonth)}</TableCell>
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
    </>
  );
}
