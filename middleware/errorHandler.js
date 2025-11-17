module.exports = (err, req, res, next) => {
  console.error(err.stack);
  // Set 400 for Mongoose validation errors
  const status = err.name === 'ValidationError' ? 400 : (err.statusCode || 500);
  const message = process.env.NODE_ENV === 'production' ? 'Server Error' : err.message;
  res.status(status).json({ success: false, error: message });
  };
  