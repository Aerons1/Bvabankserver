const User = require('../models/User');
const Transaction = require('../models/Transaction');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

const generateAccountNumber = () =>
  Math.floor(10000000000 + Math.random() * 90000000000).toString();

// Admin login
exports.loginAdmin = async (req, res) => {
  const { email, password } = req.body;
  if (email === process.env.ADMIN_EMAIL && password === process.env.ADMIN_PASSWORD) {
    const token = jwt.sign({ admin: true, email }, process.env.JWT_SECRET, { expiresIn: '7d' });
    return res.json({ token });
  }
  return res.status(401).json({ message: 'Invalid admin credentials' });
};

// Create new user
exports.createUser = async (req, res) => {
  const { name, email, password, accountManager } = req.body;

  if (!name || !email || !password || !accountManager?.name || !accountManager?.email) {
    return res.status(400).json({ message: 'All fields are required' });
  }

  try {
    const existingUser = await User.findOne({ email });
    if (existingUser) return res.status(400).json({ message: 'User already exists' });

    const hashedPassword = await bcrypt.hash(password, 10);
    const newUser = new User({
      name,
      email,
      password: hashedPassword,
      accountNumber: generateAccountNumber(),
      accountManager
    });

    await newUser.save();
    res.status(201).json({ message: 'User created', user: newUser });
  } catch (err) {
    res.status(500).json({ message: 'Error creating user', error: err.message });
  }
};

// Get all users
exports.getAllUsers = async (req, res) => {
  try {
    const users = await User.find();
    res.json(users);
  } catch (err) {
    res.status(500).json({ message: 'Error fetching users', error: err.message });
  }
};

// Update user
exports.updateUser = async (req, res) => {
  const { id } = req.params;
  const { name, balance } = req.body;

  try {
    const updatedUser = await User.findByIdAndUpdate(
      id,
      { ...(name && { name }), ...(balance !== undefined && { balance }) },
      { new: true }
    );
    if (!updatedUser) return res.status(404).json({ message: 'User not found' });
    res.json(updatedUser);
  } catch (err) {
    res.status(500).json({ message: 'Error updating user', error: err.message });
  }
};

// Assign account manager
exports.assignAccountManager = async (req, res) => {
  const { id } = req.params;
  const { name, email } = req.body;

  if (!name || !email) {
    return res.status(400).json({ message: 'Manager name and email required' });
  }

  try {
    const updatedUser = await User.findByIdAndUpdate(
      id,
      { accountManager: { name, email } },
      { new: true }
    );
    if (!updatedUser) return res.status(404).json({ message: 'User not found' });
    res.json(updatedUser);
  } catch (err) {
    res.status(500).json({ message: 'Error assigning manager', error: err.message });
  }
};

// Block or unblock user
exports.toggleBlockUser = async (req, res) => {
  const { id } = req.params;

  try {
    const user = await User.findById(id);
    if (!user) return res.status(404).json({ message: 'User not found' });

    user.isBlocked = !user.isBlocked;
    await user.save();
    res.json({ message: user.isBlocked ? 'User blocked' : 'User unblocked', user });
  } catch (err) {
    res.status(500).json({ message: 'Error toggling block status', error: err.message });
  }
};

// Delete user
exports.deleteUser = async (req, res) => {
  const { id } = req.params;

  try {
    const deletedUser = await User.findByIdAndDelete(id);
    if (!deletedUser) return res.status(404).json({ message: 'User not found' });
    res.json({ message: 'User deleted' });
  } catch (err) {
    res.status(500).json({ message: 'Error deleting user', error: err.message });
  }
};

// Deposit funds
exports.depositToUser = async (req, res) => {
  const { id } = req.params;
  const { amount } = req.body;

  if (!amount || amount <= 0) {
    return res.status(400).json({ message: 'Invalid deposit amount' });
  }

  try {
    const user = await User.findById(id);
    if (!user) return res.status(404).json({ message: 'User not found' });

    user.balance += parseFloat(amount);
    await user.save();

    const transaction = new Transaction({
      userId: id,
      type: 'deposit',
      amount,
      status: 'approved'
    });
    await transaction.save();

    res.json({ message: 'Deposit successful', user, transaction });
  } catch (err) {
    res.status(500).json({ message: 'Error depositing funds', error: err.message });
  }
};

