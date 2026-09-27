@echo off
chcp 65001 >nul
title คัดลอกไฟล์ที่อัปเดตลงแฟลชไดรฟ์
echo ========================================================
echo   กำลังค้นหาแฟลชไดรฟ์เพื่อคัดลอกไฟล์เวอร์ชันล่าสุด...
echo ========================================================
echo.

set "FOUND_DRIVE="
for %%D in (D E F G H I J K) do (
    if exist "%%D:\msr_sender_widget.ps1" (
        set "FOUND_DRIVE=%%D"
        goto :do_copy
    )
    if exist "%%D:\สำหรับลงเครื่อง_SA3000P" (
        set "FOUND_DRIVE=%%D"
        goto :do_copy
    )
)

:prompt_drive
echo ยังไม่พบแฟลชไดรฟ์ที่มีไฟล์เดิม กรุณาเสียบแฟลชไดรฟ์แล้วพิมพ์ตัวอักษรไดรฟ์ (เช่น E) :
set /p USER_DRV=Drive letter: 
if "%USER_DRV%"=="" goto :prompt_drive
set "FOUND_DRIVE=%USER_DRV:~0,1%"

:do_copy
echo พบแฟลชไดรฟ์ที่ไดรฟ์ %FOUND_DRIVE%:\
echo กำลังคัดลอกไฟล์ที่แก้ไขแล้วลงแฟลชไดรฟ์...

if not exist "%FOUND_DRIVE%:\สำหรับลงเครื่อง_SA3000P" mkdir "%FOUND_DRIVE%:\สำหรับลงเครื่อง_SA3000P"
copy /y "%~dp0msr_sender_widget.ps1" "%FOUND_DRIVE%:\สำหรับลงเครื่อง_SA3000P\"
copy /y "%~dp0image_sync_sa3000p.ps1" "%FOUND_DRIVE%:\สำหรับลงเครื่อง_SA3000P\"
copy /y "%~dp0Send_to_MSR.bat" "%FOUND_DRIVE%:\สำหรับลงเครื่อง_SA3000P\"
copy /y "%~dp0ส่งผลตรวจ_SA3000P_เข้า_MSR.bat" "%FOUND_DRIVE%:\สำหรับลงเครื่อง_SA3000P\"
copy /y "%~dp0msr_sender_widget.ps1" "%FOUND_DRIVE%:\"

echo.
echo ========================================================
echo   คัดลอกไฟล์ลงแฟลชไดรฟ์สำเร็จเรียบร้อยแล้วค่ะ!
echo   สามารถนำแฟลชไดรฟ์ไปเสียบที่เครื่อง SA-3000P ได้เลยนะคะ
echo ========================================================
pause
