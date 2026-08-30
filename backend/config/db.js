const mongoose = require('mongoose');

async function connectDB() {
  mongoose.set('strictQuery', true);
  await mongoose.connect(process.env.MONGO_URL, { dbName: process.env.DB_NAME });
  console.log('MongoDB connected to', process.env.DB_NAME);
}

module.exports = connectDB;
