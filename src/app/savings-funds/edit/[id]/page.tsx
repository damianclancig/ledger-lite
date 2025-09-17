"use client";

import { useRouter, useParams } from "next/navigation";
import React, { useEffect, useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";
import { getSavingsFundById, updateSavingsFund } from "@/app/actions/savingsFundActions";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useTranslations } from "@/contexts/LanguageContext";
import { ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { Skeleton } from "@/components/ui/skeleton";
import type { SavingsFund } from "@/types";
import { SavingsFundForm, type SavingsFundFormSubmitValues } from "@/components/savings-funds/SavingsFundForm";

export default function EditSavingsFundPage() {
  const router = useRouter();
  const params = useParams();
  const { user } = useAuth();
  const { toast } = useToast();
  const { translations } = useTranslations();
  
  const [fund, setFund] = useState<SavingsFund | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const id = params.id as string;

  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  useEffect(() => {
    if (!id || !user) return;

    async function fetchData() {
      setIsLoading(true);
      try {
        const fetchedFund = await getSavingsFundById(id, user.uid);
        
        if (fetchedFund) {
          setFund(fetchedFund);
        } else {
          toast({ title: translations.errorTitle, description: "Savings fund not found.", variant: "destructive" });
          router.push("/savings-funds");
        }
      } catch (error) {
         toast({ title: translations.errorTitle, description: "Failed to load savings fund data.", variant: "destructive" });
         router.push("/savings-funds");
      } finally {
        setIsLoading(false);
      }
    }
    fetchData();
  }, [id, user, router, toast, translations]);

  const handleFormSubmit = async (values: SavingsFundFormSubmitValues) => {
    if (!user || !fund) return;

    const result = await updateSavingsFund(fund.id, values, user.uid);

    if (result && 'error' in result) {
      toast({ title: translations.errorTitle, description: result.error, variant: "destructive" });
    } else {
      toast({ title: translations.savingsFundUpdatedSuccess });
      router.push("/savings-funds");
    }
  };
  
  if (isLoading || !fund) {
    return (
       <div className="max-w-2xl mx-auto">
        <div className="flex justify-end mb-4">
            <Skeleton className="h-10 w-24" />
        </div>
        <Card>
          <CardHeader>
             <Skeleton className="h-8 w-48" />
          </CardHeader>
          <CardContent>
             <div className="space-y-6">
                <Skeleton className="h-10 w-full" />
                <Skeleton className="h-20 w-full" />
                <Skeleton className="h-10 w-full" />
                <Skeleton className="h-10 w-full" />
             </div>
          </CardContent>
        </Card>
      </div>
    )
  }

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
          <CardTitle>{translations.editSavingsFund}</CardTitle>
        </CardHeader>
        <CardContent>
          <SavingsFundForm
            onSubmit={handleFormSubmit}
            onClose={() => router.push("/savings-funds")}
            initialData={fund}
          />
        </CardContent>
      </Card>
    </div>
  );
}
