const express = require('express');
const mongoose = require('mongoose');
const dotenv = require('dotenv');
const path = require('path');

dotenv.config();

const app = express();
app.use(express.json());

const {MONGODB_URI, JWT_SECRET, PORT = 2000} = process.env;

if (!MONGODB_URI || !JWT_SECRET) {
  console.error(
    'Missing required environment variables. Please check your .env file.',
  );
  process.exit(1);
}

mongoose
  .connect(MONGODB_URI, {useNewUrlParser: true, useUnifiedTopology: true})
  .then(() => console.log('MongoDB connected'))
  .catch(err => {
    console.error('MongoDB connection error:', err);
    process.exit(1);
  });

// Set up static file serving
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Import routes
const authRoutes = require('./routes/auth');
const foodRoutes = require('./routes/food');
const profileRoutes = require('./routes/profile');
const communityRoutes = require('./routes/community');
const tipsRoutes = require('./routes/tips');
const modulesRoutes = require('./routes/modules');
app.use('/api', communityRoutes);
app.use('/api/auth', authRoutes);
app.use('/api/food', foodRoutes);
app.use('/api/profile', profileRoutes);
app.use('/api/tips', tipsRoutes);
app.use('/api/modules', modulesRoutes
  
);


app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
