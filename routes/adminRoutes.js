const express = require('express');
const router = express.Router();
const adminController = require('../controllers/adminController');
const verifyAdmin = require('../middleware/verifyAdmin');

// Admin login
router.post('/login', adminController.loginAdmin);

// Statistics
router.get('/statistics', verifyAdmin, adminController.getStatistics);

// ===== USER MANAGEMENT =====
router.post('/users', verifyAdmin, adminController.createUser); // Create user
router.get('/users', verifyAdmin, adminController.getAllUsers); // Get all users
router.put('/users/:id', verifyAdmin, adminController.updateUser); // Update user info
router.put('/users/:id/block-toggle', verifyAdmin, adminController.toggleBlockUser); // Block/unblock
router.delete('/users/:id', verifyAdmin, adminController.deleteUser); // Delete user
router.put('/users/:id/account-manager', verifyAdmin, adminController.assignAccountManager); // Assign manager

// ===== TRANSACTION MANAGEMENT =====
router.get('/transactions', verifyAdmin, adminController.getAllTransactions); // List all
router.put('/transactions/:id/approve', verifyAdmin, adminController.approveTransaction); // Approve
router.put('/transactions/:id/reject', verifyAdmin, adminController.rejectTransaction); // Reject
router.post('/users/:id/transactions', verifyAdmin, adminController.addManualTransaction); // Admin adds manual transaction


module.exports = router;
