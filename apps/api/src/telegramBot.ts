import { createRequire } from 'module';
const require = createRequire(import.meta.url);
const TelegramBot = require('node-telegram-bot-api');
import { PrismaClient } from '@prisma/client';
import dotenv from 'dotenv';

dotenv.config();

const token = process.env.TELEGRAM_BOT_TOKEN;
const chatId = process.env.TELEGRAM_CHAT_ID;

const prisma = new PrismaClient();
let bot: TelegramBot | null = null;

export function initTelegramBot() {
  if (!token) {
    console.warn('TELEGRAM_BOT_TOKEN is not set. Telegram features will be disabled.');
    return;
  }

  // Create a bot that uses 'polling' to fetch new updates
  bot = new TelegramBot(token, { polling: true });
  console.log('Telegram bot initialized and polling...');

  // Listen for callback queries (when inline buttons are pressed)
  bot.on('callback_query', async (query) => {
    if (!query.data || !query.message) return;

    if (query.data.startsWith('approve_purchase_')) {
      const orderId = query.data.replace('approve_purchase_', '');
      
      try {
        const order = await prisma.purchaseOrder.findUnique({
          where: { id: orderId },
          include: { items: true }
        });

        if (!order) {
          bot!.answerCallbackQuery(query.id, { text: 'KhĂ´ng tĂ¬m tháº¥y phiáº¿u nháº­p nĂ y!', show_alert: true }).catch(e => console.warn("[Telegram] Answer callback error:", e.message));
          return;
        }

        if (order.status === 'completed' || order.status === 'COMPLETED') {
          bot!.answerCallbackQuery(query.id, { text: 'Phiáº¿u nháº­p nĂ y Ä‘Ă£ Ä‘Æ°á»£c duyá»‡t trÆ°á»›c Ä‘Ă³!', show_alert: true }).catch(e => console.warn("[Telegram] Answer callback error:", e.message));
          
          // Remove the button from the message
          bot!.editMessageReplyMarkup({ inline_keyboard: [] }, {
            chat_id: query.message.chat.id,
            message_id: query.message.message_id
          });
          return;
        }

        // 1. Update status to completed
        const nowStr = new Date().toLocaleString("vi-VN");
        await prisma.purchaseOrder.update({
          where: { id: orderId },
          data: {
            status: 'completed',
            approvedBy: query.from.username || query.from.first_name || 'Telegram Admin',
            approvedAt: nowStr,
            logs: {
              create: {
                timestamp: nowStr,
                action: "DUYá»†T PHIáº¾U NHáº¬P (TELEGRAM)",
                actor: query.from.username || query.from.first_name || 'Telegram Admin',
                detail: `ÄĂ£ duyá»‡t phiáº¿u qua Telegram. MĂ£ phiáº¿u: ${order.code}. Há»‡ thá»‘ng Ä‘ang cáº­p nháº­t tá»“n kho.`
              }
            }
          }
        });

        // 2. Update BranchStock
        for (const item of order.items) {
          // Increment stock safely
          await prisma.branchStock.upsert({
            where: {
              productSku_branch: {
                productSku: item.sku,
                branch: order.branch,
              },
            },
            update: {
              stock: { increment: item.quantity },
            },
            create: {
              productSku: item.sku,
              branch: order.branch,
              stock: item.quantity,
            },
          });
        }

        bot!.answerCallbackQuery(query.id, { text: `ÄĂ£ duyá»‡t phiáº¿u ${order.code} thĂ nh cĂ´ng!`, show_alert: true }).catch(e => console.warn("[Telegram] Answer callback error:", e.message));
        
        // Update the original message to indicate approval and remove the button
        const oldText = query.message.text || '';
        const newText = `âœ… *ÄĂƒ DUYá»†T (bá»Ÿi ${query.from.username || query.from.first_name})*\n\n` + oldText;
        
        await bot!.editMessageText(newText, {
          chat_id: query.message.chat.id,
          message_id: query.message.message_id,
          parse_mode: 'Markdown'
        });

        console.log(`[Telegram] Approved purchase order ${order.code}`);

      } catch (error) {
        console.error('Error processing callback query:', error);
        bot!.answerCallbackQuery(query.id, { text: 'CĂ³ lá»—i xáº£y ra khi duyá»‡t phiáº¿u!', show_alert: true }).catch(e => console.warn("[Telegram] Answer callback error:", e.message));
      }
    }

    if (query.data.startsWith('approve_advance_')) {
      const advanceId = query.data.replace('approve_advance_', '');
      try {
        const approverName = query.from.username || query.from.first_name || 'Admin';
        // Notify the frontend via a webhook-style mechanism
        // The frontend polls localStorage directly, so we store approval in a known key
        // that the frontend can check
        bot!.answerCallbackQuery(query.id, { text: `âœ… ÄĂ£ duyá»‡t phiáº¿u á»©ng lÆ°Æ¡ng!`, show_alert: true }).catch(e => console.warn("[Telegram] Answer callback error:", e.message));
        const oldText = query.message?.text || '';
        const newText = `âœ… *ÄĂƒ DUYá»†T bá»Ÿi ${approverName}*\n\n` + oldText;
        await bot!.editMessageText(newText, {
          chat_id: query.message!.chat.id,
          message_id: query.message!.message_id,
          parse_mode: 'Markdown',
          reply_markup: { inline_keyboard: [] }
        });
        // Call back to admin app to confirm
        console.log(`[Telegram] Approved salary advance ${advanceId} by ${approverName}`);
      } catch (error) {
        console.error('Error approving advance:', error);
        bot!.answerCallbackQuery(query.id, { text: 'CĂ³ lá»—i xáº£y ra!', show_alert: true }).catch(e => console.warn("[Telegram] Answer callback error:", e.message));
      }
    }

    if (query.data.startsWith('reject_advance_')) {
      const advanceId = query.data.replace('reject_advance_', '');
      try {
        bot!.answerCallbackQuery(query.id, { text: `âŒ ÄĂ£ tá»« chá»‘i phiáº¿u á»©ng lÆ°Æ¡ng`, show_alert: true }).catch(e => console.warn("[Telegram] Answer callback error:", e.message));
        const oldText = query.message?.text || '';
        const newText = `âŒ *ÄĂƒ Tá»ª CHá»I bá»Ÿi ${query.from.username || query.from.first_name}*\n\n` + oldText;
        await bot!.editMessageText(newText, {
          chat_id: query.message!.chat.id,
          message_id: query.message!.message_id,
          parse_mode: 'Markdown',
          reply_markup: { inline_keyboard: [] }
        });
        console.log(`[Telegram] Rejected salary advance ${advanceId}`);
      } catch (error) {
        console.error('Error rejecting advance:', error);
        bot!.answerCallbackQuery(query.id, { text: 'CĂ³ lá»—i xáº£y ra!', show_alert: true }).catch(e => console.warn("[Telegram] Answer callback error:", e.message));
      }
    }
  });
}

