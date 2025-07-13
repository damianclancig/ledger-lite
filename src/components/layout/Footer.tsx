
"use client";

import Link from "next/link";
import { Github } from "lucide-react";

export function Footer() {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="w-full border-t bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container flex flex-col items-center justify-between gap-4 py-5 md:h-20 md:flex-row md:py-0">
        <div className="flex flex-col items-center gap-4 px-8 md:gap-2">
          <p className="text-center text-sm leading-loose text-muted-foreground md:text-left">
            © {currentYear} Ledger Lite. All rights reserved. Released under the{" "}
            <Link
              href="/LICENSE"
              target="_blank"
              rel="noopener noreferrer"
              className="font-medium underline underline-offset-4"
            >
              MIT License
            </Link>
            .
          </p>
        </div>
         <a
            href="https://github.com/damianclancig/ledger-lite"
            target="_blank"
            rel="noreferrer"
            className="font-medium underline underline-offset-4"
          >
            <Github className="h-6 w-6 text-primary hover:text-accent transition-colors" />
            <span className="sr-only">GitHub</span>
          </a>
      </div>
    </footer>
  );
}
