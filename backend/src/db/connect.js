const mongoose = require('mongoose');

const connectToDatabase = async (mongoUri, options = {}) => {
  if (!mongoUri) {
    throw new Error('Missing MongoDB connection string.');
  }

  const defaultOptions = {
    autoIndex: true,
    serverSelectionTimeoutMS: 5000,
  };

  const connectionOptions = { ...defaultOptions, ...options };

  if (mongoose.connection.readyState === mongoose.connection.states.connected) {
    return mongoose.connection;
  }

  await mongoose.connect(mongoUri, connectionOptions);
  return mongoose.connection;
};

module.exports = {
  connectToDatabase,
};
