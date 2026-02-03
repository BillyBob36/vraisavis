import 'dotenv/config';

export const config = {
  NODE_ENV: process.env.NODE_ENV || 'development',
  
  // Database
  DATABASE_URL: process.env.DATABASE_URL || 'postgresql://vraisavis:vraisavis_password@localhost:5432/vraisavis',
  
  // Auth
  JWT_SECRET: process.env.JWT_SECRET || 'dev-secret-key',
  JWT_EXPIRES_IN: process.env.JWT_EXPIRES_IN || '7d',
  
  // Stripe
  STRIPE_SECRET_KEY: process.env.STRIPE_SECRET_KEY || '',
  STRIPE_WEBHOOK_SECRET: process.env.STRIPE_WEBHOOK_SECRET || '',
  STRIPE_CONNECT_CLIENT_ID: process.env.STRIPE_CONNECT_CLIENT_ID || '',
  
  // URLs
  API_URL: process.env.API_URL || 'http://localhost:3001',
  CLIENT_URL: process.env.CLIENT_URL || 'http://localhost:3002',
  WEB_URL: process.env.WEB_URL || 'http://localhost:3000',
  
  // Email (prévu pour plus tard)
  SMTP_HOST: process.env.SMTP_HOST || '',
  SMTP_PORT: parseInt(process.env.SMTP_PORT || '587'),
  SMTP_USER: process.env.SMTP_USER || '',
  SMTP_PASS: process.env.SMTP_PASS || '',
  FROM_EMAIL: process.env.FROM_EMAIL || 'noreply@vraisavis.fr',
  ADMIN_EMAIL: process.env.ADMIN_EMAIL || 'admin@vraisavis.fr',
};
