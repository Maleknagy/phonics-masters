// MUST BE THE VERY FIRST LINE
require('dotenv').config({ path: require('path').resolve(__dirname, './.env') }); 

const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const cookieParser = require('cookie-parser');
const connectDB = require('./config/database');
const errorHandler = require('./middleware/errorHandler');

// DEBUG: This will print to your terminal immediately
console.log('--- SYSTEM CHECK ---');
console.log('JWT_SECRET Status:', process.env.JWT_SECRET ? '✅ LOADED' : '❌ NOT FOUND');
console.log('MONGO_URI Status:', process.env.MONGODB_URI ? '✅ LOADED' : '❌ NOT FOUND');
console.log('--------------------');

const authRoutes = require('./routes/authRoutes');
const levelRoutes = require('./routes/levelRoutes');
const unitRoutes = require('./routes/unitRoutes');
const progressRoutes = require('./routes/progressRoutes');

const app = express();
connectDB();

app.use(helmet());
app.use(cors({ origin: 'http://localhost:5173', credentials: true }));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

app.use('/api/auth', authRoutes);
app.use('/api/levels', levelRoutes);
app.use('/api/units', unitRoutes);
app.use('/api/progress', progressRoutes);

app.get('/api/health', (req, res) => {
  res.status(200).json({ success: true, message: 'Server is running' });
});

app.use('*', (req, res) => {
  res.status(404).json({ success: false, message: 'Route not found' });
});

app.use(errorHandler);

const PORT = process.env.PORT || 5000;
const server = app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
});

process.on('unhandledRejection', (err) => {
  console.log(`❌ Error: ${err.message}`);
  server.close(() => process.exit(1));
});

module.exports = app;