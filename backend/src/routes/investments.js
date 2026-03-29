const express = require('express');
const router = express.Router();
const {
  getInvestments,
  addInvestment,
  updateInvestment,
  deleteInvestment,
  refreshPrices,
} = require('../controllers/investmentController');
const { protect } = require('../middleware/auth');

router.use(protect);

router.get('/', getInvestments);
router.post('/refresh-prices', refreshPrices);
router.post('/', addInvestment);
router.put('/:id', updateInvestment);
router.delete('/:id', deleteInvestment);

module.exports = router;
