import Fastify, { type FastifyInstance } from 'fastify';
import { registerTodosRoutes } from './routes/todos.route.js';

export function buildApp(): FastifyInstance {
  const app = Fastify();

  registerTodosRoutes(app);

  return app;
}
