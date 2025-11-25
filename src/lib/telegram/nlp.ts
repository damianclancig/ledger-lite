import { genkit } from 'genkit';
import { googleAI, gemini15Flash } from '@genkit-ai/googleai';
import type { ParsedTransaction, TransactionType } from '@/types';

/**
 * Natural Language Processing for Telegram messages
 * Uses Gemini AI to parse transaction information from natural language
 */

// Initialize Genkit with Google AI
const ai = genkit({
  plugins: [googleAI()],
});

const transactionParserPrompt = `Eres un asistente que ayuda a extraer información de transacciones financieras de mensajes en lenguaje natural en español.

Tu tarea es analizar el mensaje del usuario y extraer:
- type: "income" o "expense" (ingreso o gasto)
- amount: el monto numérico
- description: descripción de la transacción
- category: categoría sugerida (opcional)
- paymentMethod: método de pago sugerido (opcional)
- confidence: un número entre 0 y 1 indicando qué tan seguro estás de la interpretación

Categorías disponibles: Salary, Groceries, Food, Clothing, Other, Taxes, Savings

Métodos de pago disponibles: Cash, Credit Card, Debit Card, Bank Transfer, VirtualWallet, Other

Ejemplos:
- "Gasté 1500 en supermercado" → type: expense, amount: 1500, description: "supermercado", category: "Groceries"
- "Compré ropa por 3000" → type: expense, amount: 3000, description: "ropa", category: "Clothing"
- "Ingreso de 50000 por salario" → type: income, amount: 50000, description: "salario", category: "Salary"
- "500 de comida en mcdonalds" → type: expense, amount: 500, description: "comida en mcdonalds", category: "Food"
- "Pagué 2000 de luz" → type: expense, amount: 2000, description: "luz", category: "Other"

IMPORTANTE: 
- Si no estás seguro de algo, déjalo como undefined
- Si el mensaje no parece una transacción, confidence debe ser bajo (< 0.3)
- Siempre responde en formato JSON válido
- Los montos deben ser números positivos
- La descripción debe ser concisa pero descriptiva

Responde SOLO con un objeto JSON con esta estructura:
{
  "type": "income" | "expense",
  "amount": number,
  "description": string,
  "category": string | undefined,
  "paymentMethod": string | undefined,
  "confidence": number
}`;

/**
 * Parse a natural language message into transaction data
 */
export async function parseTransactionMessage(
  message: string
): Promise<ParsedTransaction | null> {
  try {
    // Use Gemini to parse the message
    const prompt = `${transactionParserPrompt}\n\nMensaje del usuario: "${message}"`;

    const result = await ai.generate({
      model: gemini15Flash,
      prompt,
      config: {
        temperature: 0.1, // Low temperature for more consistent parsing
        maxOutputTokens: 200,
      },
    });

    const responseText = result.text.trim();
    
    // Remove markdown code blocks if present
    const jsonText = responseText
      .replace(/```json\n?/g, '')
      .replace(/```\n?/g, '')
      .trim();

    const parsed = JSON.parse(jsonText);

    // Validate the parsed data
    if (!parsed.type || !parsed.amount || !parsed.description) {
      console.error('Invalid parsed transaction:', parsed);
      return null;
    }

    // Ensure amount is positive
    const amount = Math.abs(Number(parsed.amount));
    if (isNaN(amount) || amount <= 0) {
      console.error('Invalid amount:', parsed.amount);
      return null;
    }

    // Validate type
    const validTypes: TransactionType[] = ['income', 'expense', 'deposit', 'withdrawal', 'transfer'];
    if (!validTypes.includes(parsed.type)) {
      console.error('Invalid transaction type:', parsed.type);
      return null;
    }

    return {
      type: parsed.type,
      amount,
      description: parsed.description,
      category: parsed.category,
      paymentMethod: parsed.paymentMethod,
      confidence: Number(parsed.confidence) || 0.5,
      date: new Date(), // Default to now
    };
  } catch (error) {
    console.error('Error parsing transaction message:', error);
    return null;
  }
}

/**
 * Format a parsed transaction for user confirmation
 */
export function formatTransactionForConfirmation(
  transaction: ParsedTransaction
): string {
  const typeEmoji = transaction.type === 'income' ? '💰' : '💸';
  const typeText = transaction.type === 'income' ? 'Ingreso' : 'Gasto';
  
  let message = `${typeEmoji} *${typeText}*\n\n`;
  message += `💵 Monto: $${transaction.amount.toLocaleString('es-AR')}\n`;
  message += `📝 Descripción: ${transaction.description}\n`;
  
  if (transaction.category) {
    message += `🏷️ Categoría: ${transaction.category}\n`;
  }
  
  if (transaction.paymentMethod) {
    message += `💳 Método de pago: ${transaction.paymentMethod}\n`;
  }
  
  const confidencePercent = Math.round(transaction.confidence * 100);
  if (transaction.confidence < 0.7) {
    message += `\n⚠️ Confianza: ${confidencePercent}% - Por favor verifica los datos\n`;
  }
  
  message += `\n¿Confirmas esta transacción?`;
  
  return message;
}

/**
 * Suggest category based on description keywords
 */
export function suggestCategory(description: string): string {
  const lowerDesc = description.toLowerCase();
  
  const categoryKeywords: Record<string, string[]> = {
    'Groceries': ['supermercado', 'verdulería', 'carnicería', 'almacén', 'mercado'],
    'Food': ['comida', 'restaurant', 'delivery', 'pizza', 'burger', 'mcdonalds', 'café'],
    'Clothing': ['ropa', 'zapatillas', 'zapatos', 'remera', 'pantalón'],
    'Salary': ['salario', 'sueldo', 'pago'],
    'Taxes': ['impuesto', 'luz', 'agua', 'gas', 'internet', 'cable'],
  };
  
  for (const [category, keywords] of Object.entries(categoryKeywords)) {
    if (keywords.some(keyword => lowerDesc.includes(keyword))) {
      return category;
    }
  }
  
  return 'Other';
}
