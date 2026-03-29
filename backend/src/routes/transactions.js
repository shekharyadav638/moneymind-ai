const express = require('express');
const router = express.Router();
const {
  getTransactions,
  addTransaction,
  updateTransaction,
  deleteTransaction,
  getSummary,
  getDerivedBalance,
} = require('../controllers/transactionController');
const { protect } = require('../middleware/auth');

router.use(protect); // All transaction routes require auth

router.get('/summary', getSummary);
router.get('/balance', getDerivedBalance);
router.get('/', getTransactions);
router.post('/', addTransaction);
router.put('/:id', updateTransaction);
router.delete('/:id', deleteTransaction);

module.exports = router;
