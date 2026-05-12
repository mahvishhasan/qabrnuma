const express = require('express');
const cors = require('cors');
require('dotenv').config();

const { generalLimiter, authLimiter } = require('./middleware/rateLimiter');
const { checkAndExpireReservations } = require('./controllers/reservationController');
const authRoutes = require('./routes/auth');
const deathCasesRoutes = require('./routes/deathCases');
const burialRecordsRoutes = require('./routes/burialRecords');
const cemeteriesRoutes = require('./routes/cemeteries');
const gravesRoutes = require('./routes/graves');
const reservationsRoutes = require('./routes/reservations');
const funeralServicesRoutes = require('./routes/funeralServices');
const usersRoutes = require('./routes/users');
const reportsRoutes = require('./routes/reports');
const activityLogsRoutes = require('./routes/activityLogs');
const settingsRoutes = require('./routes/settings');

const app = express();

const allowedOrigins = [
  'http://localhost:3000',
  process.env.FRONTEND_URL
].filter(Boolean);

app.use(cors({
  origin: (origin, callback) => {
    if (!origin || allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true
}));
app.use(generalLimiter);
app.use(express.json());

app.use((req, res, next) => {
  console.log(`${new Date().toISOString()} ${req.method} ${req.path}`);
  next();
});

app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

app.use('/api/auth/login', authLimiter);
app.use('/api/auth/register', authLimiter);
app.use('/api/auth', authRoutes);
app.use('/api/death-cases', deathCasesRoutes);
app.use('/api/burial-records', burialRecordsRoutes);
app.use('/api/cemeteries', cemeteriesRoutes);
app.use('/api/graves', gravesRoutes);
app.use('/api/reservations', reservationsRoutes);
app.use('/api/funeral-services', funeralServicesRoutes);
app.use('/api/users', usersRoutes);
app.use('/api/reports', reportsRoutes);
app.use('/api/activity-logs', activityLogsRoutes);
app.use('/api/settings', settingsRoutes);

app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ error: 'Something went wrong!' });
});

app.use((req, res) => {
  res.status(404).json({ error: 'Route not found' });
});

const PORT = process.env.PORT || 5001;

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);

  checkAndExpireReservations().catch(err => {
    console.error('Initial expiry check failed:', err);
  });

  setInterval(() => {
    checkAndExpireReservations().catch(err => {
      console.error('Expiry check failed:', err);
    });
  }, 5 * 60 * 1000);
});

module.exports = app;
