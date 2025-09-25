
"use client";

import Link from "next/link";
import { LanguageSwitcher } from "@/components/LanguageSwitcher";
import { ThemeSwitcher } from "@/components/ThemeSwitcher";
import { useTranslations } from "@/contexts/LanguageContext";
import { LogOut, Menu, Home, PlusCircle, Landmark, Settings, Layers, PiggyBank } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Button } from "../ui/button";

export function Header() {
  const { translations } = useTranslations();
  const { user, signOut } = useAuth();

  const getInitials = (name: string | null | undefined) => {
    if (!name) return 'U';
    const names = name.split(' ');
    const initials = names.map(n => n[0]).join('');
    return initials.slice(0, 2).toUpperCase();
  };


  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container flex h-16 items-center justify-between max-w-7xl px-2 sm:px-6 lg:px-8 mx-auto">
        <div className="flex items-center">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="icon" className="mr-3 sm:mr-4 border-2 border-primary">
                <Menu className="h-6 w-6" strokeWidth={2.5} />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="start">
              <DropdownMenuItem asChild>
                <Link href="/dashboard">
                  <Home className="mr-2 h-4 w-4" />
                  <span>{translations.home}</span>
                </Link>
              </DropdownMenuItem>
               <DropdownMenuItem asChild>
                <Link href="/taxes">
                  <Landmark className="mr-2 h-4 w-4" />
                  <span>{translations.taxes}</span>
                </Link>
              </DropdownMenuItem>
              <DropdownMenuItem asChild>
                <Link href="/installments">
                  <Layers className="mr-2 h-4 w-4" />
                  <span>{translations.installments}</span>
                </Link>
              </DropdownMenuItem>
              <DropdownMenuItem asChild>
                <Link href="/savings-funds">
                  <PiggyBank className="mr-2 h-4 w-4" />
                  <span>{translations.savingsFunds}</span>
                </Link>
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem asChild>
                <Link href="/add-transaction">
                  <PlusCircle className="mr-2 h-4 w-4" />
                  <span>{translations.addTransaction}</span>
                </Link>
              </DropdownMenuItem>
               <DropdownMenuItem asChild>
                <Link href="/add-tax">
                  <PlusCircle className="mr-2 h-4 w-4" />
                  <span>{translations.newTax}</span>
                </Link>
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem asChild>
                <Link href="/settings/account">
                  <Settings className="mr-2 h-4 w-4" />
                  <span>{translations.options}</span>
                </Link>
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={() => signOut()}>
                <LogOut className="mr-2 h-4 w-4" />
                <span>{translations.signOut}</span>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
          <Link href="/dashboard" className="text-2xl sm:text-3xl font-bold no-underline">
            <span
              style={{
                background: 'linear-gradient(135deg, #1E3A8A, #3B82F6)',
                WebkitBackgroundClip: 'text',
                color: 'transparent',
                textShadow: '0 2px 4px rgba(30, 58, 138, 0.4)',
                WebkitTextStroke: '1px rgba(0,0,0,0.1)',
              }}
            >
              Finan
            </span>
            <span
              style={{
                background: 'linear-gradient(135deg, #FBBF24, #FDE68A, #F59E0B)',
                WebkitBackgroundClip: 'text',
                color: 'transparent',
                textShadow: '0 2px 3px rgba(245, 158, 11, 0.5)',
                WebkitTextStroke: '1px rgba(245, 158, 11, 0.4)',
              }}
            >
              Clan
            </span>
          </Link>
        </div>
        <div className="flex items-center space-x-2">
          <ThemeSwitcher />
          <LanguageSwitcher />
          {user && (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="relative h-10 w-10 rounded-full border-2 border-primary">
                  <Avatar className="h-9 w-9">
                    <AvatarImage src={user.photoURL || ''} alt={user.displayName || 'User'} />
                    <AvatarFallback>{getInitials(user.displayName)}</AvatarFallback>
                  </Avatar>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent className="w-56" align="end" forceMount>
                <DropdownMenuLabel className="font-normal">
                  <div className="flex flex-col space-y-1">
                    <p className="text-base font-medium leading-none">{user.displayName}</p>
                    <p className="text-sm leading-none text-muted-foreground">
                      {user.email}
                    </p>
                  </div>
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={() => signOut()}>
                  <LogOut className="mr-2 h-4 w-4" />
                  <span>{translations.signOut}</span>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          )}
        </div>
      </div>
    </header>
  );
}
