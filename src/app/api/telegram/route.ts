import { NextRequest, NextResponse } from 'next/server';
import type { TelegramUpdate, ParsedTransaction } from '@/types';
import { verifyTelegramWebhook, sendMessage, answerCallbackQuery } from '@/lib/telegram/bot';
import { 
  getTelegramUser, 
  linkTelegramAccount, 
  unlinkTelegramAccount 
} from '@/lib/telegram/userMapping';
import { parseTransactionMessage } from '@/lib/telegram/nlp';
import {
  handleStartCommand,
  handleHelpCommand,
  handleCategoriesCommand,
  handlePaymentMethodsCommand,
  handleSummaryCommand,
  handleCancelCommand,
  showTransactionConfirmation,
} from '@/lib/telegram/commands';
import { addTransaction } from '@/app/actions/transactions/transactionCrud';
import { getCategories } from '@/app/actions/categoryActions';
import { getPaymentMethods } from '@/app/actions/paymentMethodActions';

/**
 * Telegram Bot Webhook
 * Receives and processes messages from Telegram
 */

// Store pending transactions temporarily (in production, use Redis or database)
const pendingTransactions = new Map<string, ParsedTransaction>();

export async function POST(request: NextRequest) {
  try {
    // Verify the webhook is from Telegram
    const secretToken = request.headers.get('X-Telegram-Bot-Api-Secret-Token');
    if (!secretToken || !verifyTelegramWebhook(secretToken)) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const update: TelegramUpdate = await request.json();

    // Handle callback queries (button presses)
    if (update.callback_query) {
      await handleCallbackQuery(update.callback_query);
      return NextResponse.json({ ok: true });
    }

    // Handle text messages
    if (update.message?.text) {
      await handleMessage(update.message);
    }

    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error('Telegram webhook error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

async function handleMessage(message: TelegramUpdate['message']) {
  if (!message || !message.text) return;

  const chatId = message.chat.id;
  const text = message.text.trim();
  const telegramId = message.from.id.toString();
  const username = message.from.username;
  const firstName = message.from.first_name;

  // Handle commands
  if (text.startsWith('/')) {
    await handleCommand(chatId, text, telegramId, username, firstName);
    return;
  }

  // Check if user is linked
  const telegramUser = await getTelegramUser(telegramId);
  if (!telegramUser) {
    await sendMessage({
      chatId,
      text: '⚠️ Primero debes vincular tu cuenta.\n\nUsa el comando /start para comenzar.',
    });
    return;
  }

  // Parse natural language message
  await handleNaturalLanguageMessage(chatId, text, telegramUser.firebaseUid);
}

async function handleCommand(
  chatId: number,
  command: string,
  telegramId: string,
  username?: string,
  firstName?: string
) {
  const parts = command.split(' ');
  const cmd = parts[0].toLowerCase();
  const args = parts.slice(1);

  switch (cmd) {
    case '/start':
      await handleStartCommand(chatId, firstName);
      break;

    case '/ayuda':
    case '/help':
      await handleHelpCommand(chatId);
      break;

    case '/vincular':
    case '/link':
      if (args.length === 0) {
        await sendMessage({
          chatId,
          text: '⚠️ Debes proporcionar el código de vinculación.\n\nEjemplo: /vincular 123456',
        });
        return;
      }
      await handleLinkCommand(chatId, args[0], telegramId, username, firstName);
      break;

    case '/desvincular':
    case '/unlink':
      await handleUnlinkCommand(chatId, telegramId);
      break;

    case '/categorias':
    case '/categories':
      const user1 = await getTelegramUser(telegramId);
      if (!user1) {
        await sendMessage({
          chatId,
          text: '⚠️ Primero debes vincular tu cuenta. Usa /start',
        });
        return;
      }
      await handleCategoriesCommand(chatId, user1.firebaseUid);
      break;

    case '/metodos':
    case '/methods':
      const user2 = await getTelegramUser(telegramId);
      if (!user2) {
        await sendMessage({
          chatId,
          text: '⚠️ Primero debes vincular tu cuenta. Usa /start',
        });
        return;
      }
      await handlePaymentMethodsCommand(chatId, user2.firebaseUid);
      break;

    case '/resumen':
    case '/summary':
      const user3 = await getTelegramUser(telegramId);
      if (!user3) {
        await sendMessage({
          chatId,
          text: '⚠️ Primero debes vincular tu cuenta. Usa /start',
        });
        return;
      }
      await handleSummaryCommand(chatId, user3.firebaseUid);
      break;

    case '/cancelar':
    case '/cancel':
      await handleCancelCommand(chatId);
      break;

    default:
      await sendMessage({
        chatId,
        text: '❓ Comando no reconocido. Usa /ayuda para ver los comandos disponibles.',
      });
  }
}

async function handleLinkCommand(
  chatId: number,
  code: string,
  telegramId: string,
  username?: string,
  firstName?: string
) {
  const result = await linkTelegramAccount(code, telegramId, username, firstName);
  
  if (result.success) {
    await sendMessage({
      chatId,
      text: '✅ ¡Cuenta vinculada exitosamente!\n\nYa puedes empezar a agregar transacciones escribiendo en lenguaje natural.\n\nEjemplo: "Gasté 500 en comida"',
    });
  } else {
    await sendMessage({
      chatId,
      text: `❌ ${result.error || 'Error al vincular la cuenta'}`,
    });
  }
}

async function handleUnlinkCommand(chatId: number, telegramId: string) {
  const result = await unlinkTelegramAccount(telegramId);
  
  if (result.success) {
    await sendMessage({
      chatId,
      text: '✅ Cuenta desvinculada exitosamente.',
    });
  } else {
    await sendMessage({
      chatId,
      text: `❌ ${result.error || 'Error al desvincular la cuenta'}`,
    });
  }
}

async function handleNaturalLanguageMessage(
  chatId: number,
  text: string,
  userId: string
) {
  // Show typing indicator
  await sendMessage({
    chatId,
    text: '🤔 Procesando...',
  });

  const parsed = await parseTransactionMessage(text);

  if (!parsed || parsed.confidence < 0.3) {
    await sendMessage({
      chatId,
      text: '❓ No pude entender tu mensaje.\n\nIntenta ser más específico, por ejemplo:\n• "Gasté 500 en comida"\n• "Ingreso de 10000 por salario"\n\nUsa /ayuda para ver más ejemplos.',
    });
    return;
  }

  // If no category was detected, try to get a default or ask
  if (!parsed.category) {
    const categories = await getCategories(userId);
    const otherCategory = categories.find(c => c.name === 'Other' && c.isEnabled);
    if (otherCategory) {
      parsed.category = otherCategory.name;
    }
  }

  // If no payment method, try to get a default
  if (!parsed.paymentMethod) {
    const methods = await getPaymentMethods(userId);
    const cashMethod = methods.find(m => m.type === 'Cash' && m.isEnabled);
    if (cashMethod) {
      parsed.paymentMethod = cashMethod.name;
    }
  }

  // Store the pending transaction
  const pendingId = `${chatId}_${Date.now()}`;
  pendingTransactions.set(pendingId, parsed);

  // Show confirmation
  await showTransactionConfirmation(chatId, parsed, `confirm_${pendingId}`);
}

async function handleCallbackQuery(callbackQuery: TelegramUpdate['callback_query']) {
  if (!callbackQuery || !callbackQuery.data) return;

  const chatId = callbackQuery.message?.chat.id;
  if (!chatId) return;

  const telegramId = callbackQuery.from.id.toString();
  const data = callbackQuery.data;

  // Answer the callback query
  await answerCallbackQuery(callbackQuery.id);

  if (data === 'cancel') {
    await sendMessage({
      chatId,
      text: '❌ Transacción cancelada.',
    });
    return;
  }

  if (data.startsWith('confirm_')) {
    const pendingId = data.replace('confirm_', '');
    const transaction = pendingTransactions.get(pendingId);

    if (!transaction) {
      await sendMessage({
        chatId,
        text: '❌ Transacción expirada. Por favor intenta nuevamente.',
      });
      return;
    }

    // Get user
    const telegramUser = await getTelegramUser(telegramId);
    if (!telegramUser) {
      await sendMessage({
        chatId,
        text: '❌ Error: Usuario no vinculado.',
      });
      return;
    }

    // Get category ID
    const categories = await getCategories(telegramUser.firebaseUid);
    const category = categories.find(c => 
      c.name === transaction.category && c.isEnabled
    );

    if (!category) {
      await sendMessage({
        chatId,
        text: '❌ Error: Categoría no encontrada.',
      });
      return;
    }

    // Get payment method ID
    const methods = await getPaymentMethods(telegramUser.firebaseUid);
    const paymentMethod = methods.find(m => 
      m.name === transaction.paymentMethod && m.isEnabled
    );

    if (!paymentMethod) {
      await sendMessage({
        chatId,
        text: '❌ Error: Método de pago no encontrado.',
      });
      return;
    }

    // Create transaction
    const result = await addTransaction(
      {
        type: transaction.type,
        amount: transaction.amount,
        description: transaction.description,
        categoryId: category.id,
        paymentMethodId: paymentMethod.id,
        date: transaction.date || new Date(),
      },
      telegramUser.firebaseUid
    );

    if ('error' in result) {
      await sendMessage({
        chatId,
        text: `❌ Error al guardar la transacción: ${result.error}`,
      });
    } else {
      const typeEmoji = transaction.type === 'income' ? '💰' : '💸';
      await sendMessage({
        chatId,
        text: `${typeEmoji} ¡Transacción guardada exitosamente!\n\n💵 $${transaction.amount.toLocaleString('es-AR')}\n📝 ${transaction.description}`,
      });
    }

    // Clean up
    pendingTransactions.delete(pendingId);
  }
}
