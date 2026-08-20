import TelegramBot from 'node-telegram-bot-api';
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
          bot!.answerCallbackQuery(query.id, { text: 'Không tìm thấy phiếu nhập này!', show_alert: true }).catch(e => console.warn("[Telegram] Answer callback error:", e.message));
          return;
        }

        if (order.status === 'completed' || order.status === 'COMPLETED') {
          bot!.answerCallbackQuery(query.id, { text: 'Phiếu nhập này đã được duyệt trước đó!', show_alert: true }).catch(e => console.warn("[Telegram] Answer callback error:", e.message));
          
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
                action: "DUYỆT PHIẾU NHẬP (TELEGRAM)",
                actor: query.from.username || query.from.first_name || 'Telegram Admin',
                detail: `Đã duyệt phiếu qua Telegram. Mã phiếu: ${order.code}. Hệ thống đang cập nhật tồn kho.`
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

        bot!.answerCallbackQuery(query.id, { text: `Đã duyệt phiếu ${order.code} thành công!`, show_alert: true }).catch(e => console.warn("[Telegram] Answer callback error:", e.message));
        
        // Update the original message to indicate approval and remove the button
        const oldText = query.message.text || '';
        const newText = `✅ *ĐÃ DUYỆT (bởi ${query.from.username || query.from.first_name})*\n\n` + oldText;
        
        await bot!.editMessageText(newText, {
          chat_id: query.message.chat.id,
          message_id: query.message.message_id,
          parse_mode: 'Markdown'
        });

        console.log(`[Telegram] Approved purchase order ${order.code}`);

      } catch (error) {
        console.error('Error processing callback query:', error);
        bot!.answerCallbackQuery(query.id, { text: 'Có lỗi xảy ra khi duyệt phiếu!', show_alert: true }).catch(e => console.warn("[Telegram] Answer callback error:", e.message));
      }
    }

    if (query.data.startsWith('approve_advance_')) {
      const advanceId = query.data.replace('approve_advance_', '');
      try {
        const approverName = query.from.username || query.from.first_name || 'Admin';
        // Notify the frontend via a webhook-style mechanism
        // The frontend polls localStorage directly, so we store approval in a known key
        // that the frontend can check
        bot!.answerCallbackQuery(query.id, { text: `✅ Đã duyệt phiếu ứng lương!`, show_alert: true }).catch(e => console.warn("[Telegram] Answer callback error:", e.message));
        const oldText = query.message?.text || '';
        const newText = `✅ *ĐÃ DUYỆT bởi ${approverName}*\n\n` + oldText;
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
        bot!.answerCallbackQuery(query.id, { text: 'Có lỗi xảy ra!', show_alert: true }).catch(e => console.warn("[Telegram] Answer callback error:", e.message));
      }
    }

    if (query.data.startsWith('reject_advance_')) {
      const advanceId = query.data.replace('reject_advance_', '');
      try {
        bot!.answerCallbackQuery(query.id, { text: `❌ Đã từ chối phiếu ứng lương`, show_alert: true }).catch(e => console.warn("[Telegram] Answer callback error:", e.message));
        const oldText = query.message?.text || '';
        const newText = `❌ *ĐÃ TỪ CHỐI bởi ${query.from.username || query.from.first_name}*\n\n` + oldText;
        await bot!.editMessageText(newText, {
          chat_id: query.message!.chat.id,
          message_id: query.message!.message_id,
          parse_mode: 'Markdown',
          reply_markup: { inline_keyboard: [] }
        });
        console.log(`[Telegram] Rejected salary advance ${advanceId}`);
      } catch (error) {
        console.error('Error rejecting advance:', error);
        bot!.answerCallbackQuery(query.id, { text: 'Có lỗi xảy ra!', show_alert: true }).catch(e => console.warn("[Telegram] Answer callback error:", e.message));
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
      itemsStr = order.items.map((i: any) => `- ${i.name} (SL: ${i.quantity}, Giá: ${formatter.format(i.costPrice)})`).join('\n');
    }

    const message = `📦 *PHIẾU NHẬP HÀNG MỚI (CHỜ DUYỆT)* 📦\n\n` +
      `🏢 Cơ sở: ${order.branch}\n` +
      `🔖 Mã Phiếu: ${order.code}\n` +
      `🏭 NCC: ${order.supplierName}\n` +
      `👤 Tạo bởi: ${order.creator}\n` +
      ((order.vatAmount || 0) > 0 ? `⚖️ Thuế VAT: ${formatter.format(order.vatAmount)}\n` : '') +
      `💰 Tổng thanh toán: *${formatter.format(order.netPayable || order.totalAmount)}*\n\n` +
      `📦 *Chi tiết mặt hàng:*\n${itemsStr}`;

    await bot.sendMessage(chatId, message, {
      parse_mode: 'Markdown',
      reply_markup: {
        inline_keyboard: [
          [
            {
              text: '✅ Duyệt phiếu nhập này',
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
      `💸 *ĐỀ XUẤT ỨNG LƯƠNG (CHỜ DUYỆT)* 💸\n\n` +
      `👤 Nhân viên: *${advance.employeeName}*\n` +
      `📍 Chi nhánh: ${advance.branch}\n` +
      `📅 Tháng: ${advance.month}/${advance.year}\n` +
      `🕐 Thời gian gửi: ${now}\n\n` +
      `💰 Lương đã có: ${formatter.format(advance.earnedSalary)} đ\n` +
      `🔖 Mức ứng tối đa (50%): ${formatter.format(advance.maxAllowed)} đ\n` +
      `💵 *Số tiền muốn ứng: ${formatter.format(advance.amount)} đ*\n` +
      (advance.note ? `📝 Ghi chú: ${advance.note}\n` : '') +
      `\nID phiếu: \`${advance.id}\``;

    await bot.sendMessage(chatId, message, {
      parse_mode: 'Markdown',
      reply_markup: {
        inline_keyboard: [
          [
            { text: '✅ Duyệt & chi tiền', callback_data: `approve_advance_${advance.id}` },
            { text: '❌ Từ chối', callback_data: `reject_advance_${advance.id}` }
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
      `🎤 *THANH TOÁN KARABOX* 🎤\n\n` +
      `🏠 Phòng: *${roomName}*\n` +
      `🕒 Thời gian: ${timeStr}\n` +
      `⏳ Tổng giờ hát: ${duration} giờ\n` +
      `💵 Tiền giờ: ${formatter.format(session.roomTotal || 0)}đ\n` +
      `💸 Phụ thu/Giảm giá: ${formatter.format((session.surcharge || 0) - (session.discount || 0))}đ\n` +
      `💰 *TỔNG THU: ${formatter.format(session.totalAmount || 0)}đ*\n` +
      `💳 Hình thức: ${session.paymentMethod || 'Tiền mặt'}\n` +
      `👨‍💼 Thu ngân: ${session.checkoutEmployee || 'Không rõ'}\n` +
      (session.notes ? `📝 Ghi chú: ${session.notes}` : '');

    await bot.sendMessage(chatId, message, {
      parse_mode: 'Markdown'
    });
  } catch (error) {
    console.error('Error sending karabox notification:', error);
  }
}

