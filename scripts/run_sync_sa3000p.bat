@echo off
title SA-3000P Auto Sync to MSR (ศูนย์สุขภาพจิตที่ 4)
color 0A
echo ==========================================================
echo    SA-3000P Auto Sync to MSR System (ศูนย์สุขภาพจิตที่ 4)
echo ==========================================================
echo Starting background auto-sync watcher...
echo.

powershell.exe -ExecutionPolicy Bypass -NoProfile -File "%~dp0sa_sync.ps1"

pause