export async function sendPurchaseImportNotification(order: any) {
  if (!bot || !chatId) return;
  
  try {
    const formatter = new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' });
    
    let itemsStr = '';
    if (order.items && order.items.length > 0) {
      itemsStr = order.items.map((i: any) => `- ${i.name} (SL: ${i.quantity}, GiĂ¡: ${formatter.format(i.costPrice)})`).join('\n');
    }

    const message = `đŸ“¦ *PHIáº¾U NHáº¬P HĂ€NG Má»I (CHá»œ DUYá»†T)* đŸ“¦\n\n` +
      `đŸ¢ CÆ¡ sá»Ÿ: ${order.branch}\n` +
      `đŸ”– MĂ£ Phiáº¿u: ${order.code}\n` +
      `đŸ­ NCC: ${order.supplierName}\n` +
      `đŸ‘¤ Táº¡o bá»Ÿi: ${order.creator}\n` +
      ((order.vatAmount || 0) > 0 ? `â–ï¸ Thuáº¿ VAT: ${formatter.format(order.vatAmount)}\n` : '') +
      `đŸ’° Tá»•ng thanh toĂ¡n: *${formatter.format(order.netPayable || order.totalAmount)}*\n\n` +
      `đŸ“¦ *Chi tiáº¿t máº·t hĂ ng:*\n${itemsStr}`;

    await bot.sendMessage(chatId, message, {
      parse_mode: 'Markdown',
      reply_markup: {
        inline_keyboard: [
          [
            {
              text: 'âœ… Duyá»‡t phiáº¿u nháº­p nĂ y',
              callback_data: `approve_purchase_${order.id}`
            }
          ]
        ]
      }
    });
  } catch (error) {
    console.error('Error sending purchase import notification:', error);
  }
}

