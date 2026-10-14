module.exports = (err, req, res, next) => {
  console.error('[Error Middleware]', err);

  const statusCode = err.statusCode || 500;
  const message = err.message || 'Lỗi hệ thống máy chủ nội bộ.';

  res.status(statusCode).json({
    success: false,
    message,
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack }),
  });
};
