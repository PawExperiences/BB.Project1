import type { Todo } from '../schemas/todo.schema.js';
import type { TodosRepository } from '../repositories/todos.repository.js';

export class TodosService {
  constructor(private readonly repository: TodosRepository) {}

  listTodos(): Todo[] {
    return this.repository.findAll();
  }

  createTodo(title: string): Todo {
    return this.repository.create(title);
  }
}
