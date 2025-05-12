const express = require('express');
const mongoose = require('mongoose');
const dotenv = require('dotenv');
const cors = require('cors');

// Load environment variables early
dotenv.config();

const app = express();

// CORS setup (limit to your frontend URL in production)
app.use(cors({
  origin: process.env.CLIENT_URL || '*', // You can set this to your actual frontend domain
  credentials: true
}));

// Middleware
app.use(express.json());

// MongoDB Connection
mongoose.connect(process.env.MONGO_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true
})
.then(() => console.log("✅ MongoDB connected"))
.catch((err) => {
  console.error("❌ MongoDB connection error:", err.message);
  process.exit(1);
});

// Health check route
app.get('/', (req, res) => {
  res.send('🚀 BVA Bank API is running');
});

// API Routes
app.use('/api/users', require('./routes/userRoutes'));
app.use('/api/admin', require('./routes/adminRoutes'));
app.use('/api/transactions', require('./routes/transactionRoutes'));

// Start the server
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`🌐 Server running on port ${PORT}`));
