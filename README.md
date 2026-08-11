# todo-api

A minimal Todo HTTP API built with [Fastify](https://fastify.dev/) and TypeScript (strict mode).

## Architecture

The service is layered as `routes -> controllers -> services -> repositories`:

- `src/routes` — registers Fastify routes and wires up the layers below.
- `src/controllers` — Fastify request handlers; validates input with [zod](https://zod.dev/) and shapes HTTP responses.
- `src/services` — business logic.
- `src/repositories` — data access; currently an in-memory store that lives for the process lifetime.

The Fastify app is built by `buildApp()` in `src/app.ts` and exported (as `app`) from `src/index.ts` without being started. `src/index.ts` only calls `.listen()` when the file is run directly as the entry point, so the app can also be imported and started on an ephemeral port (e.g. by tests).

## Install

```sh
npm install
```

## Build

```sh
npm run build
```

Compiles the TypeScript sources in `src/` to `dist/`.

## Run

```sh
npm run build
npm start
```

Or, for local development without a build step:

```sh
npm run dev
```

The server listens on `process.env.PORT`, falling back to `3000`.

## Test

```sh
npm test
```

Runs the Vitest suite (`vitest run --passWithNoTests`).

## API

### `GET /todos`

Returns the current list of todos.

- **Response**: `200 OK`, `Content-Type: application/json`
- **Body**: a JSON array of todos (`[]` when none exist), e.g.:

  ```json
  [{ "id": 1, "title": "buy milk" }]
  ```

### `POST /todos`

Creates a new todo.

- **Request body**: `{ "title": string }`
- **Response (success)**: `201 Created`
- **Body (success)**: the created todo, with an auto-incrementing integer `id` starting at 1:

  ```json
  { "id": 1, "title": "buy milk" }
  ```

- **Response (invalid body)**: if `title` is missing or is not a string, `400 Bad Request`
- **Body (invalid body)**:

  ```json
  { "error": "title is required and must be a string" }
  ```

### `DELETE /todos/:id`

Deletes the todo matching `:id`.

- **Response (success)**: `204 No Content` with an empty body. The todo is durably removed and no longer appears in `GET /todos`.
- **Response (not found)**: `404 Not Found` if `:id` does not match an existing todo. This includes ids that aren't valid positive integers (e.g. alphabetic, decimal, negative, or empty) — those are treated the same as "not found" rather than a `400 Bad Request`.

### Anything else

Any request to a path or method not covered above (e.g. `GET /unknown`) returns `404 Not Found`.
