@echo off
title SA-3000P Auto Image OCR Sync to MSR
powershell.exe -ExecutionPolicy Bypass -NoProfile -File "%~dp0image_sync_sa3000p.ps1"
pause
