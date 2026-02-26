import Fastify from 'fastify';
import cors from '@fastify/cors';
import helmet from '@fastify/helmet';
import rateLimit from '@fastify/rate-limit';
import jwt from '@fastify/jwt';
import { config } from './config/env.js';
import { authRoutes } from './routes/auth.js';
import { adminRoutes } from './routes/admin/index.js';
import { managerRoutes } from './routes/manager/index.js';
import { vendorRoutes } from './routes/vendor/index.js';
import { clientRoutes } from './routes/client/index.js';
import { webhookRoutes } from './routes/webhooks.js';
import { telegramRoutes } from './routes/telegram/index.js';
import { whatsappRoutes } from './routes/whatsapp/index.js';
import { startCronJobs } from './cron/scheduler.js';

const fastify = Fastify({
  logger: {
    level: config.NODE_ENV === 'development' ? 'info' : 'warn',
  },
});

// Plugins
await fastify.register(cors, {
  origin: [config.WEB_URL, config.CLIENT_URL],
  credentials: true,
});

await fastify.register(helmet, {
  contentSecurityPolicy: false,
});

await fastify.register(rateLimit, {
  max: 100,
  timeWindow: '1 minute',
});

await fastify.register(jwt, {
  secret: config.JWT_SECRET,
  sign: {
    expiresIn: config.JWT_EXPIRES_IN,
  },
});

// Health check
fastify.get('/health', async () => {
  return { status: 'ok', timestamp: new Date().toISOString() };
});

// Routes
await fastify.register(authRoutes, { prefix: '/api/v1/auth' });
await fastify.register(adminRoutes, { prefix: '/api/v1/admin' });
await fastify.register(managerRoutes, { prefix: '/api/v1/manager' });
await fastify.register(vendorRoutes, { prefix: '/api/v1/vendor' });
await fastify.register(clientRoutes, { prefix: '/api/v1/client' });
await fastify.register(webhookRoutes, { prefix: '/api/v1/webhooks' });
// Stripe webhook also at /stripe (configured in Stripe Dashboard)
await fastify.register(webhookRoutes, { prefix: '' });
await fastify.register(telegramRoutes, { prefix: '/api/v1/telegram' });
await fastify.register(whatsappRoutes, { prefix: '/api/v1/whatsapp' });

// Error handler
fastify.setErrorHandler((error, request, reply) => {
  fastify.log.error(error);
  
  const statusCode = error.statusCode || 500;
  const message = statusCode === 500 ? 'Internal Server Error' : error.message;
  
  reply.status(statusCode).send({
    error: true,
    message,
    statusCode,
  });
});

// Start server
const start = async () => {
  try {
    await fastify.listen({ port: 3001, host: '0.0.0.0' });
    console.log(`🚀 Server running at http://localhost:3001`);
    startCronJobs();
  } catch (err) {
    fastify.log.error(err);
    process.exit(1);
  }
};

start();
