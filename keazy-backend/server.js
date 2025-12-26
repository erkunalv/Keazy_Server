// server.js
require('dotenv').config();
const connectDB = require('./db/connect');
connectDB();

const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');

// Import routes
const providersRoutes = require('./routes/providers');
const dashboardRoutes = require('./routes/dashboard');
const queryRoutes = require('./routes/query');
const classifyRoutes = require('./routes/classify');
const adminRoutes = require('./routes/admin');
const eventsRoutes = require('./routes/events');
const jobsRoutes = require('./routes/jobs');
const healthRoutes = require('./routes/health');

const app = express();

// Middleware
app.use(cors({ origin: 'http://localhost:5173' }));
app.use(bodyParser.json());

// Mount routes
app.use('/providers', providersRoutes);
app.use('/dashboard', dashboardRoutes);
app.use('/query', queryRoutes);
app.use('/classify', classifyRoutes);
app.use('/api/admin', adminRoutes);
app.use('/events', eventsRoutes);
app.use('/jobs', jobsRoutes);
app.use('/health', healthRoutes);

// Error handler
app.use((err, req, res, next) => {
  console.error('Unhandled error:', err);
  res.status(500).json({ error: 'Internal Server Error' });
});

// Start server
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`✅ Backend running on port ${PORT}`));
