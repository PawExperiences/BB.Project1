import { z } from 'zod';

export const createTodoSchema = z.object({
  title: z.string(),
});

export type CreateTodoInput = z.infer<typeof createTodoSchema>;

export const todoIdParamSchema = z.object({
  id: z.coerce.number().int().positive(),
});

export type TodoIdParam = z.infer<typeof todoIdParamSchema>;

export interface Todo {
  id: number;
  title: string;
}
