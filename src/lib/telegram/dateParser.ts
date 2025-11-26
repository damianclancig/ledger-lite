/**
 * Date Parser for Natural Language Expressions in Spanish (Argentina)
 * Parses date expressions like "hoy", "ayer", "el lunes", "hace 3 días", etc.
 */

/**
 * Parse a natural language date expression in Spanish
 * @param text - The date expression to parse
 * @param referenceDate - Optional reference date (defaults to now)
 * @returns Parsed Date object or null if cannot parse
 */
export function parseDateExpression(text: string, referenceDate?: Date): Date | null {
  if (!text) return null;

  const normalized = text.toLowerCase().trim();
  const reference = referenceDate || new Date();

  // Set time to 00:00:00 for consistent date comparison
  const getDateAtMidnight = (date: Date): Date => {
    const result = new Date(date);
    result.setHours(0, 0, 0, 0);
    return result;
  };

  // Today
  if (normalized === 'hoy') {
    return getDateAtMidnight(reference);
  }

  // Yesterday
  if (normalized === 'ayer') {
    const date = new Date(reference);
    date.setDate(date.getDate() - 1);
    return getDateAtMidnight(date);
  }

  // Day before yesterday
  if (normalized === 'anteayer' || normalized === 'antier') {
    const date = new Date(reference);
    date.setDate(date.getDate() - 2);
    return getDateAtMidnight(date);
  }

  // Days of the week (search backwards up to 7 days)
  const daysOfWeek: Record<string, number> = {
    'domingo': 0,
    'lunes': 1,
    'martes': 2,
    'miércoles': 3,
    'miercoles': 3, // without accent
    'jueves': 4,
    'viernes': 5,
    'sábado': 6,
    'sabado': 6, // without accent
  };

  // Match "el lunes", "el martes", etc.
  const dayOfWeekMatch = normalized.match(/(?:el\s+)?(\w+)/);
  if (dayOfWeekMatch) {
    const dayName = dayOfWeekMatch[1];
    const targetDay = daysOfWeek[dayName];
    
    if (targetDay !== undefined) {
      const result = new Date(reference);
      const currentDay = result.getDay();
      
      // Calculate days to go back
      let daysBack = currentDay - targetDay;
      if (daysBack <= 0) {
        daysBack += 7; // Go to previous week
      }
      
      result.setDate(result.getDate() - daysBack);
      return getDateAtMidnight(result);
    }
  }

  // Day of the month: "el 15", "el día 20", "día 25"
  const dayOfMonthMatch = normalized.match(/(?:el\s+)?(?:día\s+)?(\d{1,2})/);
  if (dayOfMonthMatch) {
    const day = parseInt(dayOfMonthMatch[1], 10);
    
    if (day >= 1 && day <= 31) {
      const result = new Date(reference);
      result.setDate(day);
      
      // If the day has already passed this month, use previous month
      if (result > reference) {
        result.setMonth(result.getMonth() - 1);
      }
      
      return getDateAtMidnight(result);
    }
  }

  // Relative expressions: "hace X días", "hace X semanas"
  const relativeMatch = normalized.match(/hace\s+(\d+|una?|un)\s+(día|días|dia|dias|semana|semanas)/);
  if (relativeMatch) {
    const amountStr = relativeMatch[1];
    const unit = relativeMatch[2];
    
    // Parse amount
    let amount = 1;
    if (amountStr === 'un' || amountStr === 'una') {
      amount = 1;
    } else {
      amount = parseInt(amountStr, 10);
    }
    
    if (isNaN(amount)) return null;
    
    const result = new Date(reference);
    
    // Calculate days to subtract
    if (unit.startsWith('día') || unit.startsWith('dia')) {
      result.setDate(result.getDate() - amount);
    } else if (unit.startsWith('semana')) {
      result.setDate(result.getDate() - (amount * 7));
    }
    
    return getDateAtMidnight(result);
  }

  // Could not parse
  return null;
}

/**
 * Format a date for display in Spanish (Argentina)
 * Shows "Hoy", "Ayer", or "Día DD/MM"
 */
export function formatDateForDisplay(date: Date): string {
  const today = new Date();
  const yesterday = new Date(today);
  yesterday.setDate(yesterday.getDate() - 1);
  
  // Reset hours for comparison
  const dateOnly = new Date(date.getFullYear(), date.getMonth(), date.getDate());
  const todayOnly = new Date(today.getFullYear(), today.getMonth(), today.getDate());
  const yesterdayOnly = new Date(yesterday.getFullYear(), yesterday.getMonth(), yesterday.getDate());
  
  if (dateOnly.getTime() === todayOnly.getTime()) {
    return 'Hoy';
  } else if (dateOnly.getTime() === yesterdayOnly.getTime()) {
    return `Ayer (${date.getDate()}/${date.getMonth() + 1})`;
  } else {
    const dayNames = ['Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado'];
    const dayName = dayNames[date.getDay()];
    return `${dayName} ${date.getDate()}/${date.getMonth() + 1}`;
  }
}
