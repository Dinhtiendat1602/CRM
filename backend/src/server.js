require('dotenv').config();
const app = require('./app');

const PORT = process.env.PORT || 8888;

const server = app.listen(PORT, () => {
  console.log(`[Zen CRM Backend] Server running on port ${PORT} in ${process.env.NODE_ENV || 'development'} mode`);
});

server.on('error', (err) => {
  if (err.code === 'EADDRINUSE') {
    console.error(`[Zen CRM Backend] Error: Port ${PORT} is already in use.`);
  } else {
    console.error('[Zen CRM Backend] Server error:', err);
  }
  process.exit(1);
});
