
"use client";

import { useTranslations } from "@/contexts/LanguageContext";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { FileText, Shield, Server, AlertTriangle, GitBranch, ChevronsRight } from "lucide-react";
import { Separator } from "@/components/ui/separator";

export default function TermsPage() {
    const { translations } = useTranslations();

    const sections = [
        {
            title: translations.termsAcceptance,
            icon: ChevronsRight,
            content: translations.termsAcceptanceText,
        },
        {
            title: translations.termsServiceDescription,
            icon: Server,
            content: translations.termsServiceDescriptionText,
        },
        {
            title: translations.termsPrivacyAndData,
            icon: Shield,
            content: [
                translations.termsPrivacyAndDataText1,
                translations.termsPrivacyAndDataText2,
                translations.termsPrivacyAndDataText3,
            ],
        },
        {
            title: translations.termsLimitationOfLiability,
            icon: AlertTriangle,
            content: translations.termsLimitationOfLiabilityText,
        },
        {
            title: translations.termsIntellectualProperty,
            icon: GitBranch,
            content: translations.termsIntellectualPropertyText,
        },
        {
            title: translations.termsChangesAndTermination,
            icon: GitBranch,
            content: translations.termsChangesAndTerminationText,
        },
    ];

    return (
        <div className="container mx-auto max-w-4xl py-8 px-4">
            <Card className="w-full border-2 border-primary/50 shadow-2xl rounded-2xl bg-card/80 backdrop-blur-sm">
                <CardHeader className="text-center p-8">
                    <div className="flex justify-center mb-4">
                        <FileText className="h-16 w-16 text-primary" />
                    </div>
                    <CardTitle className="text-xl md:text-2xl">{translations.termsAndConditions}</CardTitle>
                    <CardDescription className="text-base text-muted-foreground pt-2">
                        {translations.termsLastUpdated}
                    </CardDescription>
                </CardHeader>
                <Separator/>
                <CardContent className="p-8 pt-6 space-y-8">
                    {sections.map((section, index) => (
                        <div key={index}>
                            <h2 className="flex items-center text-lg md:text-xl font-semibold mb-3">
                                <section.icon className="h-6 w-6 mr-3 text-primary shrink-0" />
                                {section.title}
                            </h2>
                            {Array.isArray(section.content) ? (
                                <ul className="space-y-3 pl-6 text-base text-foreground/90 list-disc">
                                    {section.content.map((item, i) => <li key={i}>{item}</li>)}
                                </ul>
                            ) : (
                                <p className="text-base text-foreground/90">{section.content}</p>
                            )}
                        </div>
                    ))}
                </CardContent>
            </Card>
        </div>
    );
}
