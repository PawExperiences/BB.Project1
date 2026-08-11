import type { Todo } from '../schemas/todo.schema.js';

export class TodosRepository {
  private todos: Todo[] = [];
  private nextId = 1;

  findAll(): Todo[] {
    return this.todos;
  }

  create(title: string): Todo {
    const todo: Todo = { id: this.nextId, title };
    this.nextId += 1;
    this.todos.push(todo);
    return todo;
  }
}
