// config/db.js
const mongoose = require('mongoose');

const connectDB = async () => {
  const uri = process.env.MONGO_URI;
  console.log('MONGO_URI value:', uri);
  await mongoose.connect(uri, {
    // useNewUrlParser: true, (removed, deprecated)
    // useUnifiedTopology: true, (removed, deprecated)
    serverSelectionTimeoutMS: 5000
  });
  console.log('MongoDB connected');
};

module.exports = { connectDB };
