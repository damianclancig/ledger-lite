"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Loader2 } from "lucide-react";
import { useTranslations } from "@/contexts/LanguageContext";
import { BackgroundWrapper } from "@/components/layout/BackgroundWrapper";

const GoogleIcon = (props: React.SVGProps<SVGSVGElement>) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    viewBox="0 0 48 48"
    width="24px"
    height="24px"
    {...props}
  >
    <path
      fill="#FFC107"
      d="M43.611,20.083H42V20H24v8h11.303c-1.649,4.657-6.08,8-11.303,8c-6.627,0-12-5.373-12-12s5.373-12,12-12c3.059,0,5.842,1.154,7.961,3.039l5.657-5.657C34.046,6.053,29.268,4,24,4C12.955,4,4,12.955,4,24s8.955,20,20,20s20-8.955,20-20C44,22.659,43.862,21.35,43.611,20.083z"
    />
    <path
      fill="#FF3D00"
      d="M6.306,14.691l6.571,4.819C14.655,15.108,18.961,12,24,12c3.059,0,5.842,1.154,7.961,3.039l5.657-5.657C34.046,6.053,29.268,4,24,4C16.318,4,9.656,8.337,6.306,14.691z"
    />
    <path
      fill="#4CAF50"
      d="M24,44c5.166,0,9.86-1.977,13.409-5.192l-6.19-5.238C29.211,35.091,26.715,36,24,36c-5.222,0-9.657-3.444-11.303-8H6.399v5.332C9.5,41.202,16.227,44,24,44z"
    />
    <path
      fill="#1976D2"
      d="M43.611,20.083H42V20H24v8h11.303c-0.792,2.237-2.231,4.166-4.087,5.574l6.19,5.238C42.012,36.49,44,30.86,44,24C44,22.659,43.862,21.35,43.611,20.083z"
    />
  </svg>
);


export default function LoginPage() {
  const { user, signInWithGoogle, loading } = useAuth();
  const { translations } = useTranslations();
  const router = useRouter();

  useEffect(() => {
    if (!loading && user) {
      router.push("/");
    }
  }, [user, loading, router]);

  if (loading || (!loading && user)) {
    return (
      <div className="flex h-screen items-center justify-center bg-background">
        <Loader2 className="h-16 w-16 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <BackgroundWrapper>
      <div className="flex min-h-screen items-center justify-center p-4">
        <Card className="w-full max-w-lg border-2 border-primary/50 text-white shadow-2xl rounded-2xl">
          <CardHeader className="text-center p-8">
            <h1 className="text-5xl font-extrabold text-transparent bg-clip-text bg-gradient-to-br from-slate-100 via-accent to-slate-100 mb-4 animate-[gradient-text_2s_ease_infinite]">
              {translations.appName}
            </h1>
            <p className="text-slate-300">
              {translations.signInToContinue}
            </p>
          </CardHeader>
          <CardContent className="p-8 pt-0">
            <Button
              onClick={signInWithGoogle}
              className="w-full text-base py-6 bg-white/90 text-gray-800 hover:bg-white border-2 border-transparent hover:border-accent transition-all duration-300 ease-in-out transform hover:scale-105"
            >
              <GoogleIcon className="mr-3 h-6 w-6" />
              {translations.signInWithGoogle}
            </Button>
          </CardContent>
        </Card>
      </div>
       <style jsx global>{`
        @keyframes gradient-text {
          0%, 100% {
            background-size: 200% 200%;
            background-position: 10% 0%;
          }
          50% {
            background-size: 200% 200%;
            background-position: 91% 100%;
          }
        }
      `}</style>
    </BackgroundWrapper>
  );
}
