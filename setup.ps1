#!/usr/bin/env pwsh
# setup.ps1 - Install opencode starter pack into a target project.
#
# Usage:
#   pwsh ./setup.ps1 -Target <path>        Install (interactive)
#   pwsh ./setup.ps1 -Target .             Install in current dir
#   pwsh ./setup.ps1 -Target <path> -DryRun  Preview only, no changes
#   pwsh ./setup.ps1 -Target <path> -Force   No prompts, overwrite AGENTS.md
#
# What it copies:
#   - opencode.json        (required)
#   - instructions/         (required, rules)
#   - .opencode/            (required, agents + skills + junctions)
#   - .agents/skills/       (optional, user-installed skills like caveman)
#   - AGENTS.md             (optional, prompts if target already has one)
#
# What it skips:
#   - STARTER.md            (describes this repo, not your project)
#   - .git/                 (never copy git history)
#   - .opencode/.gitignore  (handled by .opencode/ recursion)

[CmdletBinding()]
param(
    [Parameter(Mandatory = $true, Position = 0)]
    [string]$Target,

    [switch]$DryRun,
    [switch]$Force
)

$ErrorActionPreference = "Stop"

$ScriptDir = $PSScriptRoot
if (-not $ScriptDir) { $ScriptDir = (Get-Location).Path }

# Resolve target
if (-not (Test-Path -LiteralPath $Target -PathType Container)) {
    Write-Host "Error: target '$Target' is not a directory" -ForegroundColor Red
    exit 1
}
$Target = (Resolve-Path -LiteralPath $Target).Path

Write-Host ""
Write-Host "opencode starter installer" -ForegroundColor Cyan
Write-Host "  source: $ScriptDir"
Write-Host "  target: $Target"
Write-Host ""

# Essential items
$items = @(
    @{ Name = "opencode.json" },
    @{ Name = "instructions" },
    @{ Name = ".opencode" }
)

# Optional items (only if exists in source)
$optional = @()
if (Test-Path -LiteralPath (Join-Path $ScriptDir ".agents/skills") -PathType Container) {
    $optional += @{ Name = ".agents/skills" }
}

# AGENTS.md handling
$sourceAgents = Join-Path $ScriptDir "AGENTS.md"
$targetAgents = Join-Path $Target "AGENTS.md"
$agentsAction = $null

if (Test-Path -LiteralPath $sourceAgents) {
    if (Test-Path -LiteralPath $targetAgents) {
        if ($Force) {
            $agentsAction = "overwrite"
        } elseif ($DryRun) {
            $agentsAction = "skip"  # default in dry-run
        } else {
            Write-Host "AGENTS.md already exists in target." -ForegroundColor Yellow
            $choice = Read-Host "  [O]verwrite / [S]kip / [M]erge  [S]"
            if ([string]::IsNullOrEmpty($choice)) {
                # Non-interactive mode (piped), default to skip
                $choice = "S"
            }
            switch ($choice.ToUpper()) {
                "O" { $agentsAction = "overwrite" }
                "M" { $agentsAction = "merge" }
                default { $agentsAction = "skip" }
            }
        }
    } else {
        $agentsAction = "copy"
    }
}

# Plan
Write-Host "Plan:" -ForegroundColor Cyan
foreach ($i in $items) { Write-Host "  COPY $($i.Name)" }
foreach ($i in $optional) { Write-Host "  COPY $($i.Name)  (optional, user skills)" }
if ($agentsAction) {
    Write-Host "  AGENTS.md: $agentsAction"
} else {
    Write-Host "  AGENTS.md: skip (no source)"
}
Write-Host "  SKIP STARTER.md  (only applies to this repo)" -ForegroundColor DarkGray
Write-Host ""

if ($DryRun) {
    Write-Host "[DRY-RUN] nothing changed. re-run without -DryRun to apply." -ForegroundColor Yellow
    exit 0
}

if (-not $Force) {
    $confirm = Read-Host "Proceed? [Y/n]"
    if ($confirm -ne "" -and $confirm.ToUpper() -ne "Y") {
        Write-Host "Cancelled" -ForegroundColor Yellow
        exit 0
    }
}

