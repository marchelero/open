import type { FastifyInstance, FastifyPluginAsync } from 'fastify';

// In-memory store for the demo. Real apps would use a database.
interface User {
  id: string;
  name: string;
  email: string;
}

const users = new Map<string, User>([
  ['u_1', { id: 'u_1', name: 'Ada Lovelace', email: 'ada@example.com' }],
  ['u_2', { id: 'u_2', name: 'Alan Turing', email: 'alan@example.com' }],
]);

export const userRoutes: FastifyPluginAsync = async (app: FastifyInstance) => {
  app.get<{ Params: { id: string } }>('/:id', async (request, reply) => {
    const user = users.get(request.params.id);
    if (!user) {
      return reply.code(404).send({ error: 'user_not_found', id: request.params.id });
    }
    return user;
  });

  app.get('/', async () => ({ users: Array.from(users.values()) }));
};
