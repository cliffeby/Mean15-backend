module.exports = (err, req, res, next) => {
  console.error('Error occurred:', err.name, err.message);
  console.error('Full error:', err);
  
  // Handle JWT errors
  if (err.name === 'UnauthorizedError') {
    return res.status(401).json({ 
      success: false, 
      error: 'Invalid or missing token',
      details: err.message 
    });
  }
  
  // Set 400 for Mongoose validation errors
  const status = err.name === 'ValidationError' ? 400 : (err.statusCode || 500);
  const message = process.env.NODE_ENV === 'production' ? 'Server Error' : err.message;
  res.status(status).json({ success: false, error: message });
};
  