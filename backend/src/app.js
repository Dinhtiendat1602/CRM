const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '../.env') });

const app = express();

app.use(helmet());
app.use(
  cors({
    origin: [process.env.FRONTEND_URL, 'http://localhost:8080', 'http://localhost:5173'].filter(Boolean),
    credentials: true,
  })
);

if (process.env.NODE_ENV !== 'test') {
  app.use(morgan('dev'));
}

app.use(express.json());

// Routes
app.use('/api', require('./routes/health.routes'));
app.use('/api/auth', require('./routes/auth.routes'));
app.use('/api/admin', require('./routes/user.routes'));
app.use('/api/leads', require('./routes/lead.routes'));
app.use('/api/categories', require('./routes/category.routes'));
app.use('/api/products', require('./routes/product.routes'));
app.use('/api/opportunities', require('./routes/opportunity.routes'));

// Global error handler
app.use(require('./middlewares/error.middleware'));

module.exports = app;
