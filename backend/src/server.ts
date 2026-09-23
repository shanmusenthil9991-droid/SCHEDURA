import { createApp } from './app.js';
import { connectDatabase } from './config/database.js';
import { ENV } from './config/env.js';
import { SeedService } from './services/seedService.js';

async function startServer() {
  try {
    // 1. Connect to MongoDB
    await connectDatabase();

    // 2. Automatic First Run Check: Seed demo data if database is empty/uninitialized
    await SeedService.checkAndSeed();

    // 3. Create and start express app
    const app = createApp();

    app.listen(ENV.PORT, () => {
      console.log(`
============================================================
              SCHEDURA BACKEND SERVER RUNNING
============================================================
* Port:        ${ENV.PORT}
* Environment: ${ENV.NODE_ENV}
* Database:    ${ENV.MONGO_URI}
* API Base:    http://localhost:${ENV.PORT}/api
* Healthcheck: http://localhost:${ENV.PORT}/api/health
============================================================
      `);
    });
  } catch (error) {
    console.error('✗ Server initialization failed:', error);
    process.exit(1);
  }
}

startServer();
