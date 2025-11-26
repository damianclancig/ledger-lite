/**
 * Edit Command Parser for Telegram Bot
 * Parses user messages to detect transaction edit commands
 */

export interface EditCommand {
  type: 'category' | 'paymentMethod' | 'amount' | 'description' | 'date' | 'none';
  value: string;
  confidence: number;
}

/**
 * Parse a message to detect if user wants to edit a pending transaction
 * @param text - User's message
 * @returns EditCommand or null if not an edit command
 */
export function parseEditCommand(text: string): EditCommand | null {
  if (!text) return null;

  const normalized = text.toLowerCase().trim();

  // Category changes
  // Examples: "cambia la categoría por comida", "categoría: comida", "categoria comida"
  if (
    normalized.includes('cambia la categoría') ||
    normalized.includes('cambia categoria') ||
    normalized.includes('cambiar categoría') ||
    normalized.includes('cambiar categoria') ||
    normalized.match(/categor[ií]a\s*[:]/i)
  ) {
    // Extract category name after "por", "a", or ":"
    const match = normalized.match(/(?:por|a|:)\s*(.+)/);
    if (match) {
      return {
        type: 'category',
        value: match[1].trim(),
        confidence: 0.9
      };
    }
  }

  // Payment method changes
  // Examples: "usé tarjeta lemon", "use débito", "con efectivo", "método de pago: cash"
  if (
    normalized.match(/us[eé]\s+/i) ||
    normalized.includes('con tarjeta') ||
    normalized.includes('con débito') ||
    normalized.includes('con debito') ||
    normalized.includes('con crédito') ||
    normalized.includes('con credito') ||
    normalized.includes('en efectivo') ||
    normalized.includes('método de pago') ||
    normalized.includes('metodo de pago') ||
    normalized.match(/m[eé]todo\s*[:]/i)
  ) {
    // Extract payment method
    let match = normalized.match(/us[eé]\s+(.+)/i);
    if (!match) {
      match = normalized.match(/con\s+(.+)/i);
    }
    if (!match) {
      match = normalized.match(/(?:método de pago|metodo de pago)\s*[:]\s*(.+)/i);
    }
    
    if (match) {
      return {
        type: 'paymentMethod',
        value: match[1].trim(),
        confidence: 0.85
      };
    }
  }

  // Amount changes
  // Examples: "cambia el monto a 3000", "eran 3000", "fueron 2500"
  if (
    normalized.includes('cambia el monto') ||
    normalized.includes('cambiar monto') ||
    normalized.match(/\beran\b/) ||
    normalized.match(/\bfueron\b/) ||
    normalized.match(/monto\s*[:]/i)
  ) {
    const match = normalized.match(/(\d+(?:[.,]\d+)?)/);
    if (match) {
      // Replace comma with dot for parsing
      const amount = match[1].replace(',', '.');
      return {
        type: 'amount',
        value: amount,
        confidence: 0.9
      };
    }
  }

  // Description changes
  // Examples: "cambia la descripción por yerba mate", "descripción: compra de ropa"
  if (
    normalized.includes('cambia la descripción') ||
    normalized.includes('cambia la descripcion') ||
    normalized.includes('cambiar descripción') ||
    normalized.includes('cambiar descripcion') ||
    normalized.match(/descripci[oó]n\s*[:]/i)
  ) {
    const match = normalized.match(/(?:por|a|:)\s*(.+)/);
    if (match) {
      return {
        type: 'description',
        value: match[1].trim(),
        confidence: 0.85
      };
    }
  }

  // Date changes
  // Examples: "cambia la fecha a ayer", "fecha: el lunes"
  if (
    normalized.includes('cambia la fecha') ||
    normalized.includes('cambiar fecha') ||
    normalized.match(/fecha\s*[:]/i)
  ) {
    const match = normalized.match(/(?:a|por|:)\s*(.+)/);
    if (match) {
      return {
        type: 'date',
        value: match[1].trim(),
        confidence: 0.8
      };
    }
  }

  // No edit command detected
  return {
    type: 'none',
    value: '',
    confidence: 0
  };
}

/**
 * Check if a message is likely an edit command (quick check)
 */
export function isLikelyEditCommand(text: string): boolean {
  if (!text) return false;
  
  const normalized = text.toLowerCase();
  
  const editKeywords = [
    'cambia',
    'cambiar',
    'usé',
    'use',
    'eran',
    'fueron',
    'categoría',
    'categoria',
    'método',
    'metodo',
    'monto',
    'descripción',
    'descripcion',
    'fecha'
  ];
  
  return editKeywords.some(keyword => normalized.includes(keyword));
}
