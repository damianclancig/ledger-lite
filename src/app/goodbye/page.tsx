
"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { useTranslations } from "@/contexts/LanguageContext";
import { BackgroundWrapper } from "@/components/layout/BackgroundWrapper";
import Link from "next/link";
import { Heart, Share2, Home, Check } from "lucide-react";
import { Footer } from "@/components/layout/Footer";

export default function GoodbyePage() {
    const { translations } = useTranslations();
    const [isCopied, setIsCopied] = useState(false);

    const handleShare = () => {
        const appUrl = process.env.NEXT_PUBLIC_APP_URL || window.location.origin;
        navigator.clipboard.writeText(appUrl).then(() => {
            setIsCopied(true);
            setTimeout(() => setIsCopied(false), 2000);
        });
    };

    return (
        <BackgroundWrapper>
             <div className="flex min-h-screen flex-col">
                <main className="flex-grow flex items-center justify-center p-4 text-center">
                    <Card className="w-full max-w-lg border-2 border-primary/50 shadow-2xl rounded-2xl bg-card/80 backdrop-blur-sm">
                        <CardHeader className="p-8">
                            <div className="flex justify-center mb-4">
                                <Heart className="h-16 w-16 text-primary animate-pulse" />
                            </div>
                            <CardTitle className="text-3xl">{translations.goodbyeTitle}</CardTitle>
                            <CardDescription className="text-base text-muted-foreground pt-2">
                                {translations.goodbyeMessage1}
                            </CardDescription>
                        </CardHeader>
                        <CardContent className="p-8 pt-0 space-y-6">
                            <p className="text-base">{translations.goodbyeMessage2}</p>
                            <p className="text-base">{translations.goodbyeMessage3}</p>
                            <div className="flex flex-col sm:flex-row gap-3">
                                <Button onClick={handleShare} variant="secondary" className="w-full text-base py-6" disabled={isCopied}>
                                    {isCopied ? (
                                        <>
                                            <Check className="mr-2 h-5 w-5 text-green-500" />
                                            {translations.copied}
                                        </>
                                    ) : (
                                        <>
                                            <Share2 className="mr-2 h-5 w-5" />
                                            {translations.goodbyeShare}
                                        </>
                                    )}
                                </Button>
                                <Button asChild className="w-full text-base py-6">
                                    <Link href="/">
                                        <Home className="mr-2 h-5 w-5" />
                                        {translations.goodbyeBackHome}
                                    </Link>
                                </Button>
                            </div>
                        </CardContent>
                    </Card>
                </main>
                <Footer />
            </div>
        </BackgroundWrapper>
    );
}