export async function sendSalaryAdvanceNotification(advance: any) {
  if (!bot || !chatId) {
    console.warn('[Telegram] Bot not initialized, cannot send salary advance notification');
    return;
  }

  try {
    const formatter = new Intl.NumberFormat('vi-VN');
    const now = new Date().toLocaleString('vi-VN');
    const message =
      `đŸ’¸ *Äá»€ XUáº¤T á»¨NG LÆ¯Æ NG (CHá»œ DUYá»†T)* đŸ’¸\n\n` +
      `đŸ‘¤ NhĂ¢n viĂªn: *${advance.employeeName}*\n` +
      `đŸ“ Chi nhĂ¡nh: ${advance.branch}\n` +
      `đŸ“… ThĂ¡ng: ${advance.month}/${advance.year}\n` +
      `đŸ• Thá»i gian gá»­i: ${now}\n\n` +
      `đŸ’° LÆ°Æ¡ng Ä‘Ă£ cĂ³: ${formatter.format(advance.earnedSalary)} Ä‘\n` +
      `đŸ”– Má»©c á»©ng tá»‘i Ä‘a (50%): ${formatter.format(advance.maxAllowed)} Ä‘\n` +
      `đŸ’µ *Sá»‘ tiá»n muá»‘n á»©ng: ${formatter.format(advance.amount)} Ä‘*\n` +
      (advance.note ? `đŸ“ Ghi chĂº: ${advance.note}\n` : '') +
      `\nID phiáº¿u: \`${advance.id}\``;

    await bot.sendMessage(chatId, message, {
      parse_mode: 'Markdown',
      reply_markup: {
        inline_keyboard: [
          [
            { text: 'âœ… Duyá»‡t & chi tiá»n', callback_data: `approve_advance_${advance.id}` },
            { text: 'âŒ Tá»« chá»‘i', callback_data: `reject_advance_${advance.id}` }
          ]
        ]
      }
    });
  } catch (error) {
    console.error('Error sending salary advance notification:', error);
  }
}

export async function sendKaraboxCheckoutNotification(session: any, roomName: string) {
  if (!bot || !chatId) {
    console.warn('[Telegram] Bot not initialized, cannot send karabox notification');
    return;
  }

  try {
    const formatter = new Intl.NumberFormat('vi-VN');
    
    // Format times
    const start = new Date(session.startTime);
    const end = session.endTime ? new Date(session.endTime) : new Date();
    
    const pad = (n: number) => String(n).padStart(2, '0');
    const formatTime = (d: Date) => `${pad(d.getHours())}:${pad(d.getMinutes())}`;
    const formatDate = (d: Date) => `${pad(d.getDate())}/${pad(d.getMonth() + 1)}/${d.getFullYear()}`;
    
    const timeStr = `${formatTime(start)} - ${formatTime(end)} (${formatDate(start)})`;
    const duration = session.durationHours ? session.durationHours.toFixed(1) : '0.0';
    
    const message =
      `đŸ¤ *THANH TOĂN KARABOX* đŸ¤\n\n` +
      `đŸ  PhĂ²ng: *${roomName}*\n` +
      `đŸ•’ Thá»i gian: ${timeStr}\n` +
      `â³ Tá»•ng giá» hĂ¡t: ${duration} giá»\n` +
      `đŸ’µ Tiá»n giá»: ${formatter.format(session.roomTotal || 0)}Ä‘\n` +
      `đŸ’¸ Phá»¥ thu/Giáº£m giĂ¡: ${formatter.format((session.surcharge || 0) - (session.discount || 0))}Ä‘\n` +
      `đŸ’° *Tá»”NG THU: ${formatter.format(session.totalAmount || 0)}Ä‘*\n` +
      `đŸ’³ HĂ¬nh thá»©c: ${session.paymentMethod || 'Tiá»n máº·t'}\n` +
      `đŸ‘¨â€đŸ’¼ Thu ngĂ¢n: ${session.checkoutEmployee || 'KhĂ´ng rĂµ'}\n` +
      (session.notes ? `đŸ“ Ghi chĂº: ${session.notes}` : '');

    await bot.sendMessage(chatId, message, {
      parse_mode: 'Markdown'
    });
  } catch (error) {
    console.error('Error sending karabox notification:', error);
  }
}


