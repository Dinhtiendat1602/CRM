const express = require('express');
const router = express.Router();

router.get('/health', (req, res) => {
  res.status(200).json({
    success: true,
    message: 'Zen CRM API is healthy and running',
    timestamp: new Date().toISOString(),
  });
});

module.exports = router;
