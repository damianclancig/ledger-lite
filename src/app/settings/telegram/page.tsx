'use client';

import TelegramLinkingCard from '@/components/telegram/TelegramLinkingCard';

export default function TelegramSettingsPage() {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold tracking-tight">Telegram Bot</h2>
        <p className="text-muted-foreground">
          Vincula tu cuenta de Telegram para agregar transacciones rápidamente desde tu móvil
        </p>
      </div>

      <TelegramLinkingCard />
    </div>
  );
}
