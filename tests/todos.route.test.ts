import { beforeEach, describe, expect, it } from 'vitest';
import type { FastifyInstance } from 'fastify';
import { buildApp } from '../src/app.js';

describe('DELETE /todos/:id', () => {
  let app: FastifyInstance;

  beforeEach(() => {
    app = buildApp();
  });

  it('deletes an existing todo and returns 204 with an empty body', async () => {
    const createResponse = await app.inject({
      method: 'POST',
      url: '/todos',
      payload: { title: 'buy milk' },
    });
    const created = createResponse.json() as { id: number };

    const deleteResponse = await app.inject({
      method: 'DELETE',
      url: `/todos/${created.id}`,
    });

    expect(deleteResponse.statusCode).toBe(204);
    expect(deleteResponse.body).toBe('');

    const listResponse = await app.inject({ method: 'GET', url: '/todos' });
    expect(listResponse.json()).not.toContainEqual(expect.objectContaining({ id: created.id }));
  });

  it('returns 404 for a numeric id that does not match any todo', async () => {
    const response = await app.inject({ method: 'DELETE', url: '/todos/999999' });

    expect(response.statusCode).toBe(404);
  });

  it.each(['abc', '1.5', '-1', '0'])('returns 404, not 400, for a non-numeric id (%s)', async (id) => {
    const response = await app.inject({ method: 'DELETE', url: `/todos/${id}` });

    expect(response.statusCode).toBe(404);
  });

  it('returns 404, not 400, for an empty id segment', async () => {
    const response = await app.inject({ method: 'DELETE', url: '/todos/' });

    expect(response.statusCode).toBe(404);
  });
});
