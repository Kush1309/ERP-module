require('dotenv').config();

const app = require('./app');
const { validateEnv } = require('./config/env');
const { connectDatabase } = require('./config/database');

const startServer = async () => {
  try {
    validateEnv();
    await connectDatabase();

    const port = process.env.PORT;

    app.listen(port, () => {
      console.log(`School ERP API running on port ${port}`);
      console.log(`Environment: ${process.env.NODE_ENV}`);
    });
  } catch (error) {
    console.error('Failed to start server:', error.message);
    process.exit(1);
  }
};

startServer();
