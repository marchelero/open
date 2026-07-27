import Fastify, { type FastifyInstance } from 'fastify';
import { userRoutes } from './users.js';

export function buildApp(): FastifyInstance {
  const app = Fastify({
    logger: process.env.NODE_ENV !== 'test',
  });

  app.get('/', async () => ({ service: 'node-api-demo', status: 'ok' }));

  app.register(userRoutes, { prefix: '/users' });

  return app;
}
