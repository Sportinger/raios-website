[CmdletBinding()]
param()

$ErrorActionPreference = "Stop"

$repoRoot = (Resolve-Path (Join-Path $PSScriptRoot "..")).Path
Set-Location $repoRoot

$currentBranch = (& git branch --show-current).Trim()
if ($LASTEXITCODE -ne 0) {
    throw "Der aktuelle Git-Branch konnte nicht ermittelt werden."
}

if ($currentBranch -ne "three.js") {
    & git switch three.js
    if ($LASTEXITCODE -ne 0) {
        throw "Der Wechsel auf den Branch three.js ist fehlgeschlagen."
    }
}

$python = (Get-Command python -ErrorAction Stop).Source
$serverProcess = $null
$serverUrl = $null
$projectPattern = "raiOS.+Scroll Layers"

foreach ($port in 8091..8100) {
    $candidateUrl = "http://localhost:$port/"

    $response = $null

    try {
        $response = Invoke-WebRequest -UseBasicParsing -Uri $candidateUrl -TimeoutSec 1
    }
    catch {
        # The port is unused or does not serve an HTTP page.
        continue
    }

    if ($response.StatusCode -ne 200 -or $response.Content -notmatch $projectPattern) {
        continue
    }

    $processIds = @(
        Get-NetTCPConnection -State Listen -LocalPort $port -ErrorAction SilentlyContinue |
            Select-Object -ExpandProperty OwningProcess -Unique
    )
    foreach ($processId in $processIds) {
        Stop-Process -Id $processId -Force -ErrorAction Stop
        Write-Host "Vorherigen Three.js-Devserver auf Port $port beendet." -ForegroundColor DarkGray
    }
}

Start-Sleep -Milliseconds 250

foreach ($port in 8091..8100) {
    $candidateUrl = "http://localhost:$port/"
    $listener = Get-NetTCPConnection -State Listen -LocalPort $port -ErrorAction SilentlyContinue
    if (-not $listener) {
        $serverProcess = Start-Process `
            -FilePath $python `
            -ArgumentList @("-m", "http.server", "$port") `
            -WorkingDirectory $repoRoot `
            -WindowStyle Hidden `
            -PassThru
        $serverUrl = $candidateUrl
        break
    }
}

if (-not $serverUrl) {
    throw "Zwischen Port 8091 und 8100 wurde kein freier Port gefunden."
}

if ($serverProcess) {
    $serverReady = $false
    foreach ($attempt in 1..20) {
        try {
            $response = Invoke-WebRequest -UseBasicParsing -Uri $serverUrl -TimeoutSec 1
            if ($response.StatusCode -eq 200 -and $response.Content -match $projectPattern) {
                $serverReady = $true
                break
            }
        }
        catch {
            Start-Sleep -Milliseconds 250
        }
    }

    if (-not $serverReady) {
        Stop-Process -Id $serverProcess.Id -ErrorAction SilentlyContinue
        throw "Der lokale Three.js-Webserver konnte nicht gestartet werden."
    }
}

Start-Process $serverUrl

$Host.UI.RawUI.WindowTitle = "raiOS Three.js - Codex YOLO"
Write-Host ""
Write-Host "Three.js: $serverUrl" -ForegroundColor Cyan
Write-Host "Codex startet mit deaktivierter Sandbox und ohne Rueckfragen." -ForegroundColor Yellow
Write-Host ""

& codex --dangerously-bypass-approvals-and-sandbox -C $repoRoot
if ($LASTEXITCODE -ne 0) {
    throw "Codex wurde mit Exit-Code $LASTEXITCODE beendet."
}
