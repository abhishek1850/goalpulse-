const express = require('express');
const cors = require('cors');
const morgan = require('morgan');
const dotenv = require('dotenv');
const connectDB = require('./config/db');

// Load env vars
dotenv.config();

// Connect to database
connectDB();

const app = express();

const path = require('path');

// Middleware
// Allow localhost for dev, or specific domains in prod (or allow all)
app.use(cors({ 
  origin: process.env.CLIENT_URL || 'http://localhost:5173', 
  credentials: true 
}));
app.use(express.json());
app.use(morgan('dev'));

// Routes
app.use('/api/auth',         require('./routes/auth'));
app.use('/api/users',        require('./routes/users'));
app.use('/api/goals',        require('./routes/goals'));
app.use('/api/checkins',     require('./routes/checkins'));
app.use('/api/admin',        require('./routes/admin'));
app.use('/api/manager',      require('./routes/manager'));
app.use('/api/achievements', require('./routes/achievements'));
app.use('/api/shared-goals', require('./routes/sharedGoals'));
app.use('/api/reports',      require('./routes/reports'));
app.use('/api/notifications',require('./routes/notifications'));
app.use('/api/escalations',  require('./routes/escalations'));

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', message: 'GoalPulse API is running' });
});

// Root route
app.get('/', (req, res) => {
  res.json({ status: 'ok', message: 'GoalPulse Backend API is running. Please use the Vercel frontend URL to access the application.' });
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(err.statusCode || 500).json({
    success: false,
    message: err.message || 'Internal Server Error',
  });
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`🚀 GoalPulse Server running on port ${PORT}`);
});
