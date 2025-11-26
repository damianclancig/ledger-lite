# Bot de Telegram - FinanClan

Bot de Telegram integrado con FinanClan que permite agregar transacciones usando lenguaje natural.

## Características

- 🤖 **Lenguaje Natural**: Escribe "Gasté 500 en comida" y el bot lo entiende
- 🧠 **IA con Gemini**: Procesamiento inteligente de mensajes
- ✅ **Confirmación**: El bot siempre pide confirmación antes de guardar
- 📊 **Comandos útiles**: Ver resúmenes, categorías, métodos de pago
- 🔒 **Seguro**: Vinculación de cuenta con código temporal

## Comandos Disponibles

- `/start` - Iniciar el bot y ver instrucciones
- `/vincular CODIGO` - Vincular tu cuenta de FinanClan
- `/ayuda` - Ver todos los comandos disponibles
- `/categorias` - Listar categorías disponibles
- `/metodos` - Listar métodos de pago
- `/resumen` - Ver resumen del día/mes actual
- `/desvincular` - Desvincular tu cuenta
- `/cancelar` - Cancelar operación actual

## Uso

### 1. Vincular tu cuenta

1. Ve a la configuración en la web de FinanClan
2. Genera un código de vinculación
3. Abre el bot en Telegram: [@financlan_bot](https://t.me/financlan_bot)
4. Escribe: `/vincular CODIGO`

### 2. Agregar transacciones

Simplemente escribe en lenguaje natural:

**Ejemplos:**

- "Gasté 1500 en supermercado"
- "Compré ropa por 3000"
- "Ingreso de 50000 por salario"
- "500 de comida en mcdonalds"
- "Pagué 2000 de luz"

El bot:

1. Interpretará tu mensaje usando IA
2. Te mostrará la transacción detectada
3. Te pedirá confirmación
4. Guardará la transacción en tu cuenta

## Arquitectura

```
Usuario (Telegram)
    ↓
Telegram Bot API
    ↓
Webhook (/api/telegram)
    ↓
Gemini AI (interpreta mensaje)
    ↓
Server Actions (addTransaction)
    ↓
MongoDB
```

## Archivos del Proyecto

- `src/app/api/telegram/route.ts` - Webhook principal
- `src/app/api/telegram/link/route.ts` - Generación de códigos
- `src/lib/telegram/bot.ts` - Cliente de Telegram API
- `src/lib/telegram/nlp.ts` - Procesamiento con Gemini
- `src/lib/telegram/commands.ts` - Handlers de comandos
- `src/lib/telegram/userMapping.ts` - Vinculación de usuarios
- `src/components/telegram/TelegramLinkingCard.tsx` - UI de vinculación

## Variables de Entorno

```bash
# Telegram Bot
TELEGRAM_BOT_TOKEN="tu_token_de_botfather"
TELEGRAM_WEBHOOK_SECRET="un_secreto_aleatorio"

# Gemini API (ya configurado en el proyecto)
GEMINI_API_KEY="tu_api_key"
```

## Configuración del Webhook

El webhook se configura automáticamente en producción. Para desarrollo local, usa ngrok:

```bash
# Terminal 1: Iniciar ngrok
ngrok http 9003

# Terminal 2: Configurar webhook
curl -X POST https://api.telegram.org/bot<TOKEN>/setWebhook \
  -H "Content-Type: application/json" \
  -d '{"url": "https://tu-url.ngrok.io/api/telegram"}'
```

## Costos

- **Telegram Bot API**: Gratis ✅
- **Gemini API**: Gratis hasta 1500 requests/día ✅
- **Total**: $0/mes 🎉

## Seguridad

- Verificación de webhook con secret token
- Solo usuarios vinculados pueden agregar transacciones
- Códigos de vinculación expiran en 10 minutos
- Cada usuario solo ve sus propias transacciones

## Limitaciones

- El bot procesa un mensaje a la vez
- Gemini API tiene límite de 1500 requests/día (gratis)
- Los códigos de vinculación expiran en 10 minutos
- No soporta imágenes ni archivos (solo texto)

## Próximas Mejoras

- [ ] Soporte para fotos de tickets (OCR)
- [ ] Notificaciones diarias de gastos
- [ ] Gráficos en imagen
- [ ] Recordatorios de pagos recurrentes
- [ ] Detección de ubicación para categorización automática
