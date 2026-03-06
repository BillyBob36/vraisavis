import { generateDailySummaries, generateWeeklySummaries } from '../services/summaries/generator.js';
import { checkTrialReminders } from '../services/email/trial-reminders.js';

/**
 * Get current Paris time components.
 * Server runs in UTC (Docker), managers are in France.
 */
function getParisTime(): { hours: number; minutes: number; dayOfWeek: number; dateKey: string } {
  const now = new Date();
  const fmt = (opt: Intl.DateTimeFormatOptions) =>
    new Intl.DateTimeFormat('en-US', { timeZone: 'Europe/Paris', ...opt }).format(now);

  const hours = parseInt(fmt({ hour: '2-digit', hour12: false }));
  const minutes = parseInt(fmt({ minute: '2-digit' }));
  const dayOfWeek = new Date(fmt({ year: 'numeric', month: '2-digit', day: '2-digit' })).getDay();
  const dateKey = fmt({ year: 'numeric', month: '2-digit', day: '2-digit' });

  return { hours, minutes, dayOfWeek, dateKey };
}

// Track last processed hour/date to ensure each hour fires exactly once
let lastDailyHour = -1;
let lastDailyDate = '';
let lastWeeklyDate = '';
let lastTrialCheckHour = -1;

/**
 * Cron scheduler using setInterval.
 * Checks every minute (Paris timezone) for reliability.
 * Daily summaries: once per hour change, filtered by manager's summaryHour.
 * Weekly summaries: Sunday at 22:30 Paris time.
 * Trial reminders: once per hour (24h email for all, 48h+24h for promo).
 */
export function startCronJobs(): void {
  console.log('⏰ Cron scheduler started (timezone: Europe/Paris)');

  setInterval(async () => {
    const { hours, minutes, dayOfWeek, dateKey } = getParisTime();

    // Reset tracking on new day
    if (dateKey !== lastDailyDate) {
      lastDailyHour = -1;
      lastDailyDate = dateKey;
      lastTrialCheckHour = -1;
    }

    // Daily summaries: run once per hour change (Paris time)
    if (hours !== lastDailyHour) {
      lastDailyHour = hours;
      console.log(`🔄 Running daily summary generation for hour ${hours}h (Paris)...`);
      try {
        await generateDailySummaries(hours);
        console.log('✅ Daily summaries generated');
      } catch (err) {
        console.error('❌ Daily summary error:', err);
      }
    }

    // Trial reminders: run once per hour (offset by 5 min to not clash with summaries)
    if (hours !== lastTrialCheckHour && minutes >= 5) {
      lastTrialCheckHour = hours;
      try {
        await checkTrialReminders();
      } catch (err) {
        console.error('❌ Trial reminder error:', err);
      }
    }

    // Weekly summaries on Sunday at 22:30 Paris time (run once per Sunday)
    if (dayOfWeek === 0 && hours === 22 && minutes >= 30 && dateKey !== lastWeeklyDate) {
      lastWeeklyDate = dateKey;
      console.log('🔄 Running weekly summary generation...');
      try {
        await generateWeeklySummaries();
        console.log('✅ Weekly summaries generated');
      } catch (err) {
        console.error('❌ Weekly summary error:', err);
      }
    }
  }, 60 * 1000); // Every minute
}
