import { generateDailySummaries, generateWeeklySummaries } from '../services/summaries/generator.js';

/**
 * Simple cron scheduler using setInterval.
 * Runs daily summary at 22:00 and weekly on Sundays.
 */
export function startCronJobs(): void {
  console.log('⏰ Cron scheduler started');

  // Check every 5 minutes
  setInterval(async () => {
    const now = new Date();
    const hours = now.getHours();
    const minutes = now.getMinutes();
    const dayOfWeek = now.getDay(); // 0 = Sunday

    // Daily summaries at 22:00 (between 22:00 and 22:04)
    if (hours === 22 && minutes < 5) {
      console.log('🔄 Running daily summary generation...');
      try {
        await generateDailySummaries();
        console.log('✅ Daily summaries generated');
      } catch (err) {
        console.error('❌ Daily summary error:', err);
      }
    }

    // Weekly summaries on Sunday at 22:30 (between 22:30 and 22:34)
    if (dayOfWeek === 0 && hours === 22 && minutes >= 30 && minutes < 35) {
      console.log('🔄 Running weekly summary generation...');
      try {
        await generateWeeklySummaries();
        console.log('✅ Weekly summaries generated');
      } catch (err) {
        console.error('❌ Weekly summary error:', err);
      }
    }
  }, 5 * 60 * 1000); // Every 5 minutes
}
