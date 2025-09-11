"use client";

import { usePathname } from "next/navigation";
import { Header } from "./Header";
import { Footer } from "./Footer";
import { useAuth } from "@/contexts/AuthContext";
import { Loader2 } from "lucide-react";
import { BackgroundWrapper } from "./BackgroundWrapper";

export function LayoutWrapper({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const { loading, user } = useAuth();
  const isPublicPage = pathname === '/';

  // While loading auth state, show a full-screen loader
  if (loading) {
    return (
      <div className="flex h-screen w-full items-center justify-center bg-background">
        <Loader2 className="h-16 w-16 animate-spin text-primary" />
      </div>
    );
  }

  // If we are on a public page (the new home/login page)
  if (isPublicPage) {
    return (
      <BackgroundWrapper>
        <main className="flex-grow">{children}</main>
        <Footer />
      </BackgroundWrapper>
    );
  }
  
  // If we are on an authenticated page but there's no user, show a loader.
  // The AuthProvider's useEffect is handling the redirect.
  if (!user) {
     return (
      <div className="flex h-screen w-full items-center justify-center bg-background">
        <Loader2 className="h-16 w-16 animate-spin text-primary" />
      </div>
    );
  }

  // If user is authenticated, show the main layout with header and footer
  return (
    <>
      <Header />
      <BackgroundWrapper>
        <div className="min-h-screen flex flex-col pt-4">
          <main className="flex-grow container max-w-7xl px-4 sm:px-6 lg:px-8 pb-8 mx-auto">
            {children}
          </main>
          <Footer />
        </div>
      </BackgroundWrapper>
    </>
  );
}
