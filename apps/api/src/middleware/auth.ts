import { FastifyRequest, FastifyReply } from 'fastify';
import { prisma } from '../lib/prisma.js';

declare module '@fastify/jwt' {
  interface FastifyJWT {
    payload: {
      id: string;
      email: string;
      role: 'SUPER_ADMIN' | 'VENDOR' | 'MANAGER';
      type: 'user' | 'vendor';
    };
    user: {
      id: string;
      email: string;
      role: 'SUPER_ADMIN' | 'VENDOR' | 'MANAGER';
      type: 'user' | 'vendor';
    };
  }
}

export async function authenticate(request: FastifyRequest, reply: FastifyReply) {
  try {
    await request.jwtVerify();
  } catch (err) {
    reply.status(401).send({ error: true, message: 'Non autorisé' });
  }
}

export function requireRole(...roles: ('SUPER_ADMIN' | 'VENDOR' | 'MANAGER')[]) {
  return async (request: FastifyRequest, reply: FastifyReply) => {
    await authenticate(request, reply);
    
    if (!request.user || !roles.includes(request.user.role)) {
      reply.status(403).send({ error: true, message: 'Accès interdit' });
    }
  };
}

export async function requireSuperAdmin(request: FastifyRequest, reply: FastifyReply) {
  await authenticate(request, reply);
  
  if (!request.user || request.user.role !== 'SUPER_ADMIN') {
    reply.status(403).send({ error: true, message: 'Accès réservé au super admin' });
  }
}

export async function requireManager(request: FastifyRequest, reply: FastifyReply) {
  await authenticate(request, reply);
  
  if (!request.user || request.user.role !== 'MANAGER') {
    reply.status(403).send({ error: true, message: 'Accès réservé aux managers' });
  }
}

export async function requireVendor(request: FastifyRequest, reply: FastifyReply) {
  await authenticate(request, reply);
  
  if (!request.user || request.user.type !== 'vendor') {
    reply.status(403).send({ error: true, message: 'Accès réservé aux vendeurs' });
  }
}
