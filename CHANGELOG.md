## 0.1.0 -- e2e todo api 0.1.0

## [0.1.0] - 2026-08-11

### Added
- Initial `todo-api` HTTP service: a Fastify server in TypeScript strict mode, structured as routes → controllers → services → repositories (`src/app.ts`, `src/index.ts`, `src/routes/todos.route.ts`, `src/controllers/todos.controller.ts`, `src/services/todos.service.ts`, `src/repositories/todos.repository.ts`, `src/schemas/todo.schema.ts`).
- `GET /todos` — returns all todos as a JSON array (`[]` on a fresh process).
- `POST /todos` — creates a todo from `{ "title": string }` (validated with zod); returns `201` with the created `{ id, title }` (auto-incrementing integer id starting at 1), or `400 { "error": "..." }` when `title` is missing or not a string.
- `DELETE /todos/:id` — removes a todo by numeric id; returns `204 No Content` on success. Both an unknown numeric id and a non-numeric id return `404 Not Found` (never `400` for a malformed id, by design).
- Fallback `404` for any path/method not covered by the routes above.
- In-memory, process-lifetime todo repository — no database or migrations in this release.
- Vitest suite (`tests/server.test.ts`, `tests/todos.route.test.ts`) that boots the app on an ephemeral port and drives it with real HTTP requests, covering list/create/delete, id assignment, validation, and the 404 fallback; server is closed in `afterAll`.
- `package.json` (`name: todo-api`, `type: module`) with build/start/test scripts, `tsconfig.json` in strict mode, and `README.md` covering install/build/run and the endpoint contract.

### Changed
- N/A — first release.

### Fixed
- N/A — first release.
