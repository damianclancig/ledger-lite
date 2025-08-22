
"use client";

import React, { useState, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { getPaymentMethods, addPaymentMethod, updatePaymentMethod } from "@/app/actions";
import type { PaymentMethod, PaymentMethodFormValues } from "@/types";
import { useTranslations } from "@/contexts/LanguageContext";
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { PlusCircle, CreditCard, Edit, Banknote, Building } from "lucide-react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { PaymentMethodForm } from "@/components/settings/PaymentMethodForm";
import { useToast } from "@/hooks/use-toast";
import { Skeleton } from "@/components/ui/skeleton";
import { Switch } from "@/components/ui/switch";
import { useIsMobile } from "@/hooks/use-mobile";
import { Separator } from "@/components/ui/separator";

export default function ManagePaymentMethodsPage() {
  const { user } = useAuth();
  const { translations, translatePaymentType } = useTranslations();
  const { toast } = useToast();
  const isMobile = useIsMobile();

  const [paymentMethods, setPaymentMethods] = useState<PaymentMethod[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingMethod, setEditingMethod] = useState<PaymentMethod | null>(null);

  useEffect(() => {
    if (!user) return;
    async function loadData() {
      setIsLoading(true);
      const userMethods = await getPaymentMethods(user.uid);
      setPaymentMethods(userMethods);
      setIsLoading(false);
    }
    loadData();
  }, [user]);

  const handleFormSubmit = async (values: PaymentMethodFormValues) => {
    if (!user) return;

    const result = editingMethod
      ? await updatePaymentMethod(editingMethod.id, values, user.uid)
      : await addPaymentMethod(values, user.uid);

    if (result && 'error' in result) {
        toast({ title: translations.errorTitle, description: result.error, variant: "destructive" });
    } else {
      toast({
        title: editingMethod ? translations.paymentMethodUpdatedSuccess : translations.paymentMethodAddedSuccess,
      });
      const userMethods = await getPaymentMethods(user.uid);
      setPaymentMethods(userMethods);
      handleDialogClose();
    }
  };

  const handleToggleEnabled = async (method: PaymentMethod) => {
    if (!user) return;
    const values: PaymentMethodFormValues = { 
      name: method.name, 
      type: method.type, 
      bank: method.bank,
      isEnabled: !method.isEnabled 
    };
    const result = await updatePaymentMethod(method.id, values, user.uid);

    if (result && 'error' in result) {
      toast({ title: translations.errorTitle, description: result.error, variant: "destructive" });
    } else {
      toast({ title: translations.paymentMethodUpdatedSuccess });
      const userMethods = await getPaymentMethods(user.uid);
      setPaymentMethods(userMethods);
    }
  };

  const handleDialogClose = () => {
    setIsDialogOpen(false);
    setEditingMethod(null);
  };

  const handleOpenDialog = (method: PaymentMethod | null = null) => {
    setEditingMethod(method);
    setIsDialogOpen(true);
  }

  if (isLoading) {
    return <Skeleton className="h-96 w-full" />;
  }

  const renderMobileView = () => (
     <div className="space-y-4">
      {paymentMethods.map((method) => (
        <Card key={method.id} className="shadow-lg border-2 border-primary/20 overflow-hidden">
          <CardContent className="p-4 flex-grow space-y-3">
              <span className="font-semibold text-base break-all pr-4 block">{method.name}</span>
               <div className="space-y-2 text-sm text-muted-foreground">
                <div className="flex items-center">
                  <Banknote className="mr-3 h-4 w-4" />
                  <span className="text-base">{translatePaymentType(method.type)}</span>
                </div>
                {method.bank && (
                  <div className="flex items-center">
                    <Building className="mr-3 h-4 w-4" />
                    <span className="text-base">{method.bank}</span>
                  </div>
                )}
              </div>
              <Separator/>
              <div className="flex items-center justify-between pt-1">
                <Switch
                  checked={method.isEnabled}
                  onCheckedChange={() => handleToggleEnabled(method)}
                  aria-label={`Toggle payment method ${method.name}`}
                />
                 <Button variant="ghost" size="icon" className="h-8 w-8 text-primary" onClick={() => handleOpenDialog(method)}>
                    <Edit className="h-5 w-5" />
                 </Button>
              </div>
          </CardContent>
        </Card>
      ))}
     </div>
  );

  const renderDesktopView = () => (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>{translations.paymentMethodName}</TableHead>
          <TableHead>{translations.paymentMethodType}</TableHead>
          <TableHead>{translations.paymentMethodBank}</TableHead>
          <TableHead className="text-center">{translations.paymentMethodStatus}</TableHead>
          <TableHead className="text-right">{translations.actions}</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {paymentMethods.map((method) => (
          <TableRow key={method.id}>
            <TableCell className="font-medium text-base">{method.name}</TableCell>
            <TableCell className="text-base">{translatePaymentType(method.type)}</TableCell>
            <TableCell className="text-base">{method.bank || "N/A"}</TableCell>
            <TableCell className="text-center">
              <Switch
                checked={method.isEnabled}
                onCheckedChange={() => handleToggleEnabled(method)}
                aria-label={`Toggle payment method ${method.name}`}
              />
            </TableCell>
            <TableCell className="text-right">
              <Button variant="ghost" size="icon" onClick={() => handleOpenDialog(method)}>
                <Edit className="h-4 w-4" />
              </Button>
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );

  return (
    <Card className="shadow-xl border-2 border-primary">
      <CardHeader className="flex flex-col items-start gap-4">
        <div className="flex items-center">
            <CreditCard className="h-6 w-6 mr-3 text-primary" />
            <CardTitle>{translations.managePaymentMethods}</CardTitle>
        </div>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button onClick={() => handleOpenDialog()} className="text-base">
              <PlusCircle className="mr-2 h-4 w-4" /> {translations.newPaymentMethod}
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>{editingMethod ? translations.editPaymentMethod : translations.newPaymentMethod}</DialogTitle>
            </DialogHeader>
            <PaymentMethodForm
              onSubmit={handleFormSubmit}
              onClose={handleDialogClose}
              initialData={editingMethod ?? undefined}
            />
          </DialogContent>
        </Dialog>
      </CardHeader>
      <CardContent>
        {isMobile ? renderMobileView() : renderDesktopView()}
      </CardContent>
    </Card>
  );
}
