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

const transactionParserPrompt = `Eres un asistente experto en interpretar transacciones financieras en español argentino coloquial.

Tu tarea es extraer información de mensajes naturales sobre gastos e ingresos, siendo MUY FLEXIBLE con la forma en que el usuario escribe.

EXTRAE:
- type: "income" (ingreso) o "expense" (gasto)
- amount: monto numérico (acepta formatos como 2800, 2.800, $2800, etc)
- description: descripción breve y clara
- category: categoría sugerida (opcional)
- paymentMethod: método de pago (opcional)
- confidence: 0 a 1 (qué tan seguro estás)

CATEGORÍAS DISPONIBLES:
- Salary: salario, sueldo, pago de trabajo
- Groceries: supermercado, verdulería, almacén, dietética, carnicería
- Food: comida, restaurant, delivery, café, fast food
- Clothing: ropa, zapatillas, indumentaria
- Other: todo lo demás (luz, agua, gas, nafta, etc)
- Taxes: impuestos
- Savings: ahorros

MÉTODOS DE PAGO:
- Cash: efectivo, plata, cash
- Credit Card: tarjeta de crédito, crédito, tarjeta lemon, naranja, visa, mastercard
- Debit Card: débito, tarjeta de débito
- Bank Transfer: transferencia
- VirtualWallet: billetera virtual, mercadopago, ualá, brubank
- Other: otro

EJEMPLOS DE MENSAJES QUE DEBES ENTENDER:
1. "gasté 2800 en yerba" → expense, 2800, "yerba", Groceries
2. "ayer gasté 2800 en yerba en dietética con tarjeta lemon" → expense, 2800, "yerba en dietética", Groceries, Credit Card
3. "compré ropa por 5000" → expense, 5000, "ropa", Clothing
4. "500 de comida" → expense, 500, "comida", Food
5. "ingreso de 50000 por salario" → income, 50000, "salario", Salary
6. "pagué 3000 de luz en efectivo" → expense, 3000, "luz", Other, Cash
7. "transferí 10000" → expense, 10000, "transferencia", Other, Bank Transfer
8. "gaste 1500 supermercado" → expense, 1500, "supermercado", Groceries
9. "800 nafta con débito" → expense, 800, "nafta", Other, Debit Card
10. "compre yerba 2800" → expense, 2800, "yerba", Groceries

REGLAS IMPORTANTES:
- SÉ MUY FLEXIBLE: acepta cualquier orden de palabras
- NO requieras estructura perfecta
- Palabras como "gasté", "compré", "pagué" indican EXPENSE
- Palabras como "ingreso", "cobré", "recibí" indican INCOME
- Si no mencionan tipo, asume EXPENSE (es lo más común)
- Extrae el número aunque esté en cualquier parte del mensaje
- La descripción puede ser una sola palabra o varias
- Si mencionan una marca de tarjeta (lemon, naranja, visa), es Credit Card
- Si dicen "efectivo" o "cash", es Cash
- Si dicen "débito", es Debit Card
- Si dicen "transferencia", es Bank Transfer
- Si dicen "mercadopago", "ualá", "brubank", es VirtualWallet
- Confidence alto (0.8-1.0) si está claro, medio (0.5-0.7) si falta info, bajo (<0.5) si muy ambiguo
- SIEMPRE responde con JSON válido, nunca con texto explicativo

FORMATO DE RESPUESTA (SOLO JSON, SIN MARKDOWN):
{
  "type": "expense",
  "amount": 2800,
  "description": "yerba en dietética",
  "category": "Groceries",
  "paymentMethod": "Credit Card",
  "confidence": 0.9
}`;

/**
 * Parse a natural language message into transaction data
 */
export async function parseTransactionMessage(
  message: string
): Promise<ParsedTransaction | null> {
  try {
    console.log('=== NLP PARSING START ===');
    console.log('Input message:', message);
    
    // Use Gemini to parse the message
    const prompt = `${transactionParserPrompt}\n\nMensaje del usuario: "${message}"`;
    
    console.log('Calling Gemini API...');
    const result = await ai.generate({
      model: gemini15Flash,
      prompt,
      config: {
        temperature: 0.3, // Increased for more flexible parsing
        maxOutputTokens: 300,
      },
    });

    console.log('Gemini raw response:', result.text);
    
    const responseText = result.text.trim();
    
    // Remove markdown code blocks if present
    const jsonText = responseText
      .replace(/```json\n?/g, '')
      .replace(/```\n?/g, '')
      .trim();

    console.log('Cleaned JSON text:', jsonText);

    const parsed = JSON.parse(jsonText);
    console.log('Parsed object:', parsed);

    // Validate the parsed data
    if (!parsed.type || !parsed.amount || !parsed.description) {
      console.error('❌ Invalid parsed transaction - missing required fields:', parsed);
      console.error('Missing:', {
        type: !parsed.type,
        amount: !parsed.amount,
        description: !parsed.description,
      });
      return null;
    }

    // Ensure amount is positive
    const amount = Math.abs(Number(parsed.amount));
    if (isNaN(amount) || amount <= 0) {
      console.error('❌ Invalid amount:', parsed.amount);
      return null;
    }

    // Validate type
    const validTypes: TransactionType[] = ['income', 'expense', 'deposit', 'withdrawal', 'transfer'];
    if (!validTypes.includes(parsed.type)) {
      console.error('❌ Invalid transaction type:', parsed.type);
      return null;
    }

    const parsedTransaction = {
      type: parsed.type,
      amount,
      description: parsed.description,
      category: parsed.category,
      paymentMethod: parsed.paymentMethod,
      confidence: Number(parsed.confidence) || 0.5,
      date: new Date(), // Default to now
    };

    console.log('✅ Successfully parsed transaction:', parsedTransaction);
    console.log('=== NLP PARSING END ===');
    
    return parsedTransaction;
  } catch (error) {
    console.error('❌ ERROR parsing transaction message:');
    console.error('Error type:', error instanceof Error ? error.name : typeof error);
    console.error('Error message:', error instanceof Error ? error.message : String(error));
    console.error('Full error:', error);
    console.error('=== NLP PARSING FAILED ===');
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
