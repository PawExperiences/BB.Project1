import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import type { FastifyInstance } from 'fastify';
import { buildApp } from '../src/app.js';

describe('todo routes', () => {
  let app: FastifyInstance;
  let baseUrl: string;

  beforeAll(async () => {
    app = buildApp();
    await app.listen({ port: 0, host: '127.0.0.1' });

    const address = app.server.address();
    if (address === null || typeof address === 'string') {
      throw new Error('expected server to listen on a network port');
    }

    baseUrl = `http://127.0.0.1:${address.port}`;
  });

  afterAll(async () => {
    await app.close();
  });

  it('returns an empty list when no todos have been created', async () => {
    const response = await fetch(`${baseUrl}/todos`);

    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toEqual([]);
  });

  it('creates a todo with a valid title and returns 201 with id 1', async () => {
    const response = await fetch(`${baseUrl}/todos`, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ title: 'Buy milk' }),
    });

    expect(response.status).toBe(201);
    await expect(response.json()).resolves.toEqual({ id: 1, title: 'Buy milk' });
  });

  it('lists the todo created above', async () => {
    const response = await fetch(`${baseUrl}/todos`);

    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toEqual([{ id: 1, title: 'Buy milk' }]);
  });

  it('creates a second todo and returns 201 with id 2', async () => {
    const response = await fetch(`${baseUrl}/todos`, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ title: 'Walk the dog' }),
    });

    expect(response.status).toBe(201);
    await expect(response.json()).resolves.toEqual({ id: 2, title: 'Walk the dog' });
  });

  it('rejects creating a todo with a missing title', async () => {
    const response = await fetch(`${baseUrl}/todos`, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({}),
    });

    expect(response.status).toBe(400);
  });

  it('returns 404 for an unregistered path', async () => {
    const response = await fetch(`${baseUrl}/unknown-route`);

    expect(response.status).toBe(404);
  });
});
