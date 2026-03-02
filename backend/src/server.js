import { fileURLToPath } from 'url';
import { dirname, resolve } from 'path';
import dotenv from 'dotenv';

// Resolve .env relative to this file so it works regardless of CWD
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
dotenv.config({ path: resolve(__dirname, '../../.env') });

import app from './app.js';
import connectDB from './config/db.js';
import { initializeAdmin } from './config/admin.init.js';
import cron from 'node-cron';
import { runScrapeCycle } from './services/market.service.js';

const PORT = process.env.PORT || 5000;

// --- Start Server ---
const startServer = async () => {
  try {
    // 1. Connect to MongoDB
    await connectDB();

    // 2. Initialize admin user
    await initializeAdmin();

    // 3. Start Express server
    const server = app.listen(PORT, () => {
      console.log(`🚀 Server running in ${process.env.NODE_ENV} mode on port ${PORT}`);
      console.log(`🌐 Visit: http://localhost:${PORT}`);
    });

    server.timeout = 350000;

    // 4. Schedule commodity scrape every 2 hours
    console.log('📊 Market price scraper cron scheduled (every 2 hours)');
    cron.schedule('0 */2 * * *', async () => {
      console.log('[Cron] Running commodity price scrape cycle...');
      try {
        const result = await runScrapeCycle();
        console.log(`[Cron] Scrape done — saved: ${result.saved}, feed errors: ${result.errors?.length ?? 0}`);
      } catch (err) {
        console.error('[Cron] Scrape failed:', err.message);
      }
    });

  } catch (error) {
    console.error('❌ Server failed to start:', error);
    process.exit(1);
  }
};

startServer();
