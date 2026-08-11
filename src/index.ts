import { buildApp } from './app.js';

export const app = buildApp();

function isEntryPoint(): boolean {
  return process.argv[1] !== undefined && import.meta.url === `file://${process.argv[1]}`;
}

if (isEntryPoint()) {
  const port = process.env.PORT ? Number(process.env.PORT) : 3000;

  app
    .listen({ port, host: '0.0.0.0' })
    .catch((error) => {
      app.log.error(error);
      process.exit(1);
    });
}
