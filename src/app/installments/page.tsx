
"use client";

import React, { useState, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { getInstallmentDetails } from "@/app/actions";
import type { InstallmentDetail } from "@/types";
import { useTranslations } from "@/contexts/LanguageContext";
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Layers, Wallet, CalendarDays, TrendingDown, Banknote, Building, Hash } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { useIsMobile } from "@/hooks/use-mobile";
import { Separator } from "@/components/ui/separator";
import { Progress } from "@/components/ui/progress";

export default function InstallmentsPage() {
  const { user } = useAuth();
  const { translations } = useTranslations();
  const isMobile = useIsMobile();
  
  const [details, setDetails] = useState<InstallmentDetail[]>([]);
  const [totalPending, setTotalPending] = useState(0);
  const [totalForCurrentMonth, setTotalForCurrentMonth] = useState(0);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function loadInstallments() {
      if (!user) {
        setIsLoading(false);
        return;
      }
      setIsLoading(true);
      const { details, totalPending, totalForCurrentMonth } = await getInstallmentDetails(user.uid);
      setDetails(details);
      setTotalPending(totalPending);
      setTotalForCurrentMonth(totalForCurrentMonth);
      setIsLoading(false);
    }
    loadInstallments();
  }, [user]);

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
    }).format(value);
  };
  
  const SummaryCard = ({ title, value, icon: Icon }: { title: string; value: number; icon: React.ElementType }) => (
    <Card className="shadow-lg border-2 border-primary/20 flex-1">
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-base font-medium">{title}</CardTitle>
        <Icon className="h-5 w-5 text-muted-foreground" />
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold font-mono">{formatCurrency(value)}</div>
      </CardContent>
    </Card>
  );

  if (isLoading) {
    return (
      <div className="space-y-4">
         <div className="flex items-center mb-8">
            <Skeleton className="h-8 w-8 mr-3" />
            <Skeleton className="h-8 w-64" />
        </div>
        <div className="flex flex-col sm:flex-row gap-4 mb-8">
            <Skeleton className="h-24 w-full sm:w-1/2" />
            <Skeleton className="h-24 w-full sm:w-1/2" />
        </div>
        <Skeleton className="h-96 w-full" />
      </div>
    );
  }

  if (details.length === 0 && !isLoading) {
     return (
        <div className="space-y-8">
            <div className="flex items-center">
              <Layers className="h-8 w-8 mr-3 text-primary" />
              <h1 className="text-3xl font-bold">{translations.pendingInstallments}</h1>
            </div>
            <Card className="shadow-xl border-2 border-primary">
            <CardContent>
                <div className="text-center py-10 px-6 text-muted-foreground">
                <Layers className="mx-auto h-12 w-12 mb-4" />
                <p className="text-lg">{translations.noInstallments}</p>
                </div>
            </CardContent>
            </Card>
        </div>
       )
  }
  
  const renderDesktopView = () => (
    <div className="space-y-6">
        {details.map((item) => (
            <Card key={item.id} className="shadow-lg border-2 border-primary/20 overflow-hidden">
                <CardContent className="grid grid-cols-12 items-center gap-4">
                   <div className="col-span-12 md:col-span-4">
                        <p className="font-semibold text-base break-all">{item.description}</p>
                        <p className="text-sm text-muted-foreground flex items-center mt-1">
                            <Building className="h-4 w-4 mr-2"/>
                            {item.paymentMethodName}
                        </p>
                   </div>
                    <div className="col-span-12 md:col-span-6">
                        <Progress value={(item.currentInstallment / item.totalInstallments) * 100} className="h-4"/>
                        <div className="flex justify-between items-center mt-1 text-sm text-muted-foreground">
                            <span>{item.currentInstallment} / {item.totalInstallments}</span>
                            <span>{translations.total}: {formatCurrency(item.totalAmount)}</span>
                        </div>
                    </div>
                   <div className="col-span-12 md:col-span-2 text-right">
                     <p className="text-sm text-muted-foreground">{translations.pendingAmount}</p>
                     <p className="font-bold text-lg font-mono text-red-500">{formatCurrency(item.pendingAmount)}</p>
                   </div>
                </CardContent>
            </Card>
        ))}
    </div>
  );

  const renderMobileView = () => (
     <div className="space-y-4">
      {details.map((item) => (
        <Card key={item.id} className="shadow-lg border-2 border-primary/20 overflow-hidden">
          <CardContent className="space-y-3">
              <p className="font-semibold text-base break-all pr-4 block">{item.description}</p>
              <Separator />
               <div className="space-y-2 text-sm text-muted-foreground">
                <div className="flex items-center">
                  <Building className="mr-3 h-4 w-4 flex-shrink-0" />
                  <span className="text-base">{item.paymentMethodName}</span>
                </div>
                <div className="flex items-center">
                  <Banknote className="mr-3 h-4 w-4" />
                  <span className="text-base">{formatCurrency(item.installmentAmount)} (x{item.totalInstallments})</span>
                </div>
                <div className="flex items-center">
                  <Hash className="mr-3 h-4 w-4" />
                  <span className="text-base">{item.currentInstallment} / {item.totalInstallments} {translations.installments.toLowerCase()}</span>
                </div>
              </div>
              <Separator/>
              <div className="flex items-center justify-between pt-1">
                 <span className="text-base font-semibold">{translations.pendingAmount}:</span>
                 <span className="text-lg font-bold font-mono text-red-500">{formatCurrency(item.pendingAmount)}</span>
              </div>
          </CardContent>
        </Card>
      ))}
     </div>
  );

  return (
    <div className="space-y-8">
        <div className="flex items-center">
          <Layers className="h-8 w-8 mr-3 text-primary" />
          <h1 className="text-3xl font-bold">{translations.pendingInstallments}</h1>
        </div>

        <div className="flex flex-col sm:flex-row gap-4">
            <SummaryCard title={translations.totalDebt} value={totalPending} icon={Wallet} />
            <SummaryCard title={translations.totalThisMonth} value={totalForCurrentMonth} icon={CalendarDays} />
        </div>
        
        {isMobile ? renderMobileView() : renderDesktopView()}
    </div>
  );
}
