param(
    [string]$OutputDirectory = "pages-dist"
)

$ErrorActionPreference = "Stop"

$repoRoot = (Resolve-Path -LiteralPath (Join-Path $PSScriptRoot "..")).Path
$outputPath = if ([IO.Path]::IsPathRooted($OutputDirectory)) {
    [IO.Path]::GetFullPath($OutputDirectory)
} else {
    [IO.Path]::GetFullPath((Join-Path $repoRoot $OutputDirectory))
}

$repoPrefix = $repoRoot.TrimEnd([IO.Path]::DirectorySeparatorChar) + [IO.Path]::DirectorySeparatorChar
if ($outputPath -eq $repoRoot -or -not $outputPath.StartsWith($repoPrefix, [StringComparison]::OrdinalIgnoreCase)) {
    throw "Pages output must stay inside the repository and cannot be its root: $outputPath"
}

if (Test-Path -LiteralPath $outputPath) {
    $resolvedOutput = (Resolve-Path -LiteralPath $outputPath).Path
    if (-not $resolvedOutput.StartsWith($repoPrefix, [StringComparison]::OrdinalIgnoreCase)) {
        throw "Refusing to remove unexpected Pages output: $resolvedOutput"
    }
    Remove-Item -LiteralPath $resolvedOutput -Recurse -Force
}

New-Item -ItemType Directory -Path $outputPath | Out-Null
Copy-Item -LiteralPath (Join-Path $repoRoot "index.html") -Destination $outputPath
Copy-Item -LiteralPath (Join-Path $repoRoot "styles.css") -Destination $outputPath
Copy-Item -LiteralPath (Join-Path $repoRoot "src") -Destination $outputPath -Recurse

$htmlPath = Join-Path $outputPath "index.html"
$html = Get-Content -Raw -LiteralPath $htmlPath
$references = @(
    [regex]::Matches($html, '(?:src|href)="([^"]+)"') |
        ForEach-Object { $_.Groups[1].Value } |
        Where-Object { $_ -notmatch '^(?:https?:|#|data:|mailto:|javascript:)' } |
        Sort-Object -Unique
)
$missingReferences = @(
    foreach ($reference in $references) {
        $relativePath = ($reference -split '[?#]')[0]
        if ($relativePath -and -not (Test-Path -LiteralPath (Join-Path $outputPath $relativePath))) {
            $reference
        }
    }
)
if ($missingReferences.Count -gt 0) {
    throw "Pages output is missing referenced assets: $($missingReferences -join ', ')"
}

$files = @(Get-ChildItem -LiteralPath $outputPath -Recurse -File)
$largest = $files | Sort-Object Length -Descending | Select-Object -First 1
if ($largest.Length -gt 25MB) {
    throw "Pages file exceeds the 25 MiB limit: $($largest.FullName)"
}

[pscustomobject]@{
    Output = $outputPath
    Files = $files.Count
    Bytes = ($files | Measure-Object -Property Length -Sum).Sum
    LargestFile = $largest.Name
    LargestBytes = $largest.Length
    ReferencedAssets = $references.Count
}
