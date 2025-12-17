
"use client";

import React, { useState, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { getSavingsFunds, deleteSavingsFund } from "@/app/actions/savingsFundActions";
import type { SavingsFund, Category, PaymentMethod } from "@/types";
import { useTranslations } from "@/contexts/LanguageContext";
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { PiggyBank, Calendar, Plus, Edit, Trash2, MoreVertical, ArrowDownLeft, ArrowUpRight, CheckCircle2, XCircle } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { formatCurrency, cn } from "@/lib/utils";
import { format } from "date-fns";
import { FloatingActionButton } from "@/components/common/FloatingActionButton";
import { useRouter } from "next/navigation";
import { DeleteConfirmationDialog } from "@/components/transactions/DeleteConfirmationDialog";
import { CloseFundDialog } from "@/components/savings-funds/CloseFundDialog";
import { useToast } from "@/hooks/use-toast";
import { getCategories } from "@/app/actions/categoryActions";
import { getPaymentMethods } from "@/app/actions/paymentMethodActions";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { TransferDialog } from "@/components/savings-funds/TransferDialog";
import { SavingsFundProgress } from "@/components/savings-funds/SavingsFundProgress";
import { IntroAccordion } from "@/components/common/IntroAccordion";
import { es, pt, enUS } from 'date-fns/locale';

export default function SavingsFundsPage() {
  const { user, dbUser } = useAuth();
  const { translations, language } = useTranslations();
  const router = useRouter();
  const { toast } = useToast();

  const [funds, setFunds] = useState<SavingsFund[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [paymentMethods, setPaymentMethods] = useState<PaymentMethod[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const [fundToProcess, setFundToProcess] = useState<SavingsFund | null>(null);
  const [isCloseFundDialogOpen, setIsCloseFundDialogOpen] = useState(false);
  const [isDeleteEmptyFundDialogOpen, setIsDeleteEmptyFundDialogOpen] = useState(false);

  const [transferDialogOpen, setTransferDialogOpen] = useState(false);
  const [transferDetails, setTransferDetails] = useState<{ fund: SavingsFund, type: 'deposit' | 'withdrawal' } | null>(null);

  const locales = {
    en: enUS,
    es: es,
    pt: pt,
  };
  const currentLocale = locales[language] || enUS;

  useEffect(() => {
    async function loadData() {
      if (!dbUser) {
        setIsLoading(false);
        return;
      }
      setIsLoading(true);
      const [userFunds, userCategories, userPaymentMethods] = await Promise.all([
        getSavingsFunds(),
        getCategories(),
        getPaymentMethods(),
      ]);
      setFunds(userFunds);
      setCategories(userCategories.filter(c => c.isEnabled && c.name === 'Savings'));
      setPaymentMethods(userPaymentMethods.filter(pm => pm.isEnabled));
      setIsLoading(false);
    }
    loadData();
  }, [dbUser]);

  const handleAddNewFund = () => {
    router.push('/savings-funds/add');
  }

  const handleEditFund = (fundId: string) => {
    router.push(`/savings-funds/edit/${fundId}`);
  };

  const handleOpenDeleteDialog = (fund: SavingsFund) => {
    setFundToProcess(fund);
    if (fund.currentAmount > 0) {
      setIsCloseFundDialogOpen(true);
    } else {
      setIsDeleteEmptyFundDialogOpen(true);
    }
  };

  const confirmDeleteEmptyFund = async () => {
    if (fundToProcess && dbUser) {
      const result = await deleteSavingsFund(fundToProcess.id, translations);
      if (result.success) {
        setFunds(funds.filter((f) => f.id !== fundToProcess.id));
        toast({ title: translations.savingsFundDeletedSuccess });
      } else {
        toast({ title: translations.errorTitle, description: result.error, variant: "destructive" });
      }
      setFundToProcess(null);
      setIsDeleteEmptyFundDialogOpen(false);
    }
  };

  const confirmCloseFund = async (paymentMethodId: string) => {
    if (fundToProcess && dbUser) {
      const result = await deleteSavingsFund(fundToProcess.id, translations, paymentMethodId);
      if (result.success) {
        setFunds(funds.filter((f) => f.id !== fundToProcess.id));
        toast({ title: translations.savingsFundDeletedSuccess });
      } else {
        toast({ title: translations.errorTitle, description: result.error, variant: "destructive" });
      }
      setFundToProcess(null);
      setIsCloseFundDialogOpen(false);
    }
  };

  const openTransferDialog = (fund: SavingsFund, type: 'deposit' | 'withdrawal') => {
    setTransferDetails({ fund, type });
    setTransferDialogOpen(true);
  };

  const handleTransferSuccess = async () => {
    if (dbUser) {
      const userFunds = await getSavingsFunds();
      setFunds(userFunds);
    }
  };

  if (isLoading) {
    return (
      <div className="space-y-4">
        <div className="flex items-center mb-8">
          <Skeleton className="h-8 w-8 mr-3" />
          <Skeleton className="h-8 w-64" />
        </div>
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          <Skeleton className="h-64 w-full" />
          <Skeleton className="h-64 w-full" />
          <Skeleton className="h-64 w-full" />
        </div>
      </div>
    );
  }

  return (
    <>
      <div className="space-y-8">
        <div className="flex items-center">
          <PiggyBank className="h-8 w-8 mr-3 text-primary" />
          <h1 className="text-3xl font-bold">{translations.savingsFunds}</h1>
        </div>

        <IntroAccordion
          titleKey="savingsFundsIntroTitle"
          contentKeys={["savingsFundsIntroText1", "savingsFundsIntroText2", "savingsFundsIntroText3"]}
          storageKey="savingsFundsIntroVisible"
        />

        {funds.length === 0 ? (
          <Card className="shadow-xl border-2 border-primary text-center">
            <CardContent className="py-10 px-6">
              <PiggyBank className="mx-auto h-12 w-12 mb-4 text-muted-foreground" />
              <p className="text-lg text-muted-foreground">{translations.noSavingsFunds}</p>
            </CardContent>
          </Card>
        ) : (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {funds.map(fund => {
              const isCompleted = fund.targetAmount > 0 && fund.currentAmount >= fund.targetAmount;

              return (
                <Card key={fund.id} className="shadow-xl border-2 border-primary/20 flex flex-col">
                  <CardHeader>
                    <div className="flex justify-between items-start">
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <CardTitle className="break-words">{fund.name}</CardTitle>
                          {isCompleted && <CheckCircle2 className="h-6 w-6 text-green-600 flex-shrink-0" />}
                        </div>
                        <p className="text-sm text-muted-foreground pt-1 break-words">{fund.description}</p>
                      </div>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon" className="h-8 w-8 -mt-2 -mr-2 flex-shrink-0">
                            <MoreVertical className="h-5 w-5" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={() => handleEditFund(fund.id)}>
                            <Edit className="mr-2 h-4 w-4" />
                            <span>{translations.edit}</span>
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => handleOpenDeleteDialog(fund)} className="text-destructive focus:bg-destructive/10">
                            <Trash2 className="mr-2 h-4 w-4" />
                            <span>{translations.delete}</span>
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                  </CardHeader>
                  <CardContent className="p-4 flex flex-col flex-grow">
                    <div className="mt-auto space-y-4">
                      {fund.targetAmount > 0 ? (
                        <SavingsFundProgress fund={fund} />
                      ) : (
                        <div>
                          <p className="text-sm font-medium text-muted-foreground">{translations.currentAmount}</p>
                          <p className="text-2xl font-bold font-mono">{formatCurrency(fund.currentAmount)}</p>
                        </div>
                      )}

                      <div className="flex items-center text-sm text-muted-foreground">
                        <Calendar className="h-4 w-4 mr-2" />
                        <span>{fund.targetDate ? format(new Date(fund.targetDate), "PP", { locale: currentLocale }) : translations.noTargetDate}</span>
                      </div>
                    </div>
                  </CardContent>
                  <CardFooter className="p-2 bg-muted/30 border-t grid grid-cols-2 gap-2">
                    {isCompleted ? (
                      <Button variant="default" size="sm" className="col-span-2 flex-1 bg-green-600 text-green-100 hover:bg-green-700" onClick={() => handleOpenDeleteDialog(fund)}>
                        <XCircle className="h-4 w-4 mr-2" /> {translations.closeFund}
                      </Button>
                    ) : (
                      <>
                        <Button variant="ghost" size="sm" className="flex-1 text-green-600 hover:bg-green-100 hover:text-green-700" onClick={() => openTransferDialog(fund, 'deposit')} disabled={isCompleted}>
                          <ArrowDownLeft className="h-4 w-4 mr-2" /> {translations.deposit}
                        </Button>
                        <Button variant="ghost" size="sm" className="flex-1 text-red-600 hover:bg-red-100 hover:text-red-700" onClick={() => openTransferDialog(fund, 'withdrawal')}>
                          <ArrowUpRight className="h-4 w-4 mr-2" /> {translations.withdraw}
                        </Button>
                      </>
                    )}
                  </CardFooter>
                </Card>
              );
            })}
          </div>
        )}

        <FloatingActionButton
          onClick={handleAddNewFund}
          label={translations.newSavingsFund}
          icon={Plus}
        />
      </div>

      <DeleteConfirmationDialog
        isOpen={isDeleteEmptyFundDialogOpen}
        onClose={() => setIsDeleteEmptyFundDialogOpen(false)}
        onConfirm={confirmDeleteEmptyFund}
        title={translations.deleteSavingsFund}
        description={translations.areYouSureDeleteSavingsFund}
        confirmButtonText={translations.delete}
        confirmButtonVariant='destructive'
      />

      {fundToProcess && paymentMethods.length > 0 && (
        <CloseFundDialog
          isOpen={isCloseFundDialogOpen}
          onClose={() => setIsCloseFundDialogOpen(false)}
          fund={fundToProcess}
          paymentMethods={paymentMethods}
          onConfirm={confirmCloseFund}
        />
      )}

      {transferDetails && (
        <TransferDialog
          isOpen={transferDialogOpen}
          onOpenChange={setTransferDialogOpen}
          fund={transferDetails.fund}
          type={transferDetails.type}
          categories={categories}
          paymentMethods={paymentMethods}
          onSuccess={handleTransferSuccess}
        />
      )}
    </>
  );
}
