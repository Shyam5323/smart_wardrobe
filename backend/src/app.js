const path = require('path');
const express = require('express');
const cors = require('cors');
const authRoutes = require('./routes/auth');
const itemRoutes = require('./routes/items');
const aiRoutes = require('./routes/ai');
const outfitRoutes = require('./routes/outfits');

const app = express();

app.use(cors({ origin: process.env.CORS_ORIGIN ? process.env.CORS_ORIGIN.split(',') : '*' }));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

const uploadsDir = path.join(__dirname, '..', 'uploads');
app.use('/uploads', express.static(uploadsDir));

app.get('/health', (req, res) => {
  res.json({ status: 'ok' });
});

app.use('/api/auth', authRoutes);
app.use('/api/items', itemRoutes);
app.use('/api/ai', aiRoutes);
app.use('/api/outfits', outfitRoutes);

app.use((req, res) => {
  res.status(404).json({ message: 'Not Found' });
});

app.use((err, req, res, next) => {
  console.error(err);
  if (res.headersSent) {
    return next(err);
  }

  const status = err.status || err.statusCode || 500;
  const message = err.message || 'Internal Server Error';
  res.status(status).json({ message });
});

module.exports = app;
