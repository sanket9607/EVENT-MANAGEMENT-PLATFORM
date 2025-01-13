const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');
const Event = require('../models/Event');
const { io } = require('../server');

const authMiddleware = (req, res, next) => {
  const token = req.header('Authorization')?.replace('Bearer ', '');
  if (!token) return res.status(401).json({ error: 'No token provided' });

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.userId = decoded.userId;
    next();
  } catch (error) {
    res.status(401).json({ error: 'Invalid token' });
  }
};

router.post('/', authMiddleware, async (req, res) => {
  try {
    const { name, description, date } = req.body;
    const event = new Event({ name, description, date, creator: req.userId });
    await event.save();
    res.status(201).json(event);
  } catch (error) {
    res.status(500).json({ error: 'Failed to create event' });
  }
});

router.get('/', authMiddleware, async (req, res) => {
  try {
    const events = await Event.find().sort({ date: 1 });
    res.json(events);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch events' });
  }
});

router.post('/:id/attend', authMiddleware, async (req, res) => {
  try {
    const event = await Event.findById(req.params.id);
    if (!event) return res.status(404).json({ error: 'Event not found' });
    
    event.attendees += 1;
    await event.save();
    
    io.emit('attendeeUpdate', { eventId: event._id, attendees: event.attendees });
    res.json({ message: 'Attendance recorded', attendees: event.attendees });
  } catch (error) {
    res.status(500).json({ error: 'Failed to record attendance' });
  }
});

module.exports = router;

