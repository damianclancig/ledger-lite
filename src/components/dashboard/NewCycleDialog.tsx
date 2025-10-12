
"use client";

import React, { useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";
import { useTranslations } from "@/contexts/LanguageContext";
import { startNewCycle } from "@/app/actions/billingCycleActions";
import type { BillingCycle } from "@/types";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { Rocket, Calendar as CalendarIcon } from "lucide-react";
import { cn } from "@/lib/utils";
import { subDays, startOfDay, format } from "date-fns";
import { es, pt, enUS } from "date-fns/locale";

interface NewCycleDialogProps {
    selectedCycle: BillingCycle | null;
    onCycleStarted: () => void;
}

const ALL_CYCLES_ID = "all";

export function NewCycleDialog({ selectedCycle, onCycleStarted }: NewCycleDialogProps) {
    const { user } = useAuth();
    const { toast } = useToast();
    const { translations, language } = useTranslations();
    const [isStartingNewCycle, setIsStartingNewCycle] = useState(false);
    const [newCycleStartDate, setNewCycleStartDate] = useState<Date | undefined>(new Date());
    const [isNewCycleDialogOpen, setIsNewCycleDialogOpen] = useState(false);

    const locales = { en: enUS, es, pt };
    const currentLocale = locales[language] || enUS;
    
    const handleStartNewCycle = async () => {
        if (!user || !newCycleStartDate) {
          toast({ title: translations.errorTitle, description: translations.dateRequired, variant: "destructive" });
          return;
        };
        setIsStartingNewCycle(true);
        const result = await startNewCycle(user.uid, startOfDay(newCycleStartDate));
        if ('error' in result) {
          toast({ title: translations.errorTitle, description: result.error, variant: "destructive" });
        } else {
          toast({ title: translations.newCycleStartedTitle, description: translations.newCycleStartedDesc });
          onCycleStarted();
        }
        setIsStartingNewCycle(false);
        setIsNewCycleDialogOpen(false);
        setNewCycleStartDate(new Date());
    };

    return (
        <Dialog open={isNewCycleDialogOpen} onOpenChange={setIsNewCycleDialogOpen}>
            <DialogTrigger asChild>
                <Button variant="outline" className="border-primary border-2 h-10 px-2 sm:px-4">
                    <Rocket className="h-5 w-5 sm:mr-2" />
                    <span className="hidden sm:inline">{translations.startNewCycle}</span>
                </Button>
            </DialogTrigger>
            <DialogContent>
            <DialogHeader>
                <DialogTitle>{translations.confirmNewCycleTitle}</DialogTitle>
                <DialogDescription asChild>
                    <div className="text-base space-y-2">
                        <span>{translations.confirmNewCycleDesc}</span>
                        {selectedCycle && selectedCycle.id !== ALL_CYCLES_ID && (
                            <div className="text-sm text-muted-foreground">
                                {translations.currentCycleStartsOn}{' '}
                                <span className="font-semibold">{format(new Date(selectedCycle.startDate), 'PP', { locale: currentLocale })}</span>.
                            </div>
                        )}
                    </div>
                </DialogDescription>
            </DialogHeader>
            <div className="py-4 space-y-2">
                 <p className="font-semibold">{translations.selectStartDate}</p>
                <Popover>
                    <PopoverTrigger asChild>
                        <Button
                        variant={"outline"}
                        className={cn(
                            "w-full justify-start text-left font-normal h-11 text-base",
                            !newCycleStartDate && "text-muted-foreground"
                        )}
                        >
                        <CalendarIcon className="mr-2 h-5 w-5" />
                        {newCycleStartDate ? format(newCycleStartDate, "PP", { locale: currentLocale }) : <span>{translations.date}</span>}
                        </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0">
                        <Calendar
                            mode="single"
                            selected={newCycleStartDate}
                            onSelect={setNewCycleStartDate}
                            disabled={(date) => date > new Date() || date < subDays(new Date(), 30)}
                            initialFocus
                        />
                    </PopoverContent>
                </Popover>
            </div>
            <DialogFooter>
                <Button variant="ghost" onClick={() => setIsNewCycleDialogOpen(false)}>{translations.cancel}</Button>
                <Button onClick={handleStartNewCycle} disabled={isStartingNewCycle || !newCycleStartDate}>
                {isStartingNewCycle ? translations.starting : translations.confirmAndStart}
                </Button>
            </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
