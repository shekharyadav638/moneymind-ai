const express = require('express');
const router = express.Router();
const {
  getGmailAuthUrl,
  handleGmailCallback,
  syncEmails,
  disconnectGmail,
} = require('../controllers/emailController');
const { protect } = require('../middleware/auth');

router.get('/auth-url', protect, getGmailAuthUrl);
router.get('/callback', handleGmailCallback); // Public — Google redirects here
router.get('/sync', protect, syncEmails);
router.delete('/disconnect', protect, disconnectGmail);

module.exports = router;
