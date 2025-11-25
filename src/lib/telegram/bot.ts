import crypto from 'crypto';

/**
 * Telegram Bot API Client
 * Handles sending messages and interacting with Telegram Bot API
 */

const TELEGRAM_API_URL = `https://api.telegram.org/bot${process.env.TELEGRAM_BOT_TOKEN}`;

export interface SendMessageOptions {
  chatId: number;
  text: string;
  parseMode?: 'Markdown' | 'HTML';
  replyMarkup?: InlineKeyboard | ReplyKeyboard;
}

export interface InlineKeyboard {
  inline_keyboard: InlineButton[][];
}

export interface ReplyKeyboard {
  keyboard: KeyboardButton[][];
  resize_keyboard?: boolean;
  one_time_keyboard?: boolean;
}

export interface InlineButton {
  text: string;
  callback_data?: string;
  url?: string;
}

export interface KeyboardButton {
  text: string;
}

/**
 * Send a message to a Telegram chat
 */
export async function sendMessage(options: SendMessageOptions): Promise<boolean> {
  try {
    const body: any = {
      chat_id: options.chatId,
      text: options.text,
    };

    if (options.parseMode) {
      body.parse_mode = options.parseMode;
    }

    if (options.replyMarkup) {
      body.reply_markup = JSON.stringify(options.replyMarkup);
    }

    const response = await fetch(`${TELEGRAM_API_URL}/sendMessage`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(body),
    });

    if (!response.ok) {
      const error = await response.json();
      console.error('Telegram API error:', error);
      return false;
    }

    return true;
  } catch (error) {
    console.error('Error sending Telegram message:', error);
    return false;
  }
}

/**
 * Answer a callback query (from inline button)
 */
export async function answerCallbackQuery(
  callbackQueryId: string,
  text?: string,
  showAlert: boolean = false
): Promise<boolean> {
  try {
    const response = await fetch(`${TELEGRAM_API_URL}/answerCallbackQuery`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        callback_query_id: callbackQueryId,
        text,
        show_alert: showAlert,
      }),
    });

    return response.ok;
  } catch (error) {
    console.error('Error answering callback query:', error);
    return false;
  }
}

/**
 * Edit a message text
 */
export async function editMessageText(
  chatId: number,
  messageId: number,
  text: string,
  replyMarkup?: InlineKeyboard
): Promise<boolean> {
  try {
    const body: any = {
      chat_id: chatId,
      message_id: messageId,
      text,
    };

    if (replyMarkup) {
      body.reply_markup = JSON.stringify(replyMarkup);
    }

    const response = await fetch(`${TELEGRAM_API_URL}/editMessageText`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(body),
    });

    return response.ok;
  } catch (error) {
    console.error('Error editing message:', error);
    return false;
  }
}

/**
 * Set webhook URL
 */
export async function setWebhook(url: string): Promise<boolean> {
  try {
    const response = await fetch(`${TELEGRAM_API_URL}/setWebhook`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        url,
        secret_token: process.env.TELEGRAM_WEBHOOK_SECRET,
      }),
    });

    return response.ok;
  } catch (error) {
    console.error('Error setting webhook:', error);
    return false;
  }
}

/**
 * Verify that a webhook request is from Telegram
 */
export function verifyTelegramWebhook(token: string): boolean {
  const secret = process.env.TELEGRAM_WEBHOOK_SECRET;
  if (!secret) {
    console.error('TELEGRAM_WEBHOOK_SECRET not configured');
    return false;
  }
  return token === secret;
}

/**
 * Generate a unique linking code for user verification
 */
export function generateLinkingCode(): string {
  return crypto.randomInt(100000, 999999).toString();
}

/**
 * Create inline keyboard with confirmation buttons
 */
export function createConfirmationKeyboard(
  confirmData: string,
  cancelData: string = 'cancel'
): InlineKeyboard {
  return {
    inline_keyboard: [
      [
        { text: '✅ Confirmar', callback_data: confirmData },
        { text: '❌ Cancelar', callback_data: cancelData },
      ],
    ],
  };
}

/**
 * Format amount with currency
 */
export function formatAmount(amount: number): string {
  return new Intl.NumberFormat('es-AR', {
    style: 'currency',
    currency: 'ARS',
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  }).format(amount);
}
