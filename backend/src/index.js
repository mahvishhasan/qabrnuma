const express = require('express');
const cors = require('cors');
require('dotenv').config();

const deathCasesRoutes = require('./routes/deathCases');
const burialRecordsRoutes = require('./routes/burialRecords');

const app = express();

app.use(cors());
app.use(express.json());

app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

app.use('/api/death-cases', deathCasesRoutes);
app.use('/api/burial-records', burialRecordsRoutes);

app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ error: 'Something went wrong!' });
});

app.use((req, res) => {
  res.status(404).json({ error: 'Route not found' });
});

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});

module.exports = app;
