import type { FastifyReply, FastifyRequest } from 'fastify';
import type { TodosService } from '../services/todos.service.js';
import { createTodoSchema } from '../schemas/todo.schema.js';

export class TodosController {
  constructor(private readonly service: TodosService) {}

  list = (_request: FastifyRequest, reply: FastifyReply): void => {
    reply.code(200).send(this.service.listTodos());
  };

  create = (request: FastifyRequest, reply: FastifyReply): void => {
    const result = createTodoSchema.safeParse(request.body);

    if (!result.success) {
      reply.code(400).send({ error: 'title is required and must be a string' });
      return;
    }

    const todo = this.service.createTodo(result.data.title);
    reply.code(201).send(todo);
  };
}
