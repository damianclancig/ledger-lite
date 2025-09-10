
"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardDescription } from "@/components/ui/card";
import { Loader2, CheckCircle } from "lucide-react";
import { useTranslations } from "@/contexts/LanguageContext";
import { BackgroundWrapper } from "@/components/layout/BackgroundWrapper";
import { Separator } from "@/components/ui/separator";
import { ThemeSwitcher } from "@/components/ThemeSwitcher";
import { LanguageSwitcher } from "@/components/LanguageSwitcher";

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

export default function HomePage() {
  const { user, signInWithGoogle, loading } = useAuth();
  const { translations } = useTranslations();
  const router = useRouter();

  useEffect(() => {
    if (!loading && user) {
      router.push("/dashboard");
    }
  }, [user, loading, router]);

  if (loading || (!loading && user)) {
    return (
      <div className="flex h-screen items-center justify-center bg-background">
        <Loader2 className="h-16 w-16 animate-spin text-primary" />
      </div>
    );
  }

  const features = [
    "Control total de tus ingresos y gastos.",
    "Categorías y métodos de pago 100% personalizables.",
    "Registro y seguimiento de impuestos recurrentes.",
    "Gráficos interactivos para visualizar tu salud financiera.",
    "Seguridad y privacidad para tus datos.",
  ];

  return (
    <BackgroundWrapper>
      <div className="relative flex min-h-screen flex-col items-center justify-center p-4 text-center">
        
        <div className="w-full max-w-2xl mb-8">
            <h1 className="text-7xl md:text-8xl font-extrabold">
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
            </h1>
            <p className="mt-4 text-xl md:text-2xl text-foreground font-semibold">
            La claridad financiera que tu vida necesita.
            </p>
        </div>

        <Card className="w-full max-w-lg border-2 border-primary/50 shadow-2xl rounded-2xl bg-card/80 backdrop-blur-sm">
          <CardHeader>
            <h2 className="text-2xl font-bold text-foreground">Toma el control de tu dinero</h2>
            <CardDescription className="text-base text-muted-foreground pt-1">
              FinanClan es la herramienta definitiva para organizar tus finanzas personales o familiares de forma simple, visual y segura.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4 text-left">
              <ul className="space-y-3">
                {features.map((feature, index) => (
                  <li key={index} className="flex items-start text-base text-foreground">
                    <CheckCircle className="h-5 w-5 mr-3 mt-0.5 text-green-500 shrink-0" />
                    <span>{feature}</span>
                  </li>
                ))}
              </ul>
            <Separator className="my-6" />
            <p className="text-center text-muted-foreground text-base">
              ¿Listo para empezar?
            </p>
            <Button
              onClick={signInWithGoogle}
              className="w-full text-base py-6 bg-white/90 text-gray-800 hover:bg-white dark:bg-secondary dark:text-secondary-foreground dark:hover:bg-secondary/80 border-2 border-transparent hover:border-accent transition-all duration-300 ease-in-out transform hover:scale-105"
            >
              <GoogleIcon className="mr-3 h-6 w-6" />
              {translations.signInWithGoogle}
            </Button>
          </CardContent>
        </Card>

        <div className="flex items-center justify-center space-x-2 mt-8">
            <ThemeSwitcher />
            <LanguageSwitcher />
        </div>
      </div>
    </BackgroundWrapper>
  );
}

