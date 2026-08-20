import { Router } from 'express';
import { PrismaClient } from '@prisma/client';
import { sendKaraboxCheckoutNotification } from '../src/telegramBot.js';

const router = Router();
const prisma = new PrismaClient();

// Get list of rooms
router.get('/rooms', async (req, res) => {
  try {
    const rooms = await prisma.karaboxRoom.findMany({
      orderBy: { name: 'asc' }
    });
    res.json(rooms);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch rooms' });
  }
});

// Create/Update a room
router.post('/rooms', async (req, res) => {
  try {
    const { id, name, status } = req.body;
    if (id) {
      const room = await prisma.karaboxRoom.update({
        where: { id },
        data: { name, status }
      });
      res.json(room);
    } else {
      const room = await prisma.karaboxRoom.create({
        data: { name, status: status || 'AVAILABLE' }
      });
      res.json(room);
    }
  } catch (error) {
    res.status(500).json({ error: 'Failed to save room' });
  }
});

// Delete a room
router.delete('/rooms/:id', async (req, res) => {
  try {
    await prisma.karaboxRoom.delete({ where: { id: req.params.id } });
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: 'Failed to delete room' });
  }
});

// Get active sessions
router.get('/sessions/active', async (req, res) => {
  try {
    const sessions = await prisma.karaboxSession.findMany({
      where: { status: 'PLAYING' }
    });
    res.json(sessions);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch active sessions' });
  }
});

// Start a session
router.post('/sessions/start', async (req, res) => {
  try {
    const { roomId, pricePerHour, startTime, startEmployee } = req.body;
    
    // Check if room is already playing
    const existing = await prisma.karaboxSession.findFirst({
      where: { roomId, status: 'PLAYING' }
    });
    if (existing) return res.status(400).json({ error: 'Room is already playing' });

    const session = await prisma.karaboxSession.create({
      data: {
        roomId,
        pricePerHour,
        startTime: startTime ? new Date(startTime) : new Date(),
        startEmployee,
        status: 'PLAYING'
      }
    });

    await prisma.karaboxRoom.update({
      where: { id: roomId },
      data: { status: 'IN_USE', currentSessionId: session.id }
    });

    res.json(session);
  } catch (error) {
    res.status(500).json({ error: 'Failed to start session' });
  }
});

// Checkout a session
router.post('/sessions/checkout', async (req, res) => {
  try {
    const { id, endTime, durationHours, roomTotal, surcharge, discount, totalAmount, paymentMethod, checkoutEmployee, notes, shiftId } = req.body;
    
    // Get room info first for the notification
    const currentSession = await prisma.karaboxSession.findUnique({ where: { id } });
    let roomName = 'PhĂ²ng';
    if (currentSession) {
      const room = await prisma.karaboxRoom.findUnique({ where: { id: currentSession.roomId } });
      if (room) roomName = room.name;
    }

    const session = await prisma.karaboxSession.update({
      where: { id },
      data: {
        endTime: new Date(endTime),
        durationHours,
        roomTotal,
        surcharge,
        discount,
        totalAmount,
        paymentMethod,
        checkoutEmployee,
        notes,
        shiftId,
        status: 'COMPLETED'
      }
    });

    // Free the room
    await prisma.karaboxRoom.update({
      where: { id: session.roomId },
      data: { status: 'AVAILABLE', currentSessionId: null }
    });

    // Send Telegram Notification asynchronously
    sendKaraboxCheckoutNotification(session, roomName).catch(console.error);

    res.json(session);
  } catch (error) {
    res.status(500).json({ error: 'Failed to checkout session' });
  }
});

// Get completed sessions for shift closing
router.get('/sessions/completed', async (req, res) => {
  try {
    const { from, to, employee } = req.query;
    if (!from || !to) return res.status(400).json({ error: 'Missing from/to dates' });

    const whereClause: any = {
      status: 'COMPLETED',
      endTime: {
        gte: new Date(from as string),
        lte: new Date(to as string)
      }
    };
    if (employee && employee !== 'all') {
      whereClause.checkoutEmployee = employee;
    }

    const sessions = await prisma.karaboxSession.findMany({
      where: whereClause,
      orderBy: { endTime: 'asc' }
    });
    
    res.json(sessions);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch completed sessions' });
  }
});

// Admin update session
router.put('/sessions/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { startTime, endTime, totalAmount, paymentMethod, notes } = req.body;

    const session = await prisma.karaboxSession.update({
      where: { id },
      data: {
        startTime: startTime ? new Date(startTime) : undefined,
        endTime: endTime ? new Date(endTime) : undefined,
        totalAmount,
        paymentMethod,
        notes
      }
    });
    res.json(session);
  } catch (error) {
    res.status(500).json({ error: 'Failed to update session' });
  }
});

// Admin delete session (mark as CANCELLED)
router.delete('/sessions/:id', async (req, res) => {
  try {
    const { id } = req.params;
    
    // Set status to CANCELLED and optionally reset totalAmount so it doesn't count in revenue
    const session = await prisma.karaboxSession.update({
      where: { id },
      data: {
        status: 'CANCELLED',
        totalAmount: 0 // Prevent it from counting in reports
      }
    });
    res.json(session);
  } catch (error) {
    res.status(500).json({ error: 'Failed to cancel session' });
  }
});

export default router;


