const express = require('express');
const router = express.Router();
const chatModel = require('../models/chat');

router.get('/chat/:roomId', async (req, res) => {
  try {
    const messages = await chatModel
      .find({ room: req.params.roomId })
      .sort({ sentAt: 1 }); // oldest first
    res.json(messages);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch messages' });
  }
});

module.exports = router;
