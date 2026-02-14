require('dotenv').config();
const express = require('express');
const cors = require('cors');

const cvRoutes = require('./routes/cvRoutes');
const jobRoutes = require('./routes/jobRoutes');

const app = express();
app.use(cors());
app.use(express.json());

// Routes
app.use('/api/cv', cvRoutes);
app.use('/api/job', jobRoutes);

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
