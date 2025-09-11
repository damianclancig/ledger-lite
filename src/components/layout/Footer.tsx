"use client";

import { Github } from "lucide-react";
import { useTranslations } from "@/contexts/LanguageContext";

export function Footer() {
  const currentYear = new Date().getFullYear();
  const { translations } = useTranslations();

  return (
    <footer className="w-full border-t bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container mx-auto flex flex-col sm:flex-row items-center justify-between gap-4 max-w-7xl px-4 sm:px-6 lg:px-8 py-6">
        <div className="text-sm text-muted-foreground text-center sm:text-left">
          <p>{translations.footerRights?.replace('{currentYear}', String(currentYear))}</p>
          <p>
            {translations.footerAuthor}{' '}
            <a 
                href="https://clancig.com.ar" 
                target="_blank" 
                rel="noopener noreferrer" 
                className="font-medium underline underline-offset-4 hover:text-primary"
            >
                clancig.com.ar
            </a>
          </p>
        </div>
        <a
          href="https://github.com/damianclancig/ledger-lite"
          target="_blank"
          rel="noreferrer"
          className="font-medium underline-offset-4"
        >
          <Github className="h-6 w-6 text-primary hover:text-accent transition-colors" />
          <span className="sr-only">GitHub</span>
        </a>
      </div>
    </footer>
  );
}
