import crypto from 'crypto';

export function generateUniqueCode(): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let code = 'FB-';
  
  for (let i = 0; i < 4; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  code += '-';
  for (let i = 0; i < 4; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  
  return code;
}

export function generateReferralCode(name: string): string {
  const base = name
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]/g, '')
    .slice(0, 8);
  
  const suffix = crypto.randomBytes(3).toString('hex').toUpperCase();
  return `${base}-${suffix}`;
}

export function isToday(date: Date | null): boolean {
  if (!date) return false;
  const today = new Date();
  return (
    date.getFullYear() === today.getFullYear() &&
    date.getMonth() === today.getMonth() &&
    date.getDate() === today.getDate()
  );
}

export function addDays(date: Date, days: number): Date {
  const result = new Date(date);
  result.setDate(result.getDate() + days);
  return result;
}

export function getTodayDateString(): string {
  return new Date().toISOString().split('T')[0];
}

export function parseTime(timeStr: string): { hours: number; minutes: number } {
  const [hours, minutes] = timeStr.split(':').map(Number);
  return { hours, minutes };
}

export function isWithinTimeRange(start: string, end: string): boolean {
  const now = new Date();
  const parisTime = new Date(now.toLocaleString('en-US', { timeZone: 'Europe/Paris' }));
  const currentMinutes = parisTime.getHours() * 60 + parisTime.getMinutes();
  
  const startParsed = parseTime(start);
  const endParsed = parseTime(end);
  
  const startMinutes = startParsed.hours * 60 + startParsed.minutes;
  const endMinutes = endParsed.hours * 60 + endParsed.minutes;
  
  // Gestion des horaires passant minuit (ex: 19:00 - 01:36)
  if (endMinutes < startMinutes) {
    // Si on est après le début OU avant la fin (le lendemain)
    return currentMinutes >= startMinutes || currentMinutes <= endMinutes;
  }
  
  return currentMinutes >= startMinutes && currentMinutes <= endMinutes;
}

/**
 * Determine the current service type based on restaurant service hours.
 * If currently within lunch hours → 'lunch'
 * If currently within dinner hours → 'dinner'
 * If outside both → determine based on which service we're closest to (after lunch = dinner, after dinner/before lunch = lunch)
 */
export function getCurrentService(serviceHours: { lunch: { start: string; end: string }; dinner: { start: string; end: string } }): string {
  if (isWithinTimeRange(serviceHours.lunch.start, serviceHours.lunch.end)) {
    return 'lunch';
  }
  if (isWithinTimeRange(serviceHours.dinner.start, serviceHours.dinner.end)) {
    return 'dinner';
  }

  // Outside both services: determine which service period we're in
  const now = new Date();
  const parisTime = new Date(now.toLocaleString('en-US', { timeZone: 'Europe/Paris' }));
  const currentMinutes = parisTime.getHours() * 60 + parisTime.getMinutes();

  const lunchEnd = parseTime(serviceHours.lunch.end);
  const dinnerStart = parseTime(serviceHours.dinner.start);

  const lunchEndMinutes = lunchEnd.hours * 60 + lunchEnd.minutes;
  const dinnerStartMinutes = dinnerStart.hours * 60 + dinnerStart.minutes;

  // After lunch but before dinner → we're in the "dinner" period (between services)
  if (currentMinutes > lunchEndMinutes && currentMinutes < dinnerStartMinutes) {
    return 'dinner';
  }

  // After dinner (late night / early morning before lunch) → last service was dinner
  if (currentMinutes > lunchEndMinutes) {
    return 'dinner';
  }

  // Before lunch → last service was dinner (from yesterday)
  return 'dinner';
}

export function calculateDistance(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
): number {
  const R = 6371e3; // Rayon de la Terre en mètres
  const φ1 = (lat1 * Math.PI) / 180;
  const φ2 = (lat2 * Math.PI) / 180;
  const Δφ = ((lat2 - lat1) * Math.PI) / 180;
  const Δλ = ((lon2 - lon1) * Math.PI) / 180;

  const a =
    Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
    Math.cos(φ1) * Math.cos(φ2) * Math.sin(Δλ / 2) * Math.sin(Δλ / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

  return R * c; // Distance en mètres
}
