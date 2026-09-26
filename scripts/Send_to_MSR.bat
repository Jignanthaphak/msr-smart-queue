@echo off
title Send to MSR
powershell.exe -ExecutionPolicy Bypass -NoProfile -WindowStyle Hidden -File "%~dp0msr_sender_widget.ps1"
