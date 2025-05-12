const Transaction = require('../models/Transaction');

exports.createTransaction = async (req, res) => {
  try {
    const { type, amount, note } = req.body;
    const userId = req.user.id;

    if (!type || !amount || !note) {
      return res.status(400).json({ message: 'Type, amount, and note are required.' });
    }

    const newTransaction = new Transaction({
      userId,
      type,
      amount,
      note,
    });

    await newTransaction.save();
    res.status(201).json(newTransaction);
  } catch (error) {
    res.status(500).json({ message: 'Error creating transaction' });
  }
};

exports.getTransactions = async (req, res) => {
  try {
    const userId = req.user.id;

    const transactions = await Transaction.find({ userId }).sort({ createdAt: -1 });

    res.json(transactions);
  } catch (err) {
    res.status(500).json({ message: 'Failed to fetch transactions' });
  }
};
