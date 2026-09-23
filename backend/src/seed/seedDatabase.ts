import mongoose from 'mongoose';
import { connectDatabase } from '../config/database.js';
import { SeedService } from '../services/seedService.js';

async function runStandaloneSeed() {
  try {
    await connectDatabase();
    await SeedService.seedAll(true);
    await mongoose.disconnect();
    console.log('Database connection closed cleanly.');
    process.exit(0);
  } catch (error) {
    console.error('Fatal seed failure:', error);
    process.exit(1);
  }
}

runStandaloneSeed();
