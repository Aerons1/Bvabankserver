// middleware/verifyAdmin.js
const jwt = require('jsonwebtoken');

const verifyAdmin = (req, res, next) => {
  const token = req.headers.authorization?.split(' ')[1];
  if (!token) {
    return res.status(401).json({ message: 'No token provided' });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    if (!decoded.admin) {
      throw new Error('Not an admin token');
    }
    req.admin = decoded;
    next();
  } catch (err) {
    return res.status(403).json({ message: 'Invalid token or not authorized' });
  }
};

module.exports = verifyAdmin;
