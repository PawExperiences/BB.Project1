#!/bin/sh
# Builds (if needed) and starts the todo-api server.
# Run this to serve the app locally or in a deployment environment; it
# listens on $PORT (default 3000), per the app's own fallback logic.
set -eu

if [ ! -d "dist" ]; then
  echo "==> No build output found, building first"
  npm run build
fi

echo "==> Starting todo-api on port ${PORT:-3000}"
exec npm start
