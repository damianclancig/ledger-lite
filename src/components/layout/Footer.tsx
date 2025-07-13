
"use client";

import { Github } from "lucide-react";

export function Footer() {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="w-full border-t bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="w-full px-4 sm:px-6 lg:px-8">
        <div className="flex h-20 items-center justify-between">
          <p className="text-sm text-muted-foreground">
            © {currentYear} Ledger Lite. All rights reserved. Released under the MIT License.
          </p>
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
      </div>
    </footer>
  );
}
