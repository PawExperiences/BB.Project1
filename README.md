# e2e ticket mirror

A minimal Next.js (App Router, TypeScript) scaffold that renders a static,
kanban-style ticket list grouped by status. Tickets are read from
`data/tickets.json` and displayed on the home page under three headings —
To Do, In Progress, Done — each labeled with a live count.

## Running locally

```bash
npm ci
npm run build
npm start
```

Then open http://localhost:3000.

For local development with hot reload, use `npm run dev` instead of
`npm run build` / `npm start`.

`npm ci && npm run build` must succeed as the project's build/verify step.

## tickets.json data shape

`data/tickets.json` is an array of ticket objects. Each ticket has the
following shape:

```json
{
  "key": "BB-101",
  "title": "Set up project repository",
  "status": "Done",
  "assignee": "Alex Chen"
}
```

- `key` — string, the unique ticket identifier.
- `title` — string, the ticket's title.
- `status` — string, one of `"To Do"`, `"In Progress"`, `"Done"`.
- `assignee` — string, the assignee's full display name. May be an empty
  string when the ticket is unassigned.
