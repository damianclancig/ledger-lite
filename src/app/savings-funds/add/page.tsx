"use client";

import { useRouter } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";
import { addSavingsFund } from "@/app/actions/savingsFundActions";
import { SavingsFundForm, type SavingsFundFormSubmitValues } from "@/components/savings-funds/SavingsFundForm";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useTranslations } from "@/contexts/LanguageContext";
import { ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import React, { useEffect } from "react";

export default function AddSavingsFundPage() {
  const router = useRouter();
  const { user } = useAuth();
  const { toast } = useToast();
  const { translations } = useTranslations();

  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  const handleFormSubmit = async (values: SavingsFundFormSubmitValues) => {
    if (!user) {
      toast({ title: translations.errorTitle, description: "You must be logged in to perform this action.", variant: "destructive" });
      return;
    }

    const result = await addSavingsFund(values, user.uid);

    if (result && 'error' in result) {
      toast({ title: translations.errorTitle, description: result.error, variant: "destructive" });
    } else {
      toast({ title: translations.savingsFundAddedSuccess });
      router.push("/savings-funds");
    }
  };

  return (
    <div className="max-w-2xl mx-auto">
       <div className="flex justify-end mb-4">
        <Button asChild variant="ghost" className="text-base">
            <Link href="/savings-funds">
            <ArrowLeft className="mr-2 h-4 w-4" />
            {translations.back}
            </Link>
        </Button>
      </div>
      <Card className="shadow-xl border-2 border-primary">
        <CardHeader>
          <CardTitle>{translations.newSavingsFund}</CardTitle>
        </CardHeader>
        <CardContent>
          <SavingsFundForm
            onSubmit={handleFormSubmit}
            onClose={() => router.push("/savings-funds")}
          />
        </CardContent>
      </Card>
    </div>
  );
}
