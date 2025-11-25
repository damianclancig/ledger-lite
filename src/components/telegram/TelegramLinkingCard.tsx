'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Loader2, Copy, Check, MessageCircle } from 'lucide-react';
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
    <Card>
      <CardHeader>
        <div className="flex items-center gap-2">
          <MessageCircle className="h-5 w-5 text-blue-500" />
          <CardTitle>Bot de Telegram</CardTitle>
        </div>
        <CardDescription>
          Vincula tu cuenta de Telegram para agregar transacciones rápidamente desde tu móvil
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {!linkingCode ? (
          <>
            <div className="space-y-2">
              <h4 className="font-medium">¿Cómo funciona?</h4>
              <ol className="list-decimal list-inside space-y-1 text-sm text-muted-foreground">
                <li>Genera un código de vinculación</li>
                <li>Abre el bot de FinanClan en Telegram</li>
                <li>Usa el comando <code className="bg-muted px-1 py-0.5 rounded">/vincular CODIGO</code></li>
                <li>¡Listo! Ya puedes agregar transacciones desde Telegram</li>
              </ol>
            </div>

            <Button
              onClick={generateCode}
              disabled={loading || !user}
              className="w-full"
            >
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Generando código...
                </>
              ) : (
                'Generar código de vinculación'
              )}
            </Button>
          </>
        ) : (
          <>
            <Alert>
              <AlertDescription>
                <div className="space-y-2">
                  <p className="font-medium">Tu código de vinculación:</p>
                  <div className="flex items-center gap-2">
                    <code className="flex-1 bg-muted px-4 py-2 rounded text-2xl font-mono text-center tracking-wider">
                      {linkingCode}
                    </code>
                    <Button
                      variant="outline"
                      size="icon"
                      onClick={copyCode}
                    >
                      {copied ? (
                        <Check className="h-4 w-4 text-green-500" />
                      ) : (
                        <Copy className="h-4 w-4" />
                      )}
                    </Button>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    Este código expira en 10 minutos
                  </p>
                </div>
              </AlertDescription>
            </Alert>

            <div className="space-y-2">
              <h4 className="font-medium">Próximos pasos:</h4>
              <ol className="list-decimal list-inside space-y-1 text-sm text-muted-foreground">
                <li>Abre el bot de FinanClan en Telegram</li>
                <li>Escribe: <code className="bg-muted px-1 py-0.5 rounded">/vincular {linkingCode}</code></li>
                <li>El bot confirmará la vinculación</li>
              </ol>
            </div>

            <div className="flex gap-2">
              <Button
                onClick={openTelegram}
                className="flex-1"
                variant="default"
              >
                <MessageCircle className="mr-2 h-4 w-4" />
                Abrir Telegram
              </Button>
              <Button
                onClick={() => setLinkingCode(null)}
                variant="outline"
                className="flex-1"
              >
                Generar nuevo código
              </Button>
            </div>
          </>
        )}

        {error && (
          <Alert variant="destructive">
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        <div className="pt-4 border-t">
          <h4 className="font-medium mb-2">Ejemplos de uso:</h4>
          <div className="space-y-1 text-sm text-muted-foreground">
            <p>• "Gasté 1500 en supermercado"</p>
            <p>• "Compré ropa por 3000"</p>
            <p>• "Ingreso de 50000 por salario"</p>
            <p>• "500 de comida en mcdonalds"</p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