# Execute
$count = 0
foreach ($i in $items) {
    $src = Join-Path $ScriptDir $i.Name
    $dst = Join-Path $Target $i.Name
    if (Test-Path -LiteralPath $src) {
        if (Test-Path -LiteralPath $dst) { Remove-Item -LiteralPath $dst -Recurse -Force }
        Copy-Item -LiteralPath $src -Destination $dst -Recurse -Force
        Write-Host "  + $($i.Name)" -ForegroundColor Green
        $count++
    } else {
        Write-Host "  ! $($i.Name) not found in source" -ForegroundColor Yellow
    }
}

foreach ($i in $optional) {
    $src = Join-Path $ScriptDir $i.Name
    $dst = Join-Path $Target $i.Name
    if (Test-Path -LiteralPath $src) {
        if (Test-Path -LiteralPath $dst) { Remove-Item -LiteralPath $dst -Recurse -Force }
        Copy-Item -LiteralPath $src -Destination $dst -Recurse -Force
        Write-Host "  + $($i.Name)" -ForegroundColor Green
        $count++
    }
}

switch ($agentsAction) {
    { $_ -in "copy", "overwrite" } {
        Copy-Item -LiteralPath $sourceAgents -Destination $targetAgents -Force
        Write-Host "  + AGENTS.md ($agentsAction)" -ForegroundColor Green
        $count++
    }
    "merge" {
        $append = "`n# === opencode starter (merged) ===`n`n" + (Get-Content -LiteralPath $sourceAgents -Raw)
        Add-Content -LiteralPath $targetAgents -Value $append
        Write-Host "  + AGENTS.md (merged at end)" -ForegroundColor Green
        $count++
    }
    "skip" {
        Write-Host "  . AGENTS.md (skipped, target already has one)" -ForegroundColor Yellow
    }
}

# Create backwards-compat junctions in target (opencode 1.17.x scans both singular and plural)
# Copy-Item resolves junctions in source, so we need to:
# 1. Delete the duplicated content that was copied as regular dirs
# 2. Create proper junctions
$targetOpencode = Join-Path $Target ".opencode"
if (Test-Path -LiteralPath $targetOpencode) {
    $agents = Join-Path $targetOpencode "agents"
    $skills = Join-Path $targetOpencode "skills"
    $agentLink = Join-Path $targetOpencode "agent"
    $skillLink = Join-Path $targetOpencode "skill"

    foreach ($pair in @(
        @{ Link = $agentLink; Target = $agents; Name = ".opencode/agent" },
        @{ Link = $skillLink; Target = $skills; Name = ".opencode/skill" }
    )) {
        if (Test-Path -LiteralPath $pair.Target) {
            # Remove any existing duplicate directory (Copy-Item may have copied junction content as regular dir)
            if (Test-Path -LiteralPath $pair.Link) {
                $item = Get-Item -LiteralPath $pair.Link -Force
                if (-not $item.Attributes.HasFlag([System.IO.FileAttributes]::ReparsePoint)) {
                    Remove-Item -LiteralPath $pair.Link -Recurse -Force
                }
            }
            # Create junction
            if (-not (Test-Path -LiteralPath $pair.Link)) {
                try {
                    New-Item -ItemType Junction -Path $pair.Link -Target $pair.Target -Force | Out-Null
                    # Hide the junction so it doesn't show in normal directory listings
                    $junction = Get-Item -LiteralPath $pair.Link -Force
                    $junction.Attributes = $junction.Attributes -bor [System.IO.FileAttributes]::Hidden
                    Write-Host "  + $($pair.Name)  (junction -> $($pair.Target | Split-Path -Leaf), for opencode 1.17.x)" -ForegroundColor Green
                } catch {
                    Write-Host "  ! $($pair.Name) junction failed: $($_.Exception.Message)" -ForegroundColor Yellow
                }
            }
        }
    }
}

Write-Host ""
Write-Host "Done. $count item(s) copied." -ForegroundColor Cyan
Write-Host ""
Write-Host "Next:" -ForegroundColor Green
Write-Host "  cd '$Target'"
Write-Host "  opencode ."
Write-Host ""
Write-Host "To revert: delete opencode.json, instructions/, .opencode/, .agents/skills/, AGENTS.md from target."
