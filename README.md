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
