"use client";

import React, { useState, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { getInstallmentDetails } from "@/app/actions/transactionActions";
import type { InstallmentDetail, CompletedInstallmentDetail } from "@/types";
import { useTranslations } from "@/contexts/LanguageContext";
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Layers, Wallet, CalendarDays, TrendingDown, Banknote, Building, Hash, CheckCircle, ShoppingBag, Receipt } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { useIsMobile } from "@/hooks/use-mobile";
import { Separator } from "@/components/ui/separator";
import { Progress } from "@/components/ui/progress";
import { formatCurrency } from "@/lib/utils";
import { format } from 'date-fns';
import { es, pt, enUS } from 'date-fns/locale';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";

export default function InstallmentsPage() {
  const { user } = useAuth();
  const { translations, language } = useTranslations();
  const isMobile = useIsMobile();
  
  const [pendingDetails, setPendingDetails] = useState<InstallmentDetail[]>([]);
  const [completedDetails, setCompletedDetails] = useState<CompletedInstallmentDetail[]>([]);
  const [totalPending, setTotalPending] = useState(0);
  const [totalForCurrentMonth, setTotalForCurrentMonth] = useState(0);
  const [isLoading, setIsLoading] = useState(true);

  const locales = {
    en: enUS,
    es: es,
    pt: pt,
  };
  const currentLocale = locales[language] || enUS;

  useEffect(() => {
    async function loadInstallments() {
      if (!user) {
        setIsLoading(false);
        return;
      }
      setIsLoading(true);
      const { pendingDetails, completedDetails, totalPending, totalForCurrentMonth } = await getInstallmentDetails(user.uid);
      setPendingDetails(pendingDetails);
      setCompletedDetails(completedDetails);
      setTotalPending(totalPending);
      setTotalForCurrentMonth(totalForCurrentMonth);
      setIsLoading(false);
    }
    loadInstallments();
  }, [user]);

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

  if (pendingDetails.length === 0 && completedDetails.length === 0 && !isLoading) {
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
  
  const renderPendingDesktopView = () => (
    <div className="space-y-6">
        {pendingDetails.map((item) => (
            <Card key={item.id} className="shadow-lg border-2 border-primary/20 overflow-hidden">
                <CardContent className="grid grid-cols-12 items-center gap-4 py-4">
                   <div className="col-span-12 md:col-span-4">
                        <p className="font-semibold text-base break-all">{item.description}</p>
                        <p className="text-sm text-muted-foreground flex items-center mt-1">
                            <Building className="h-4 w-4 mr-2"/>
                            {item.paymentMethodName}
                        </p>
                   </div>
                    <div className="col-span-12 md:col-span-6">
                        <div className="flex justify-between items-center text-xs text-muted-foreground mb-1">
                            <span className="capitalize">{translations.purchaseDate}: {format(new Date(item.purchaseDate), 'dd/MM/yy')}</span>
                            <span className="capitalize text-right">{translations.endsIn} {format(new Date(item.lastInstallmentDate), 'MMMM yyyy', { locale: currentLocale })}</span>
                        </div>
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

  const renderPendingMobileView = () => (
     <div className="space-y-4">
      {pendingDetails.map((item) => (
        <Card key={item.id} className="shadow-lg border-2 border-primary/20 overflow-hidden">
          <CardContent className="p-4 space-y-3">
              <div>
                <p className="font-semibold text-base break-all">{item.description}</p>
                <p className="text-sm text-muted-foreground flex items-center mt-1">
                    <Building className="h-4 w-4 mr-2"/>
                    {item.paymentMethodName}
                </p>
              </div>
              <div>
                <div className="flex justify-between items-center text-xs text-muted-foreground mb-1">
                    <span className="capitalize">{translations.purchaseDate}: {format(new Date(item.purchaseDate), 'dd/MM/yy')}</span>
                    <span className="capitalize text-right">{translations.endsIn} {format(new Date(item.lastInstallmentDate), 'MMMM yyyy', { locale: currentLocale })}</span>
                </div>
                <Progress value={(item.currentInstallment / item.totalInstallments) * 100} className="h-3"/>
                <div className="flex justify-between items-center mt-1 text-xs text-muted-foreground">
                    <span>{item.currentInstallment} / {item.totalInstallments} {translations.installments.toLowerCase()}</span>
                    <span>{translations.total}: {formatCurrency(item.totalAmount)}</span>
                </div>
              </div>
              <Separator/>
              <div className="flex items-center justify-between">
                 <span className="text-base font-semibold">{translations.pendingAmount}:</span>
                 <span className="text-lg font-bold font-mono text-red-500">{formatCurrency(item.pendingAmount)}</span>
              </div>
          </CardContent>
        </Card>
      ))}
     </div>
  );

  const renderCompletedDesktopView = () => (
    <Card className="shadow-xl border-2 border-primary/20">
      <CardContent className="p-0">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>{translations.description}</TableHead>
              <TableHead>{translations.paymentType}</TableHead>
              <TableHead className="text-center">{translations.installments}</TableHead>
              <TableHead>{translations.purchaseDate}</TableHead>
              <TableHead>{translations.completionDate}</TableHead>
              <TableHead className="text-right">{translations.totalAmount}</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {completedDetails.map((item) => (
              <TableRow key={item.id}>
                <TableCell className="font-medium text-base">{item.description}</TableCell>
                <TableCell className="text-base">{item.paymentMethodName}</TableCell>
                <TableCell className="text-center text-base">{item.totalInstallments}</TableCell>
                <TableCell className="text-base">{format(new Date(item.purchaseDate), 'PP', { locale: currentLocale })}</TableCell>
                <TableCell className="text-base">{format(new Date(item.lastInstallmentDate), 'MMM yyyy', { locale: currentLocale })}</TableCell>
                <TableCell className="text-right font-mono font-semibold text-base">{formatCurrency(item.totalAmount)}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );

  const renderCompletedMobileView = () => (
    <div className="space-y-4">
      {completedDetails.map((item) => (
        <Card key={item.id} className="shadow-lg border-2 border-primary/20 overflow-hidden">
          <CardContent className="p-4 space-y-3">
              <p className="font-semibold text-base break-all">{item.description}</p>
              <Separator />
              <div className="grid grid-cols-2 gap-x-4 gap-y-2 text-base text-muted-foreground">
                  <div className="flex items-center"><Receipt className="h-4 w-4 mr-2" /><span>{item.paymentMethodName}</span></div>
                  <div className="flex items-center"><Hash className="h-4 w-4 mr-2" /><span>{item.totalInstallments} {translations.installments.toLowerCase()}</span></div>
                  <div className="flex items-center"><ShoppingBag className="h-4 w-4 mr-2" /><span>{format(new Date(item.purchaseDate), 'PP', { locale: currentLocale })}</span></div>
                  <div className="flex items-center"><CheckCircle className="h-4 w-4 mr-2" /><span>{format(new Date(item.lastInstallmentDate), 'MMM yyyy', { locale: currentLocale })}</span></div>
              </div>
              <Separator />
              <div className="flex items-center justify-between">
                 <span className="text-base font-semibold">{translations.totalAmount}:</span>
                 <span className="text-lg font-bold font-mono">{formatCurrency(item.totalAmount)}</span>
              </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );

  return (
    <div className="space-y-8">
        <div>
            <div className="flex items-center mb-4">
            <Layers className="h-8 w-8 mr-3 text-primary" />
            <h1 className="text-3xl font-bold">{translations.pendingInstallments}</h1>
            </div>

            {pendingDetails.length > 0 ? (
                <>
                    <div className="flex flex-col sm:flex-row gap-4 mb-6">
                        <SummaryCard title={translations.totalDebt} value={totalPending} icon={Wallet} />
                        <SummaryCard title={translations.totalThisMonth} value={totalForCurrentMonth} icon={CalendarDays} />
                    </div>
                    {isMobile ? renderPendingMobileView() : renderPendingDesktopView()}
                </>
            ) : (
                <Card className="shadow-xl border-2 border-primary/20">
                    <CardContent className="text-center py-10 px-6 text-muted-foreground">
                        <Layers className="mx-auto h-12 w-12 mb-4" />
                        <p className="text-lg">{translations.noPendingInstallments}</p>
                    </CardContent>
                </Card>
            )}
        </div>

       {completedDetails.length > 0 && (
        <div>
          <div className="flex items-center mt-12 mb-4">
            <CheckCircle className="h-8 w-8 mr-3 text-green-600" />
            <h1 className="text-3xl font-bold">{translations.completedInstallments}</h1>
          </div>
          {isMobile ? renderCompletedMobileView() : renderCompletedDesktopView()}
        </div>
      )}
    </div>
  );
}
