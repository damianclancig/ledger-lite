"use client";

import React from "react";
import { useTranslations } from "@/contexts/LanguageContext";
import { Settings, List, CreditCard } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";


export default function SettingsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { translations } = useTranslations();
  const pathname = usePathname();

  return (
    <div className="space-y-8">
      <div className="flex items-center">
        <Settings className="h-8 w-8 mr-3 text-primary" />
        <h1 className="text-3xl font-bold">{translations.options}</h1>
      </div>
      
      <Tabs value={pathname} className="w-full">
        <TabsList className="grid w-full grid-cols-2 h-auto">
          <TabsTrigger value="/settings/categories" asChild className="text-base">
            <Link href="/settings/categories" className="flex items-center justify-center gap-2 py-2">
              <List className="h-5 w-5"/>
              <span className="truncate">{translations.manageCategories}</span>
            </Link>
          </TabsTrigger>
          <TabsTrigger value="/settings/payment-methods" asChild className="text-base">
            <Link href="/settings/payment-methods" className="flex items-center justify-center gap-2 py-2">
              <CreditCard className="h-5 w-5"/>
              <span className="truncate">{translations.managePaymentMethods}</span>
            </Link>
          </TabsTrigger>
        </TabsList>
      </Tabs>

      <div>
        {children}
      </div>
    </div>
  );
}