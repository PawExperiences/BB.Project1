import { z } from 'zod';

export const createTodoSchema = z.object({
  title: z.string(),
});

export type CreateTodoInput = z.infer<typeof createTodoSchema>;

export interface Todo {
  id: number;
  title: string;
}
