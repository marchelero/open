#!/usr/bin/env pwsh
# Thin launcher — all installer logic lives in init-opencode.js (single source of truth).
# Usage: .\init-opencode.ps1 -ProjectPath "C:\mi-proyecto"   (or any init-opencode.js flag)
$ErrorActionPreference = "Stop"
$dir = Split-Path -Parent $MyInvocation.MyCommand.Path
& node (Join-Path $dir "init-opencode.js") @args
exit $LASTEXITCODE
