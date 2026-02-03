export const APP_NAME = 'FoodBack';

export const USER_ROLES = {
  SUPER_ADMIN: 'SUPER_ADMIN',
  VENDOR: 'VENDOR',
  MANAGER: 'MANAGER',
} as const;

export const SUBSCRIPTION_STATUS = {
  TRIAL: 'TRIAL',
  ACTIVE: 'ACTIVE',
  PAST_DUE: 'PAST_DUE',
  CANCELED: 'CANCELED',
  EXPIRED: 'EXPIRED',
} as const;

export const RESTAURANT_STATUS = {
  PENDING: 'PENDING',
  ACTIVE: 'ACTIVE',
  SUSPENDED: 'SUSPENDED',
} as const;

export type UserRole = typeof USER_ROLES[keyof typeof USER_ROLES];
export type SubscriptionStatus = typeof SUBSCRIPTION_STATUS[keyof typeof SUBSCRIPTION_STATUS];
export type RestaurantStatus = typeof RESTAURANT_STATUS[keyof typeof RESTAURANT_STATUS];
