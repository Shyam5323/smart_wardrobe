require('dotenv').config();

const http = require('http');
const app = require('./src/app');
const { connectToDatabase } = require('./src/db/connect');

const PORT = process.env.PORT || 4000;
const MONGODB_URI = process.env.MONGODB_URI;

(async () => {
  try {
    await connectToDatabase(MONGODB_URI);
    const server = http.createServer(app);

    server.listen(PORT, () => {
      console.log(`API server listening on port ${PORT}`);
    });
  } catch (error) {
    console.error('Failed to start server:', error.message);
    process.exit(1);
  }
})();
