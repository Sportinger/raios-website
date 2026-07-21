[CmdletBinding()]
param(
    [switch]$SkipBuild
)

$ErrorActionPreference = "Stop"
$repoRoot = (Resolve-Path -LiteralPath (Join-Path $PSScriptRoot "..")).Path

$javaScriptFiles = @(
    & rg --files -g "*.js" -g "*.mjs" -g "!pages-dist/**" $repoRoot
)
if ($LASTEXITCODE -ne 0 -or $javaScriptFiles.Count -eq 0) {
    throw "No JavaScript files were found for validation."
}

foreach ($file in $javaScriptFiles) {
    & node --check $file
    if ($LASTEXITCODE -ne 0) {
        throw "JavaScript syntax check failed: $file"
    }
}
Write-Host "JavaScript syntax OK: $($javaScriptFiles.Count) files"

& node (Join-Path $PSScriptRoot "check-module-graph.mjs")
if ($LASTEXITCODE -ne 0) {
    throw "The source module graph is invalid."
}

if (-not $SkipBuild) {
    & (Join-Path $PSScriptRoot "build-pages-site.ps1")
    if ($LASTEXITCODE -ne 0) {
        throw "The production build failed."
    }
}
