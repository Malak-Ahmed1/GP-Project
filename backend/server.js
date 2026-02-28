require('dotenv').config();
const express = require('express');
const cors = require('cors');

const jobRoutes = require('./routes/jobRoutes');
const hrRoutes = require('./routes/hrRoute');
const candidateRoutes = require('./routes/candidateRoutes');
const jobScheduler = require('./services/jobScheduler');
const socialAuth = require('./routes/socialAuth');
const emailRoutes = require('./routes/emailRoutes');

const app = express();

// CORS configuration
app.use(cors({
  origin: ['http://localhost:3000', 'http://127.0.0.1:3000'],
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

app.use(express.json());

// Routes
app.use('/api/job', jobRoutes);
app.use('/api/hr', hrRoutes);
app.use('/api/hr', socialAuth);
app.use('/api/candidate', candidateRoutes);
app.use('/api/email', emailRoutes);
app.use("/uploads", express.static("uploads"));

const PORT = process.env.PORT || 5000;

jobScheduler.start();

const server = app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
  console.log('Job scheduler started - checking expired jobs every 5 minutes');
});
