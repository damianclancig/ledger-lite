
"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from "@/components/ui/dialog";
import { Heart, Github, Briefcase, ClipboardCopy, Check } from "lucide-react";
import { useTranslations } from "@/contexts/LanguageContext";

export function SupportDialog() {
  const { translations } = useTranslations();
  const [isOpen, setIsOpen] = useState(false);
  const [isCopied, setIsCopied] = useState(false);
  
  const APP_URL = process.env.NEXT_PUBLIC_APP_URL || 'https://caja.clancig.com.ar';
  const CAFECITO_USER = process.env.NEXT_PUBLIC_CAFECITO_USER;
  const PORTFOLIO_URL = process.env.NEXT_PUBLIC_PORTFOLIO_URL;
  const GITHUB_REPO_URL = process.env.NEXT_PUBLIC_GITHUB_REPO_URL;

  if (!CAFECITO_USER || !PORTFOLIO_URL || !GITHUB_REPO_URL) {
    console.warn("Support Dialog: One or more environment variables (NEXT_PUBLIC_CAFECITO_USER, NEXT_PUBLIC_PORTFOLIO_URL, NEXT_PUBLIC_GITHUB_REPO_URL) are not set.");
  }

  const handleCopyLink = () => {
    navigator.clipboard.writeText(APP_URL).then(() => {
      setIsCopied(true);
      setTimeout(() => setIsCopied(false), 2000); // Reset after 2 seconds
    });
  };


  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <button
          className="relative group"
          aria-label={translations.supportProject}
        >
          <Heart className="h-8 w-8 text-red-500 fill-red-500 animate-pulse-subtle" />
        </button>
      </DialogTrigger>
      <DialogContent className="w-[calc(100vw-2rem)] sm:w-full max-w-md p-4 sm:p-6">
        <DialogHeader>
          <DialogTitle className="text-xl sm:text-2xl text-center">{translations.supportProject}</DialogTitle>
          <DialogDescription className="text-center text-sm sm:text-base pt-2">
            {translations.supportMessage1}
          </DialogDescription>
        </DialogHeader>
        <div className="py-2 sm:py-4 text-sm sm:text-base space-y-2 sm:space-y-4 text-center">
            <p>{translations.supportMessage2}</p>
            <p>{translations.supportMessage3}</p>
        </div>
        <DialogFooter className="flex-col sm:flex-col sm:space-x-0 gap-2 sm:gap-3">
          <Button variant="secondary" className="w-full text-sm sm:text-base" size="lg" onClick={handleCopyLink}>
            {isCopied ? <Check className="mr-2 h-4 w-4 sm:h-5 sm:w-5 text-green-500" /> : <ClipboardCopy className="mr-2 h-4 w-4 sm:h-5 sm:w-5" />}
            {isCopied ? translations.copied : translations.supportCopyLink}
          </Button>
          <Button asChild className="w-full text-sm sm:text-base" size="lg">
            <a href={`https://cafecito.app/${CAFECITO_USER}`} target="_blank" rel="noopener noreferrer">
              ☕ {translations.supportCafecito}
            </a>
          </Button>
          <Button asChild variant="secondary" className="w-full text-sm sm:text-base" size="lg">
            <a href={PORTFOLIO_URL} target="_blank" rel="noopener noreferrer">
              <Briefcase className="mr-2 h-4 w-4 sm:h-5 sm:w-5" />
              {translations.supportVisitPortfolio}
            </a>
          </Button>
          <Button asChild variant="secondary" className="w-full text-sm sm:text-base" size="lg">
            <a href={GITHUB_REPO_URL} target="_blank" rel="noopener noreferrer">
              <Github className="mr-2 h-4 w-4 sm:h-5 sm:w-5" />
              {translations.supportGithub}
            </a>
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
