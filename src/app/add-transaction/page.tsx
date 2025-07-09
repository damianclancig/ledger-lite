"use client";

import { useRouter } from "next/navigation";
import { TransactionForm, type TransactionFormValues } from "@/components/transactions/TransactionForm";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";
import { addTransaction } from "@/app/actions";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useTranslations } from "@/contexts/LanguageContext";
import { ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import Link from "next/link";

export default function AddTransactionPage() {
  const router = useRouter();
  const { user } = useAuth();
  const { toast } = useToast();
  const { translations } = useTranslations();

  const handleFormSubmit = async (values: TransactionFormValues) => {
    if (!user) {
      toast({ title: "Authentication Error", description: "You must be logged in to perform this action.", variant: "destructive" });
      return;
    }

    const result = await addTransaction(values, user.uid);

    if (result && 'error' in result) {
      toast({ title: "Error", description: result.error, variant: "destructive" });
    } else {
      toast({ title: "Transaction added", description: "New transaction successfully recorded." });
      router.push("/");
    }
  };

  return (
    <div className="max-w-2xl mx-auto">
      <Button asChild variant="ghost" className="mb-4">
        <Link href="/">
          <ArrowLeft className="mr-2 h-4 w-4" />
          {translations.back}
        </Link>
      </Button>
      <Card className="shadow-xl border-2 border-primary">
        <CardHeader>
          <CardTitle>{translations.addTransaction}</CardTitle>
        </CardHeader>
        <CardContent>
          <TransactionForm
            onSubmit={handleFormSubmit}
            onClose={() => router.push("/")}
          />
        </CardContent>
      </Card>
    </div>
  );
}
