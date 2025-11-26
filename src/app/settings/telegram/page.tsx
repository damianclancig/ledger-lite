'use client';

import { useState, useEffect } from 'react';
import TelegramLinkingCard from '@/components/telegram/TelegramLinkingCard';

const examples = [
  '"Gasté 1500 en supermercado"',
  '"Ingreso de 50000 por salario"',
  '"Compré ropa por 3000 con tarjeta de crédito"',
  '"Pagué 2000 de luz en efectivo"',
  '"500 de comida en mcdonalds con débito"',
  '"Transferí 10000 al fondo de ahorros"',
  '"Gasté 800 en nafta con billetera virtual"',
];

export default function TelegramSettingsPage() {
  const [currentExample, setCurrentExample] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentExample((prev) => (prev + 1) % examples.length);
    }, 3000); // Cambia cada 3 segundos

    return () => clearInterval(interval);
  }, []);

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold tracking-tight">Bot de Telegram</h2>
        <p className="text-muted-foreground mt-2 text-base">
          Agrega transacciones desde tu móvil de forma instantánea usando lenguaje natural.
        </p>
      </div>

      <div className="space-y-3">
        <p className="text-base">
          Con el bot de Telegram, puedes registrar tus gastos e ingresos simplemente escribiendo mensajes como lo harías normalmente:
        </p>
        <div className="pl-4 border-l-4 border-primary/30 h-8 flex items-center overflow-hidden">
          <div
            className="transition-all duration-500 ease-in-out"
            style={{
              transform: `translateY(-${currentExample * 2}rem)`,
            }}
          >
            {examples.map((example, index) => (
              <p
                key={index}
                className="text-base text-muted-foreground italic h-8 flex items-center"
              >
                {example}
              </p>
            ))}
          </div>
        </div>
        <p className="text-base text-muted-foreground">
          El bot entiende lo que escribes y crea las transacciones automáticamente. 
          Para comenzar, genera un código de vinculación a continuación.
        </p>
      </div>

      <TelegramLinkingCard />
    </div>
  );
}
