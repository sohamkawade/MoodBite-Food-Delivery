const mongoose = require('mongoose');
const debug = require('debug')("development:mongoose");

const mongoUri = process.env.MONGO_URI || process.env.MONGODB_URI;

mongoose.connect(mongoUri, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
})
.then(() => {
  debug('Connected to MongoDB'); 
  console.log('Connected to MongoDB'); 
})
.catch((err) => {
  console.error('Error connecting to MongoDB:', err.message);
});

module.exports = mongoose.connection;
