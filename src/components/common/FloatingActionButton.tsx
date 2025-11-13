
"use client";

import React, { useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { useScrollDirection } from "@/hooks/use-scroll-direction";
import type { LucideIcon } from 'lucide-react';

interface FloatingActionButtonProps {
  onClick: () => void;
  label: string;
  icon: LucideIcon;
}

export function FloatingActionButton({ onClick, label, icon: Icon }: FloatingActionButtonProps) {
  // This hook now applies the data-scroll-direction attribute to the body.
  // It does not return a value, so we just call it to activate it.
  useScrollDirection();
  
  // We add a CSS rule to globals.css to handle the show/hide transition.
  // This is more performant than using React state.

  return (
    <Button
      onClick={onClick}
      className={cn(
        "group fixed bottom-6 right-6 h-16 w-16 rounded-full bg-primary p-0 shadow-lg transition-transform duration-300 ease-in-out hover:w-auto hover:pr-6 hover:bg-primary/90 gap-0 hover:gap-2",
        // The scale is now controlled by a data attribute on the body
        "data-[scroll-direction='down']:scale-0 data-[scroll-direction='up']:scale-100"
      )}
      aria-label={label}
    >
      <Icon className="h-10 w-10 text-primary-foreground transition-transform duration-300 group-hover:rotate-90 group-hover:ml-3" strokeWidth={3.5} />
      <span className="w-0 overflow-hidden whitespace-nowrap text-lg font-semibold text-primary-foreground opacity-0 transition-all duration-300 group-hover:w-auto group-hover:opacity-100">
        {label}
      </span>
    </Button>
  );
}
