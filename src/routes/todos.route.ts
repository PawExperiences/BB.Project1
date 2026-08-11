import type { FastifyInstance } from 'fastify';
import { TodosController } from '../controllers/todos.controller.js';
import { TodosService } from '../services/todos.service.js';
import { TodosRepository } from '../repositories/todos.repository.js';

export function registerTodosRoutes(app: FastifyInstance): void {
  const repository = new TodosRepository();
  const service = new TodosService(repository);
  const controller = new TodosController(service);

  app.get('/todos', controller.list);
  app.post('/todos', controller.create);
  app.delete('/todos/:id', controller.remove);
}
