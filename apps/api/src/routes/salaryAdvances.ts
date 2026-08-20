import { Router } from 'express';
import { sendSalaryAdvanceNotification } from '../telegramBot.js';

const router = Router();

// In-memory store (vì hệ thống dùng localStorage phía client là chủ yếu)
// API chỉ làm nhiệm vụ: gửi Telegram và relay duyệt/từ chối

// POST /api/salary-advances/request — nhân viên gửi đề xuất ứng lương
router.post('/request', async (req, res) => {
  console.log('[API] Received salary advance request:', req.body);
  try {
    const advance = req.body;
    // Gửi Telegram cho admin
    await sendSalaryAdvanceNotification(advance);
    console.log('[API] Successfully sent Telegram notification');
    res.json({ ok: true });
  } catch (error) {
    console.error('Error sending salary advance notification:', error);
    res.status(500).json({ error: 'Failed to send notification' });
  }
});

export const salaryAdvanceRouter = router;
