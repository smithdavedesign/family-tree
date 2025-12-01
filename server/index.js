const express = require('express');
const cors = require('cors');
require('dotenv').config();

const app = express();
const port = process.env.PORT || 3000;

// Trust proxy for rate limiting behind load balancers (Render/Vercel)
app.set('trust proxy', 1);

// Middleware
app.use(cors());
app.use(express.json());

// Routes
const apiRoutes = require('./routes/api');
app.use('/api', apiRoutes);

// Health check
app.get('/', (req, res) => {
    res.send('Family Tree API is running');
});

app.listen(port, () => {
    console.log(`Server running on port ${port}`);
});
