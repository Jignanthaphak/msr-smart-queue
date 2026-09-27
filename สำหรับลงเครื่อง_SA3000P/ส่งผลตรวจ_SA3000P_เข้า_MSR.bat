@echo off
title MSR Biofeedback Sender (SA-3000P)
cd /d "%~dp0"

set "TARGET_PS1="
if exist "%~dp0msr_sender_widget.ps1" (
    set "TARGET_PS1=%~dp0msr_sender_widget.ps1"
) else if exist "%~dp0_deploy_bio_sa3000\msr_sender_widget.ps1" (
    set "TARGET_PS1=%~dp0_deploy_bio_sa3000\msr_sender_widget.ps1"
) else if exist "%USERPROFILE%\Desktop\_deploy_bio_sa3000\msr_sender_widget.ps1" (
    set "TARGET_PS1=%USERPROFILE%\Desktop\_deploy_bio_sa3000\msr_sender_widget.ps1"
)

if "%TARGET_PS1%"=="" (
    echo [ERROR] Cannot find msr_sender_widget.ps1
    echo Please make sure msr_sender_widget.ps1 is in this folder or in _deploy_bio_sa3000.
    pause
    exit /b 1
)

echo Launching MSR Biofeedback Sender...
powershell.exe -ExecutionPolicy Bypass -NoProfile -File "%TARGET_PS1%"

if %errorlevel% neq 0 (
    echo.
    echo Application exited with error code: %errorlevel%
    pause
)
