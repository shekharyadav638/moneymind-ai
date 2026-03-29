const express = require('express');
const router = express.Router();
const { getInsights, chat, getNetWorth } = require('../controllers/aiController');
const { protect } = require('../middleware/auth');
const rateLimit = require('express-rate-limit');

// Rate limit AI endpoints (expensive API calls)
const aiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 20,
  message: { success: false, message: 'Too many AI requests. Please wait a bit.' },
});

router.use(protect);
router.use(aiLimiter);

router.post('/insights', getInsights);
router.post('/chat', chat);
router.get('/networth', getNetWorth);

module.exports = router;
