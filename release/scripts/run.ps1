# Builds (if needed) and starts the todo-api server.
# Run this to serve the app locally or in a deployment environment; it
# listens on $env:PORT (default 3000), per the app's own fallback logic.

$ErrorActionPreference = "Stop"

if (-not (Test-Path "dist")) {
    Write-Host "==> No build output found, building first"
    npm run build
    if ($LASTEXITCODE -ne 0) { exit $LASTEXITCODE }
}

$Port = $env:PORT
if (-not $Port) { $Port = "3000" }
Write-Host "==> Starting todo-api on port $Port"
npm start
exit $LASTEXITCODE
