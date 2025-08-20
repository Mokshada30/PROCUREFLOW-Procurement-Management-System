require('dotenv').config();
const express = require('express');
const cors = require('cors');
const DatabaseSetup = require('./utils/database-setup');
const app = express();
const PORT = process.env.PORT || 5000;

// Enable CORS for all routes
app.use(cors());

app.use(express.json());

// Import Stripe routes
const stripeRoutes = require('./api/stripe/create-payment-intent');

// Use Stripe routes
app.use('/api/stripe', stripeRoutes);

app.get('/', (req, res) => {
  res.send('Procurement Backend is Running!');
});

// Test endpoint to verify API is working
app.get('/api/test', (req, res) => {
  res.json({
    message: 'Backend API is working!',
    timestamp: new Date().toISOString(),
    endpoints: {
      stripe: '/api/stripe/create-payment-intent (POST)',
      test: '/api/test (GET)',
      health: '/api/health (GET)'
    }
  });
});

// Health check endpoint for Railway
app.get('/api/health', (req, res) => {
  res.json({
    status: 'healthy',
    service: 'Procurement Backend',
    timestamp: new Date().toISOString()
  });
});

app.listen(PORT, async () => {
  console.log(`Backend server running on port ${PORT}`);
  
  // Run database setup automatically
  try {
    const dbSetup = new DatabaseSetup();
    await dbSetup.setup();
  } catch (error) {
    console.error('Database setup failed:', error.message);
  }
});
