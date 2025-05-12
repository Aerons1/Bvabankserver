const express = require('express');
const { loginUser, getUserProfile } = require('../controllers/userController');
const { verifyToken } = require('../middleware/auth');

const router = express.Router();

router.post('/login', loginUser); // Regular user login
router.get('/profile', verifyToken, getUserProfile);

module.exports = router;
