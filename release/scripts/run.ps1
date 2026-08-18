<#
.SYNOPSIS
  run.ps1 -- start Space Invaders 0.1.0.

.DESCRIPTION
  WHAT IT DOES: opens the game's index.html in the default web browser via
  a file:// URL. The game is fully static (no server, no build step, no
  dependencies), so this is all that is needed to play.
  WHEN TO RUN: any time you want to play or smoke-test the released game.

.EXAMPLE
  powershell -File release\scripts\run.ps1
#>

$Root  = Resolve-Path (Join-Path $PSScriptRoot "..\..")
$Index = Join-Path $Root "index.html"

if (-not (Test-Path $Index)) {
  Write-Host "ERROR: index.html not found at $Index"
  Write-Host "Run this script from a checkout (or unpacked zip) of the release."
  exit 1
}

Write-Host "Opening $Index in the default browser ..."
Start-Process $Index
Write-Host "Controls: ENTER = start/advance scene, Arrow keys or A/D = move, Space = fire."
