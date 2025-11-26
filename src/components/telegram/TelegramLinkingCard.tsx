'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Loader2, Copy, Check, MessageCircle, ExternalLink, Sparkles } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';

export default function TelegramLinkingCard() {
  const { user } = useAuth();
  const [linkingCode, setLinkingCode] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  const generateCode = async () => {
    if (!user) return;

    setLoading(true);
    setError(null);

    try {
      const response = await fetch('/api/telegram/link', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ userId: user.uid }),
      });

      if (!response.ok) {
        throw new Error('Failed to generate code');
      }

      const data = await response.json();
      setLinkingCode(data.code);
    } catch (err) {
      setError('Error al generar el código. Por favor intenta nuevamente.');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const copyCode = () => {
    if (linkingCode) {
      navigator.clipboard.writeText(linkingCode);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const openTelegram = () => {
    window.open('https://t.me/financlan_bot', '_blank');
  };

  return (
    <div className="space-y-6">
      {/* Info Cards */}
      <div className="grid md:grid-cols-3 gap-4">
        <Card className="border-2 border-primary/20">
          <CardContent className="pt-6">
            <div className="flex items-start gap-3">
              <div className="p-2 bg-green-100 dark:bg-green-900/20 rounded-lg">
                <Sparkles className="h-5 w-5 text-green-600 dark:text-green-400" />
              </div>
              <div>
                <h3 className="font-semibold text-base mb-1">Súper rápido</h3>
                <p className="text-sm text-muted-foreground">
                  Escribe en lenguaje natural y el bot entiende
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-2 border-primary/20">
          <CardContent className="pt-6">
            <div className="flex items-start gap-3">
              <div className="p-2 bg-blue-100 dark:bg-blue-900/20 rounded-lg">
                <MessageCircle className="h-5 w-5 text-blue-600 dark:text-blue-400" />
              </div>
              <div>
                <h3 className="font-semibold text-base mb-1">Desde cualquier lugar</h3>
                <p className="text-sm text-muted-foreground">
                  Móvil, tablet o computadora
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-2 border-primary/20">
          <CardContent className="pt-6">
            <div className="flex items-start gap-3">
              <div className="p-2 bg-purple-100 dark:bg-purple-900/20 rounded-lg">
                <Check className="h-5 w-5 text-purple-600 dark:text-purple-400" />
              </div>
              <div>
                <h3 className="font-semibold text-base mb-1">Seguro</h3>
                <p className="text-sm text-muted-foreground">
                  Código de un solo uso
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Main Card */}
      <div className="flex justify-center">
        <Card className="shadow-xl border-2 border-primary max-w-2xl w-full">
          {!linkingCode ? (
            <>
              <CardHeader>
                <CardTitle className="text-center text-xl">Vincular cuenta de Telegram</CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="flex justify-center pt-2">
                <Button
                  onClick={generateCode}
                  disabled={loading || !user}
                  size="lg"
                  className="text-base px-8"
                >
                  {loading ? (
                    <>
                      <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                      Generando código...
                    </>
                  ) : (
                    <>
                      <MessageCircle className="mr-2 h-5 w-5" />
                      Generar código de vinculación
                    </>
                  )}
                </Button>
              </div>
            </CardContent>
          </>
        ) : (
          <>
            <CardHeader>
              <CardTitle className="text-center text-xl">Código de vinculación</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="flex justify-center">
                <div className="relative">
                  <div className="p-8 bg-muted rounded-xl border-2 border-primary/30">
                    <code className="text-6xl font-mono font-bold tracking-[0.3em] block text-center">
                      {linkingCode}
                    </code>
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={copyCode}
                    className="absolute -top-3 -right-3"
                  >
                    {copied ? (
                      <>
                        <Check className="mr-1.5 h-4 w-4" />
                        Copiado
                      </>
                    ) : (
                      <>
                        <Copy className="mr-1.5 h-4 w-4" />
                        Copiar
                      </>
                    )}
                  </Button>
                </div>
              </div>

              <p className="text-center text-sm text-muted-foreground">
                ⏱️ Este código expira en 10 minutos
              </p>

              <div className="space-y-3">
                <h4 className="font-semibold text-base text-center">Pasos a seguir:</h4>
                <ol className="space-y-3 max-w-md mx-auto">
                  <li className="flex gap-3 items-start">
                    <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-primary text-primary-foreground text-sm font-bold">
                      1
                    </span>
                    <span className="text-base pt-0.5">Abre el bot de FinanClan en Telegram</span>
                  </li>
                  <li className="flex gap-3 items-start">
                    <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-primary text-primary-foreground text-sm font-bold">
                      2
                    </span>
                    <div className="pt-0.5">
                      <span className="text-base">Escribe: </span>
                      <code className="bg-muted px-2 py-1 rounded text-sm">
                        /vincular {linkingCode}
                      </code>
                    </div>
                  </li>
                  <li className="flex gap-3 items-start">
                    <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-primary text-primary-foreground text-sm font-bold">
                      3
                    </span>
                    <span className="text-base pt-0.5">Confirma la vinculación</span>
                  </li>
                </ol>
              </div>

              <div className="flex justify-center gap-3 pt-2">
                <Button
                  onClick={openTelegram}
                  size="lg"
                  className="text-base"
                >
                  <ExternalLink className="mr-2 h-5 w-5" />
                  Abrir Bot
                </Button>
                <Button
                  onClick={() => setLinkingCode(null)}
                  variant="outline"
                  size="lg"
                  className="text-base"
                >
                  Nuevo código
                </Button>
              </div>
            </CardContent>
          </>
        )}
      </Card>
      </div>

      {error && (
        <Alert variant="destructive">
          <AlertDescription className="text-base">{error}</AlertDescription>
        </Alert>
      )}
    </div>
  );
}
