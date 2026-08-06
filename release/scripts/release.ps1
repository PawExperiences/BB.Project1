# release.ps1 - Build prime_tester, tag v0.3.0, push tag to origin.
# Run from the repository root after all 0.3.0 changes are merged to main.
[CmdletBinding()]
param()
Set-StrictMode -Version Latest
$ErrorActionPreference = 'Stop'

$Version = '0.3.0'
$Tag = "v$Version"
$BuildDir = 'build'

function Invoke-Step {
    param([string[]]$Cmd)
    Write-Host ">>> $($Cmd -join ' ')"
    & $Cmd[0] $Cmd[1..($Cmd.Length-1)]
    if ($LASTEXITCODE -ne 0) { throw "Command failed: $($Cmd -join ' ')" }
}

# 1. Configure
Invoke-Step cmake, '-S', '.', '-B', $BuildDir, '-DCMAKE_BUILD_TYPE=Release'
# 2. Build
Invoke-Step cmake, '--build', $BuildDir
Write-Host "Build complete. Artifact: $BuildDir\prime_tester.exe"

# 3. Check tag does not already exist remotely
$remote = git ls-remote --tags origin $Tag 2>&1
if ($remote -match [regex]::Escape($Tag)) {
    throw "ERROR: tag $Tag already exists on origin. Aborting."
}

# 4. Create annotated tag
Invoke-Step git, 'tag', '-a', $Tag, '-m', "Release e2e prime tester $Version"
# 5. Push tag
Invoke-Step git, 'push', 'origin', $Tag
Write-Host "Tag $Tag pushed to origin. Upload the artifact to the GitHub release manually."
