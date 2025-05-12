const express = require('express');
const {
  createTransaction,
  getTransactions,
} = require('../controllers/transactionController');

const { verifyToken } = require('../middleware/auth');

const router = express.Router();

// User routes
router.post('/', verifyToken, createTransaction);
router.get('/', verifyToken, getTransactions);

module.exports = router;
