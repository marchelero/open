@echo off
REM Thin launcher - all installer logic lives in init-opencode.js (single source of truth).
REM Usage: init-opencode.cmd --project-path "C:\mi-proyecto"
node "%~dp0init-opencode.js" %*
exit /b %ERRORLEVEL%