// Withdraw funds
exports.withdrawFromUser = async (req, res) => {
  const { id } = req.params;
  const { amount } = req.body;

  if (!amount || amount <= 0) {
    return res.status(400).json({ message: 'Invalid withdrawal amount' });
  }

  try {
    const user = await User.findById(id);
    if (!user) return res.status(404).json({ message: 'User not found' });

    if (user.balance < amount) {
      return res.status(400).json({ message: 'Insufficient balance' });
    }

    user.balance -= parseFloat(amount);
    await user.save();

    const transaction = new Transaction({
      userId: id,
      type: 'withdrawal',
      amount,
      status: 'approved'
    });
    await transaction.save();

    res.json({ message: 'Withdrawal successful', user, transaction });
  } catch (err) {
    res.status(500).json({ message: 'Error withdrawing funds', error: err.message });
  }
};

// Get dashboard statistics
exports.getStatistics = async (req, res) => {
  try {
    const totalUsers = await User.countDocuments();
    const totalBalanceAgg = await User.aggregate([
      { $group: { _id: null, total: { $sum: "$balance" } } }
    ]);
    const totalTransactions = await Transaction.countDocuments();

    const approved = await Transaction.countDocuments({ status: 'approved' });
    const pending = await Transaction.countDocuments({ status: 'pending' });
    const rejected = await Transaction.countDocuments({ status: 'rejected' });

    res.json({
      totalUsers,
      totalBalance: totalBalanceAgg[0]?.total || 0,
      totalTransactions,
      transactionStats: { approved, pending, rejected }
    });
  } catch (err) {
    res.status(500).json({ message: 'Error getting statistics', error: err.message });
  }
};

// Get all transactions
exports.getAllTransactions = async (req, res) => {
  try {
    const transactions = await Transaction.find().sort({ createdAt: -1 });
    res.json(transactions);
  } catch (err) {
    res.status(500).json({ message: 'Error fetching transactions', error: err.message });
  }
};

// Approve transaction
exports.approveTransaction = async (req, res) => {
  const { id } = req.params;

  try {
    const transaction = await Transaction.findByIdAndUpdate(
      id,
      { status: 'approved' },
      { new: true }
    );
    if (!transaction) return res.status(404).json({ message: 'Transaction not found' });
    res.json(transaction);
  } catch (err) {
    res.status(500).json({ message: 'Error approving transaction', error: err.message });
  }
};

// Reject transaction
exports.rejectTransaction = async (req, res) => {
  const { id } = req.params;

  try {
    const transaction = await Transaction.findByIdAndUpdate(
      id,
      { status: 'rejected' },
      { new: true }
    );
    if (!transaction) return res.status(404).json({ message: 'Transaction not found' });
    res.json(transaction);
  } catch (err) {
    res.status(500).json({ message: 'Error rejecting transaction', error: err.message });
  }
};

// Manually add transaction (new)
exports.addManualTransaction = async (req, res) => {
  try {
    const userId = req.params.id;
    const { type, amount, note } = req.body;

    if (!['credit', 'debit'].includes(type) || !amount || !note) {
      return res.status(400).json({ message: 'Invalid transaction data.' });
    }

    const user = await User.findById(userId);
    if (!user) return res.status(404).json({ message: 'User not found.' });

    // Adjust balance
    if (type === 'credit') {
      user.balance += amount;
    } else {
      if (user.balance < amount) {
        return res.status(400).json({ message: 'Insufficient balance for debit.' });
      }
      user.balance -= amount;
    }

    const transaction = new Transaction({
      userId,
      type,
      amount,
      note
    });

    await transaction.save();
    await user.save();

    res.status(201).json({ message: 'Transaction added successfully.', transaction });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Failed to add transaction.' });
  }
};
