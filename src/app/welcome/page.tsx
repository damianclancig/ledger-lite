
"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";
import { useTranslations } from "@/contexts/LanguageContext";
import { startNewCycle } from "@/app/actions/billingCycleActions";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { Rocket, Calendar as CalendarIcon } from "lucide-react";
import { cn } from "@/lib/utils";
import { subDays, startOfDay, format } from "date-fns";
import { es, pt, enUS } from "date-fns/locale";
import { BackgroundWrapper } from "@/components/layout/BackgroundWrapper";
import { Footer } from "@/components/layout/Footer";
import { ThemeSwitcher } from "@/components/ThemeSwitcher";
import { LanguageSwitcher } from "@/components/LanguageSwitcher";

export default function WelcomePage() {
    const { user } = useAuth();
    const router = useRouter();
    const { toast } = useToast();
    const { translations, language } = useTranslations();
    const [isStartingNewCycle, setIsStartingNewCycle] = useState(false);
    const [newCycleStartDate, setNewCycleStartDate] = useState<Date | undefined>(new Date());

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
            setIsStartingNewCycle(false);
        } else {
            toast({ title: translations.newCycleStartedTitle, description: translations.newCycleStartedDesc });
            router.push('/dashboard');
        }
    };

    return (
        <BackgroundWrapper>
            <div className="flex min-h-screen flex-col">
                 <header className="flex items-center justify-end p-4">
                    <div className="flex items-center space-x-2">
                        <ThemeSwitcher />
                        <LanguageSwitcher />
                    </div>
                </header>

                <main className="flex-grow flex items-center justify-center p-4">
                    <Card className="w-full max-w-2xl shadow-2xl border-2 border-primary/50 bg-card/80 backdrop-blur-sm">
                        <CardHeader className="text-center p-8">
                            <CardTitle className="text-3xl">¡Bienvenido a</CardTitle>
                            <h1 className="text-6xl font-extrabold -mt-2">
                                <span style={{ background: 'linear-gradient(135deg, #1E3A8A, #3B82F6)', WebkitBackgroundClip: 'text', color: 'transparent', textShadow: '0 2px 4px rgba(30, 58, 138, 0.4)', WebkitTextStroke: '1px rgba(0,0,0,0.1)' }}>
                                    Finan
                                </span>
                                <span style={{ background: 'linear-gradient(135deg, #FBBF24, #FDE68A, #F59E0B)', WebkitBackgroundClip: 'text', color: 'transparent', textShadow: '0 2px 3px rgba(245, 158, 11, 0.5)', WebkitTextStroke: '1px rgba(245, 158, 11, 0.4)' }}>
                                    Clan
                                </span>
                            </h1>
                            <CardDescription className="text-base pt-2 text-foreground/80">
                            {translations.welcomeSubtitle}
                            </CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-6 p-8 pt-0">
                            <p className="text-muted-foreground text-center">
                            {translations.welcomeDesc}
                            </p>
                            <div className="space-y-2">
                                <p className="font-semibold text-center">{translations.selectStartDate}</p>
                                <div className="flex justify-center">
                                    <Popover>
                                    <PopoverTrigger asChild>
                                        <Button
                                        variant={"outline"}
                                        className={cn(
                                            "w-auto justify-center text-left font-normal text-lg h-12",
                                            !newCycleStartDate && "text-muted-foreground"
                                        )}
                                        >
                                        <CalendarIcon className="mr-2 h-5 w-5" />
                                        {newCycleStartDate ? format(newCycleStartDate, "PPP", { locale: currentLocale }) : <span>{translations.date}</span>}
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
                            </div>
                            <Button
                            size="lg"
                            onClick={handleStartNewCycle}
                            disabled={isStartingNewCycle || !newCycleStartDate}
                            className="w-full text-lg py-6 mt-4"
                            >
                            <Rocket className="mr-3 h-5 w-5" />
                            {isStartingNewCycle ? translations.starting : translations.startFirstCycle}
                            </Button>
                        </CardContent>
                    </Card>
                </main>
                <Footer />
            </div>
        </BackgroundWrapper>
    );
}
