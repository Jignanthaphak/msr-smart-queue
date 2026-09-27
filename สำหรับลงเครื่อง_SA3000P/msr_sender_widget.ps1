# ==============================================================================
# MSR Biofeedback Sender Widget (Smart Hybrid Edition v4.3)
# สำหรับติดตั้งบนหน้าจอเครื่องตรวจ Medicore SA-3000P ศูนย์สุขภาพจิตที่ 4
# ระบบค้นหาอัจฉริยะ (ดึงเคสล่าสุดอัตโนมัติ หรือพิมพ์ค้นหาตาม HN)
# ==============================================================================

Add-Type -AssemblyName System.Windows.Forms
Add-Type -AssemblyName System.Drawing
Add-Type -AssemblyName System.Runtime.WindowsRuntime

# Force TLS 1.2
try {
    [System.Net.ServicePointManager]::SecurityProtocol = [System.Net.SecurityProtocolType]::Tls12 -bor [System.Net.SecurityProtocolType]::Tls11 -bor [System.Net.SecurityProtocolType]::Tls
    [System.Net.ServicePointManager]::ServerCertificateValidationCallback = {$true}
} catch {}

# Setup WinRT OCR Helper
$asTaskGeneric = ([System.WindowsRuntimeSystemExtensions].GetMethods() | Where-Object { $_.Name -eq 'AsTask' -and $_.GetParameters().Count -eq 1 -and $_.GetParameters()[0].ParameterType.Name -eq 'IAsyncOperation`1' })[0]
function Await-WinRT($asOp, $type) {
    $m = $asTaskGeneric.MakeGenericMethod($type)
    $task = $m.Invoke($null, @($asOp))
    $task.Wait(-1) | Out-Null
    return $task.Result
}

# Preload WinRT types safely
[Windows.Storage.StorageFile, Windows.Storage, ContentType = WindowsRuntime] | Out-Null
[Windows.Storage.FileAccessMode, Windows.Storage, ContentType = WindowsRuntime] | Out-Null
[Windows.Storage.Streams.IRandomAccessStream, Windows.Storage.Streams, ContentType = WindowsRuntime] | Out-Null
[Windows.Globalization.Language, Windows.Globalization, ContentType = WindowsRuntime] | Out-Null
[Windows.Graphics.Imaging.BitmapDecoder, Windows.Graphics.Imaging, ContentType = WindowsRuntime] | Out-Null
[Windows.Graphics.Imaging.SoftwareBitmap, Windows.Graphics.Imaging, ContentType = WindowsRuntime] | Out-Null
[Windows.Media.Ocr.OcrEngine, Windows.Foundation, ContentType = WindowsRuntime] | Out-Null
[Windows.Media.Ocr.OcrResult, Windows.Foundation, ContentType = WindowsRuntime] | Out-Null

function Invoke-WindowsOcr([string]$imagePath) {
    try {
        $file = Await-WinRT ([Windows.Storage.StorageFile]::GetFileFromPathAsync($imagePath)) ([Windows.Storage.StorageFile])
        $stream = Await-WinRT ($file.OpenAsync([Windows.Storage.FileAccessMode]::Read)) ([Windows.Storage.Streams.IRandomAccessStream])
        $decoder = Await-WinRT ([Windows.Graphics.Imaging.BitmapDecoder]::CreateAsync($stream)) ([Windows.Graphics.Imaging.BitmapDecoder])
        $bitmap = Await-WinRT ($decoder.GetSoftwareBitmapAsync()) ([Windows.Graphics.Imaging.SoftwareBitmap])
        $engine = [Windows.Media.Ocr.OcrEngine]::TryCreateFromLanguage([Windows.Globalization.Language]::new('en-US'))
        return Await-WinRT ($engine.RecognizeAsync($bitmap)) ([Windows.Media.Ocr.OcrResult])
    } catch {
        return $null
    }
}

$serverUrl = "https://mhc4.dmh.go.th/msr/api/screening/bio/receive"

# --- ช่วงคะแนนมาตรฐานตามระบบ MSR ---
$scoreRanges = @{
    "ans_activity"              = @{ min = 50; max = 150; nameEn = "1.1 ANS Activity";              nameTh = "การทำงานของระบบประสาทอัตโนมัติ"; rangeText = "50 - 150" }
    "ans_balance"               = @{ min = 0;  max = 150; nameEn = "1.2 ANS Balance";               nameTh = "ความสมดุลของระบบประสาทอัตโนมัติ"; rangeText = "150 - 0" }
    "stress_resistance"         = @{ min = 50; max = 150; nameEn = "2.1 Stress Resistance";         nameTh = "ความทนทานต่อความเครียด";        rangeText = "50 - 150" }
    "stress_index"              = @{ min = 50; max = 150; nameEn = "2.2 Stress Index";              nameTh = "ระดับความเครียด";                rangeText = "150 - 50" }
    "fatigue_index"             = @{ min = 50; max = 150; nameEn = "2.3 Fatigue Index";             nameTh = "ระดับความเหนื่อยล้า";            rangeText = "150 - 50" }
    "mean_heart_rate"           = @{ min = 40; max = 140; nameEn = "3.1 Mean Heart Rate";           nameTh = "อัตราการเต้นของหัวใจเฉลี่ย";      rangeText = "40 - 140" }
    "electro_cardiac_stability" = @{ min = 50; max = 150; nameEn = "3.2 Electro-Cardiac Stability"; nameTh = "ความเสถียรของกระแสไฟฟ้าหัวใจ";  rangeText = "50 - 150" }
    "ectopic_beat"              = @{ min = 0;  max = 999; nameEn = "3.3 Ectopic Beat";              nameTh = "การเต้นของหัวใจผิดจังหวะ";       rangeText = "0 - 999" }
    "wave_level"                = @{ min = 1;  max = 7;   nameEn = "4.1 Wave Level";                nameTh = "ระดับของสภาวะหลอดเลือด";         rangeText = "1 - 7" }
}

# --- Create Form UI ---
$screenH = [System.Windows.Forms.Screen]::PrimaryScreen.WorkingArea.Height
$targetH = [Math]::Min(755, $screenH - 15)

$form = New-Object System.Windows.Forms.Form
$form.Text = "MSR Biofeedback Sender (SA-3000P -> MSR)"
$form.Size = New-Object System.Drawing.Size(540, $targetH)
$form.StartPosition = "CenterScreen"
$form.FormBorderStyle = "FixedDialog"
$form.MaximizeBox = $false
$form.BackColor = [System.Drawing.Color]::FromArgb(248, 250, 252)
$form.TopMost = $true

# Fonts
$fontTitle = New-Object System.Drawing.Font("Segoe UI", 12, [System.Drawing.FontStyle]::Bold)
$fontSub   = New-Object System.Drawing.Font("Segoe UI", 8.5, [System.Drawing.FontStyle]::Regular)
$fontBold  = New-Object System.Drawing.Font("Segoe UI", 9, [System.Drawing.FontStyle]::Bold)
$fontScore = New-Object System.Drawing.Font("Segoe UI", 11, [System.Drawing.FontStyle]::Bold)
$fontRange = New-Object System.Drawing.Font("Segoe UI", 8.5, [System.Drawing.FontStyle]::Regular)
$fontBtn   = New-Object System.Drawing.Font("Segoe UI", 11, [System.Drawing.FontStyle]::Bold)

# Header (Clean Thai text)
$lblHeader = New-Object System.Windows.Forms.Label
$lblHeader.Text = "ส่งผลตรวจ Biofeedback เข้าสู่ระบบ MSR"
$lblHeader.Font = $fontTitle
$lblHeader.ForeColor = [System.Drawing.Color]::FromArgb(16, 149, 106)
$lblHeader.Location = New-Object System.Drawing.Point(18, 10)
$lblHeader.Size = New-Object System.Drawing.Size(490, 24)
$form.Controls.Add($lblHeader)

# Exam Date
$lblExamDate = New-Object System.Windows.Forms.Label
$lblExamDate.Text = "วันเวลาที่ตรวจ: กำลังค้นหาข้อมูลล่าสุด..."
$lblExamDate.Font = $fontSub
$lblExamDate.ForeColor = [System.Drawing.Color]::FromArgb(100, 116, 139)
$lblExamDate.Location = New-Object System.Drawing.Point(20, 35)
$lblExamDate.Size = New-Object System.Drawing.Size(490, 18)
$form.Controls.Add($lblExamDate)

# Patient Box (HN & Name with clean spacing)
$lblHn = New-Object System.Windows.Forms.Label
$lblHn.Text = "HN ผู้รับบริการ (Chart No):"
$lblHn.Font = $fontBold
$lblHn.Location = New-Object System.Drawing.Point(18, 56)
$lblHn.Size = New-Object System.Drawing.Size(175, 18)
$form.Controls.Add($lblHn)

$txtHn = New-Object System.Windows.Forms.TextBox
$txtHn.Font = New-Object System.Drawing.Font("Segoe UI", 10, [System.Drawing.FontStyle]::Bold)
$txtHn.Location = New-Object System.Drawing.Point(18, 75)
$txtHn.Size = New-Object System.Drawing.Size(165, 26)
$form.Controls.Add($txtHn)

$lblName = New-Object System.Windows.Forms.Label
$lblName.Text = "ชื่อ-นามสกุล ผู้รับบริการ:"
$lblName.Font = $fontBold
$lblName.Location = New-Object System.Drawing.Point(198, 56)
$lblName.Size = New-Object System.Drawing.Size(305, 18)
$form.Controls.Add($lblName)

$txtName = New-Object System.Windows.Forms.TextBox
$txtName.Font = New-Object System.Drawing.Font("Segoe UI", 9.5, [System.Drawing.FontStyle]::Regular)
$txtName.Location = New-Object System.Drawing.Point(198, 75)
$txtName.Size = New-Object System.Drawing.Size(305, 26)
$form.Controls.Add($txtName)

# --- Scrollable Panel for 4 Groups ---
$scrollPanel = New-Object System.Windows.Forms.Panel
$scrollPanel.Location = New-Object System.Drawing.Point(14, 108)
$scrollPanel.Size = New-Object System.Drawing.Size(502, 450)
$scrollPanel.AutoScroll = $true
$form.Controls.Add($scrollPanel)

# Input controls dictionary
$inputs = @{}

function Validate-FieldValue([string]$fName) {
    if (!$inputs.ContainsKey($fName)) { return }
    $txtBox = $inputs[$fName]
    $val = $txtBox.Text.Trim()
    if ($val -eq "") { 
        $txtBox.BackColor = [System.Drawing.Color]::White
        return 
    }
    if ($val -notmatch "^\s*[-+]?\d+(\.\d+)?\s*$") {
        $txtBox.BackColor = [System.Drawing.Color]::FromArgb(254, 226, 226)
        return
    }
    $num = [int][Math]::Round([double]$val)
    $r = $scoreRanges[$fName]
    if ($num -lt $r.min -or $num -gt $r.max) {
        $txtBox.BackColor = [System.Drawing.Color]::FromArgb(254, 226, 226)
        return
    }
    $txtBox.BackColor = [System.Drawing.Color]::White
}

# Helper to build a clean numeric row (Field Name + Range Hint + Integer Box)
function Add-CleanBioRow($parentGroup, [string]$fName, [int]$yPos) {
    $info = $scoreRanges[$fName]

    # Title English (bold)
    $lblEn = New-Object System.Windows.Forms.Label
    $lblEn.Text = $info.nameEn
    $lblEn.Font = $fontBold
    $lblEn.ForeColor = [System.Drawing.Color]::FromArgb(15, 23, 42)
    $lblEn.Location = New-Object System.Drawing.Point(12, $yPos)
    $lblEn.Size = New-Object System.Drawing.Size(265, 18)
    $parentGroup.Controls.Add($lblEn)

    # Subtitle Thai (regular)
    $lblTh = New-Object System.Windows.Forms.Label
    $lblTh.Text = "($($info.nameTh))"
    $lblTh.Font = $fontSub
    $lblTh.ForeColor = [System.Drawing.Color]::FromArgb(100, 116, 139)
    $lblTh.Location = New-Object System.Drawing.Point(12, ($yPos + 18))
    $lblTh.Size = New-Object System.Drawing.Size(265, 18)
    $parentGroup.Controls.Add($lblTh)

    # Range Hint [50 - 150]
    $lblR = New-Object System.Windows.Forms.Label
    $lblR.Font = $fontRange
    $lblR.Text = "[$($info.rangeText)]"
    $lblR.ForeColor = [System.Drawing.Color]::FromArgb(100, 116, 139)
    $lblR.TextAlign = [System.Drawing.ContentAlignment]::MiddleRight
    $lblR.Location = New-Object System.Drawing.Point(280, ($yPos + 7))
    $lblR.Size = New-Object System.Drawing.Size(85, 22)
    $parentGroup.Controls.Add($lblR)

    # Score Input Box (Pure Integer Only, Centered)
    $txt = New-Object System.Windows.Forms.TextBox
    $txt.Font = $fontScore
    $txt.TextAlign = [System.Windows.Forms.HorizontalAlignment]::Center
    $txt.Location = New-Object System.Drawing.Point(370, ($yPos + 5))
    $txt.Size = New-Object System.Drawing.Size(95, 27)
    $txt.Text = ""
    $parentGroup.Controls.Add($txt)
    $inputs[$fName] = $txt

    # Live check on typing
    $txt.Add_TextChanged({
        Validate-FieldValue $fName
    })
}

# --- GROUP 1: ระบบประสาทอัตโนมัติ (ANS) ---
$grpAns = New-Object System.Windows.Forms.GroupBox
$grpAns.Text = " 1. ระบบประสาทอัตโนมัติ (ANS) "
$grpAns.Font = $fontBold
$grpAns.ForeColor = [System.Drawing.Color]::FromArgb(30, 41, 59)
$grpAns.Location = New-Object System.Drawing.Point(5, 5)
$grpAns.Size = New-Object System.Drawing.Size(475, 96)
$scrollPanel.Controls.Add($grpAns)

Add-CleanBioRow $grpAns "ans_activity" 18
Add-CleanBioRow $grpAns "ans_balance"  54

# --- GROUP 2: ความเครียด (Stress) ---
$grpStress = New-Object System.Windows.Forms.GroupBox
$grpStress.Text = " 2. สภาวะความเครียดและความเหนื่อยล้า (Stress && Fatigue) "
$grpStress.Font = $fontBold
$grpStress.ForeColor = [System.Drawing.Color]::FromArgb(30, 41, 59)
$grpStress.Location = New-Object System.Drawing.Point(5, 106)
$grpStress.Size = New-Object System.Drawing.Size(475, 134)
$scrollPanel.Controls.Add($grpStress)

Add-CleanBioRow $grpStress "stress_resistance" 18
Add-CleanBioRow $grpStress "stress_index"      54
Add-CleanBioRow $grpStress "fatigue_index"     90

# --- GROUP 3: การทำงานของหัวใจ (Cardiac) ---
$grpHeart = New-Object System.Windows.Forms.GroupBox
$grpHeart.Text = " 3. การทำงานของหัวใจ (Cardiac && Stability) "
$grpHeart.Font = $fontBold
$grpHeart.ForeColor = [System.Drawing.Color]::FromArgb(30, 41, 59)
$grpHeart.Location = New-Object System.Drawing.Point(5, 246)
$grpHeart.Size = New-Object System.Drawing.Size(475, 134)
$scrollPanel.Controls.Add($grpHeart)

Add-CleanBioRow $grpHeart "mean_heart_rate"           18
Add-CleanBioRow $grpHeart "electro_cardiac_stability" 54
Add-CleanBioRow $grpHeart "ectopic_beat"              90

# --- GROUP 4: สภาวะหลอดเลือด (Vascular) ---
$grpWave = New-Object System.Windows.Forms.GroupBox
$grpWave.Text = " 4. สภาวะหลอดเลือด (Vascular) "
$grpWave.Font = $fontBold
$grpWave.ForeColor = [System.Drawing.Color]::FromArgb(30, 41, 59)
$grpWave.Location = New-Object System.Drawing.Point(5, 386)
$grpWave.Size = New-Object System.Drawing.Size(475, 58)
$scrollPanel.Controls.Add($grpWave)

Add-CleanBioRow $grpWave "wave_level" 18

# Bottom Controls Position
$yBottom = 562

# Image Info Label
$lblImageInfo = New-Object System.Windows.Forms.Label
$lblImageInfo.Text = "ภาพรายงาน: กำลังค้นหาไฟล์ภาพ DDR และ APG..."
$lblImageInfo.Location = New-Object System.Drawing.Point(16, $yBottom)
$lblImageInfo.Size = New-Object System.Drawing.Size(498, 30)
$lblImageInfo.Font = $fontSub
$lblImageInfo.ForeColor = [System.Drawing.Color]::FromArgb(79, 70, 229)
$form.Controls.Add($lblImageInfo)

# Buttons Row
$btnScanAgain = New-Object System.Windows.Forms.Button
$btnScanAgain.Text = "ดึงผลตรวจ (ตาม HN / ล่าสุด)"
$btnScanAgain.Location = New-Object System.Drawing.Point(16, ($yBottom + 32))
$btnScanAgain.Size = New-Object System.Drawing.Size(210, 32)
$btnScanAgain.BackColor = [System.Drawing.Color]::FromArgb(238, 242, 255)
$btnScanAgain.ForeColor = [System.Drawing.Color]::FromArgb(67, 56, 202)
$btnScanAgain.FlatStyle = [System.Windows.Forms.FlatStyle]::Flat
$btnScanAgain.Font = $fontBold
$btnScanAgain.Cursor = [System.Windows.Forms.Cursors]::Hand
$form.Controls.Add($btnScanAgain)

$btnClear = New-Object System.Windows.Forms.Button
$btnClear.Text = "ล้างหน้าจอ"
$btnClear.Location = New-Object System.Drawing.Point(232, ($yBottom + 32))
$btnClear.Size = New-Object System.Drawing.Size(100, 32)
$btnClear.BackColor = [System.Drawing.Color]::FromArgb(254, 242, 242)
$btnClear.ForeColor = [System.Drawing.Color]::FromArgb(185, 28, 28)
$btnClear.FlatStyle = [System.Windows.Forms.FlatStyle]::Flat
$btnClear.Font = $fontBold
$btnClear.Cursor = [System.Windows.Forms.Cursors]::Hand
$form.Controls.Add($btnClear)

$btnBrowseFolder = New-Object System.Windows.Forms.Button
$btnBrowseFolder.Text = "เลือกโฟลเดอร์ภาพ..."
$btnBrowseFolder.Location = New-Object System.Drawing.Point(338, ($yBottom + 32))
$btnBrowseFolder.Size = New-Object System.Drawing.Size(176, 32)
$btnBrowseFolder.BackColor = [System.Drawing.Color]::FromArgb(241, 245, 249)
$btnBrowseFolder.FlatStyle = [System.Windows.Forms.FlatStyle]::Flat
$btnBrowseFolder.Font = $fontBold
$btnBrowseFolder.Cursor = [System.Windows.Forms.Cursors]::Hand
$form.Controls.Add($btnBrowseFolder)

# Status Label
$lblStatus = New-Object System.Windows.Forms.Label
$lblStatus.Text = "พร้อมส่งข้อมูลเข้าสู่ระบบ MSR"
$lblStatus.TextAlign = [System.Drawing.ContentAlignment]::MiddleCenter
$lblStatus.Location = New-Object System.Drawing.Point(16, ($yBottom + 67))
$lblStatus.Size = New-Object System.Drawing.Size(498, 18)
$lblStatus.Font = $fontSub
$lblStatus.ForeColor = [System.Drawing.Color]::FromArgb(100, 116, 139)
$form.Controls.Add($lblStatus)

# Big Send Button
$btnSend = New-Object System.Windows.Forms.Button
$btnSend.Text = "ส่งผลตรวจและภาพรายงานเข้าสู่ระบบ MSR"
$btnSend.Font = $fontBtn
$btnSend.Location = New-Object System.Drawing.Point(16, ($yBottom + 88))
$btnSend.Size = New-Object System.Drawing.Size(498, 48)
$btnSend.BackColor = [System.Drawing.Color]::FromArgb(16, 149, 106)
$btnSend.ForeColor = [System.Drawing.Color]::White
$btnSend.FlatStyle = [System.Windows.Forms.FlatStyle]::Flat
$btnSend.Cursor = [System.Windows.Forms.Cursors]::Hand
$form.Controls.Add($btnSend)

# --- Scanner & Parser Logic (Smart Hybrid: Auto Latest or Search by HN) ---
$activeDdrImage = $null
$activeApgImage = $null

function Clear-FormFields() {
    $script:activeDdrImage = $null
    $script:activeApgImage = $null
    $txtHn.Text = ""
    $txtName.Text = ""
    $lblExamDate.Text = "วันเวลาที่ตรวจ: -"
    foreach ($k in $inputs.Keys) {
        $inputs[$k].Text = ""
        $inputs[$k].BackColor = [System.Drawing.Color]::White
    }
    foreach ($k in $warnLabels.Keys) {
        $warnLabels[$k].Text = ""
    }
    $lblImageInfo.Text = "ยังไม่ได้เลือกเคส (พิมพ์ HN แล้วกด Enter หรือคลิก 'ดึงผลตรวจ' ได้ค่ะ)"
    $lblImageInfo.ForeColor = [System.Drawing.Color]::FromArgb(100, 116, 139)
    $lblStatus.Text = "พร้อมใช้งาน: ระบุ HN แล้วกด Enter หรือคลิก 'ดึงผลตรวจ' ได้เลยค่ะ"
    $lblStatus.ForeColor = [System.Drawing.Color]::FromArgb(100, 116, 139)
}

function Scan-AllData([string]$customFolder = "", [string]$searchHn = "") {
    $script:activeDdrImage = $null
    $script:activeApgImage = $null

    $targetHn = if ($searchHn) { $searchHn.Trim() } else { $txtHn.Text.Trim() }

    # เคลียร์ค่าผลตรวจและชื่อเดิมทุกช่องให้ว่างเสมอ เพื่อไม่ให้มีตัวเลขของเคสเก่าค้าง
    $txtName.Text = ""
    $lblExamDate.Text = "วันเวลาที่ตรวจ: -"
    foreach ($k in $inputs.Keys) {
        $inputs[$k].Text = ""
        $inputs[$k].BackColor = [System.Drawing.Color]::White
    }
    foreach ($k in $warnLabels.Keys) {
        $warnLabels[$k].Text = ""
    }

    $extraDirs = @()
    if ($customFolder -and (Test-Path $customFolder)) {
        $extraDirs += $customFolder
        $p = Split-Path -Parent $customFolder
        if ($p -and (Test-Path $p)) {
            $extraDirs += $p
            $ex = Join-Path $p "EXCELDATA"
            if (Test-Path $ex) { $extraDirs += $ex }
            $im = Join-Path $p "Image"
            if (Test-Path $im) { $extraDirs += $im }
        }
    }

    $candidateDirs = @(
        $extraDirs,
        "C:\SA THAI\Image",
        "C:\SA THAI\EXCELDATA",
        "C:\SA THAI",
        "C:\SAViewer_New THAI\Image",
        "C:\SAViewer_New THAI\EXCELDATA",
        "C:\SAViewer_New THAI",
        "D:\OneDrive\แฟรชไดรฟ\1",
        "D:\OneDrive\แฟรชไดรฟ\SAViewer_New THAI\Image",
        "D:\SAViewer_New THAI\Image",
        "C:\SA\Image"
    ) | Where-Object { $_ -and (Test-Path $_) } | Select-Object -Unique

    # 1. Search for Image Pair (DDR and APG)
    foreach ($dir in $candidateDirs) {
        $filterPattern = if ($targetHn) { "$($targetHn)_*.jpg" } else { "*.jpg" }
        $jpgs = Get-ChildItem -Path $dir -Filter $filterPattern -ErrorAction SilentlyContinue | Sort-Object LastWriteTime -Descending
        
        # Exact match prefix targetHn + '_' so HN 1 doesn't match 105
        if ($targetHn) {
            $escapedHn = [regex]::Escape($targetHn)
            $jpgs = $jpgs | Where-Object { $_.Name -match "^$escapedHn" + "_" }
        }

        $foundDdr = $null
        $foundApg = $null

        # แยกตามกลุ่มชื่อไฟล์ (รองรับทั้งระบบที่มี 2 หน้า และ 3 หน้า, ชื่อ DDR, PTG หรือ APG)
        $fNamedDdr = $jpgs | Where-Object { $_.Name -match "ddr" } | Select-Object -First 1
        $fMain = $jpgs | Where-Object { $_.Name -notmatch "\(\d+\)\.jpe?g$" -and $_.Name -notmatch "(?:ptg|apg)" } | Select-Object -First 1
        $foundDdr = if ($fNamedDdr) { $fNamedDdr } else { $fMain }

        if ($foundDdr) {
            # ดึงคำนำหน้าหลักของชื่อไฟล์เพื่อจับคู่ภาพของเคสเดียวกัน เช่น "51_Suthawan_20260927121600"
            $casePrefix = $foundDdr.BaseName -replace "(?:_ddr|_ptg|_apg|\(\d+\))$", ""
            $candidateApgs = $jpgs | Where-Object { 
                $_.FullName -ne $foundDdr.FullName -and ($_.BaseName -like "$casePrefix*" -or $_.Name -match "^$casePrefix")
            }

            # ลำดับความสำคัญของภาพสภาวะหลอดเลือด (PTG / APG):
            # 1. มีคำว่า ptg หรือ apg ในชื่อไฟล์
            # 2. มี (3) ต่อท้าย (ระบบ 3 หน้า)
            # 3. มี (2) ต่อท้าย (ระบบ 2 หน้าของ SA THAI)
            $foundApg = $candidateApgs | Where-Object { $_.Name -match "(?:ptg|apg)" } | Select-Object -First 1
            if (!$foundApg) {
                $foundApg = $candidateApgs | Where-Object { $_.Name -match "\(3\)\.jpe?g$" } | Select-Object -First 1
            }
            if (!$foundApg) {
                $foundApg = $candidateApgs | Where-Object { $_.Name -match "\(2\)\.jpe?g$" } | Select-Object -First 1
            }
        }

        # กรณีไฟล์เดี่ยวหรือชื่อไม่ตรงแพทเทิร์นข้างต้น ให้ค้นหาแบบ fallback
        if (!$foundDdr) {
            $foundDdr = $jpgs | Where-Object { $_.Name -match "ddr" } | Select-Object -First 1
            if (!$foundDdr) { $foundDdr = $jpgs | Where-Object { $_.Name -notmatch "\(\d+\)\.jpe?g$" } | Select-Object -First 1 }
        }
        if (!$foundApg) {
            $foundApg = $jpgs | Where-Object { $_.Name -match "(?:ptg|apg)" } | Select-Object -First 1
            if (!$foundApg) { $foundApg = $jpgs | Where-Object { $_.Name -match "\(3\)\.jpe?g$" } | Select-Object -First 1 }
            if (!$foundApg) { $foundApg = $jpgs | Where-Object { $_.Name -match "\(2\)\.jpe?g$" } | Select-Object -First 1 }
        }

        if ($foundDdr -or $foundApg) {
            $script:activeDdrImage = $foundDdr
            $script:activeApgImage = $foundApg
            break
        }
    }

    # กรณีไม่ได้ระบุ HN และไม่พบภาพรายงานใดๆ ในโฟลเดอร์ ให้คงหน้าจอว่างเปล่า (ห้ามไปดึงข้อมูลค้างเก่าจาก Excel เด็ดขาด)
    if (!$targetHn -and !$script:activeDdrImage -and !$script:activeApgImage) {
        Clear-FormFields
        return
    }

    # 2. Update Image info Label
    if ($script:activeDdrImage -or $script:activeApgImage) {
        $ddrName = if ($script:activeDdrImage) { $script:activeDdrImage.Name } else { "ไม่พบ" }
        $apgName = if ($script:activeApgImage) { $script:activeApgImage.Name } else { "ไม่พบ" }
        $lblImageInfo.Text = "ภาพรายงาน: DDR ($ddrName) | PTG/APG ($apgName)"
        $lblImageInfo.ForeColor = [System.Drawing.Color]::FromArgb(16, 149, 106)
    } else {
        if ($targetHn) {
            $lblImageInfo.Text = "ยังไม่พบภาพรายงานของ HN: $targetHn ในโฟลเดอร์ภาพค่ะ"
        } else {
            $lblImageInfo.Text = "ยังไม่พบภาพรายงานในโฟลเดอร์ Image (สามารถกดเลือกโฟลเดอร์ภาพได้ค่ะ)"
        }
        $lblImageInfo.ForeColor = [System.Drawing.Color]::FromArgb(100, 116, 139)
    }

    # หากพบภาพ DDR ให้ดึงข้อมูล HN, ชื่อ และวันเวลาจากชื่อไฟล์ภาพทันที และล็อก targetHn ให้ค้นหา Excel เฉพาะ HN นี้
    if ($script:activeDdrImage -and $script:activeDdrImage.Name -match "^(\d+)_([A-Za-z0-9]+)_(\d{8})(\d{4})") {
        $imgHn = $matches[1]
        $imgName = $matches[2]
        $dStr = $matches[3]
        $tStr = $matches[4]
        
        $txtHn.Text = $imgHn
        if (!$txtName.Text -or $txtName.Text -eq "-") { $txtName.Text = $imgName }
        $lblExamDate.Text = "วันเวลาที่ตรวจ: " + $dStr.Substring(6,2) + "/" + $dStr.Substring(4,2) + "/" + $dStr.Substring(0,4) + " " + $tStr.Substring(0,2) + ":" + $tStr.Substring(2,2) + " (จากภาพ DDR)"
        $targetHn = $imgHn
    }

    # 3. Read exact scores from Excel files (ค้นหาเฉพาะเมื่อมี targetHn ที่ชัดเจน)
    $hasExcelScores = $false
    if ($targetHn) {
        foreach ($dir in $candidateDirs) {
            # Check HRVResult
            $hrvFiles = Get-ChildItem -Path $dir -Filter "*HRVResult*.xls" -ErrorAction SilentlyContinue | Sort-Object LastWriteTime -Descending
            if ($hrvFiles -and $hrvFiles.Count -gt 0) {
                $lines = Get-Content $hrvFiles[0].FullName -Encoding Unicode -ErrorAction SilentlyContinue
                if (!$lines -or $lines.Count -lt 2) {
                    $lines = Get-Content $hrvFiles[0].FullName -Encoding UTF8 -ErrorAction SilentlyContinue
                }
                if ($lines -and $lines.Count -ge 2) {
                    $headers = $lines[0].Split("`t") | ForEach-Object { $_.Trim().Trim([char]0xFEFF) }

                    # ค้นหาแถวที่ ChartNo ตรงกับ $targetHn เท่านั้น (ไม่สุ่มเอาแถวสุดท้าย)
                    $targetRow = $null
                    for ($rIdx = $lines.Count - 1; $rIdx -ge 1; $rIdx--) {
                        $rowCols = $lines[$rIdx].Split("`t")
                        if ($rowCols.Count -gt 0) {
                            $chartNo = $rowCols[0].Trim()
                            if ($chartNo -eq $targetHn) {
                                $targetRow = $rowCols
                                break
                            }
                        }
                    }

                    if ($targetRow) {
                        for ($i = 0; $i -lt $headers.Count; $i++) {
                            $h = $headers[$i]
                            $val = if ($i -lt $targetRow.Count) { $targetRow[$i].Trim() } else { "" }
                            
                            if ($h -eq "ChartNo" -and $val) { $txtHn.Text = $val }
                            if ($h -eq "ชื่อ" -and $val -and (!$txtName.Text -or $txtName.Text -eq "-")) { $txtName.Text = $val }
                            if ($h -eq "Exam.Date" -and $val) {
                                $lblExamDate.Text = "วันเวลาที่ตรวจ: $val (จากไฟล์รายงาน)"
                            }

                            if ($val -match "^\s*[-+]?\d+(\.\d+)?\s*$") {
                                $intVal = [string][int][Math]::Round([double]$matches[0])

                                if ($h -match "^การทำงานของระบบประสาทอัตโนมัติ|^ANS Activity$") { $inputs["ans_activity"].Text = $intVal; $hasExcelScores = $true }
                                elseif ($h -match "^ความสมดุลของระบบประสาทอัตโนมัติ|^ANS Balance$") { $inputs["ans_balance"].Text = $intVal; $hasExcelScores = $true }
                                elseif ($h -match "^ความทนทานต่อความเครียด|^Stress Resistance$") { $inputs["stress_resistance"].Text = $intVal; $hasExcelScores = $true }
                                elseif ($h -match "^ระดับความเครียด$|^Stress Index$") { $inputs["stress_index"].Text = $intVal; $hasExcelScores = $true }
                                elseif ($h -match "^ระดับความเหนื่อยล้า$|^Fatigue Index$") { $inputs["fatigue_index"].Text = $intVal; $hasExcelScores = $true }
                                elseif ($h -match "^อัตราการเต้นของหัวใจเฉลี่ย$|^Mean Heart Rate$|^Mean HR$") { $inputs["mean_heart_rate"].Text = $intVal }
                                elseif ($h -match "^ความเสถียรไฟฟ้าหัวใจ$|^ค่าเสถียรไฟฟ้าหัวใจ$|^Electro-Cardiac Stability$|^Stability$") { $inputs["electro_cardiac_stability"].Text = $intVal; $hasExcelScores = $true }
                                elseif ($h -match "^การเต้นหัวใจผิดจังหวะ$|^Ectopic Beat$") { $inputs["ectopic_beat"].Text = $intVal }
                            }
                        }
                    }
                }
            }

            # Check APGResult
            $apgFiles = Get-ChildItem -Path $dir -Filter "*APGResult*.xls" -ErrorAction SilentlyContinue | Sort-Object LastWriteTime -Descending
            if ($apgFiles -and $apgFiles.Count -gt 0) {
                $lines = Get-Content $apgFiles[0].FullName -Encoding Unicode -ErrorAction SilentlyContinue
                if (!$lines -or $lines.Count -lt 2) {
                    $lines = Get-Content $apgFiles[0].FullName -Encoding UTF8 -ErrorAction SilentlyContinue
                }
                if ($lines -and $lines.Count -ge 2) {
                    $headers = $lines[0].Split("`t") | ForEach-Object { $_.Trim().Trim([char]0xFEFF) }

                    $targetRow = $null
                    for ($rIdx = $lines.Count - 1; $rIdx -ge 1; $rIdx--) {
                        $rowCols = $lines[$rIdx].Split("`t")
                        if ($rowCols.Count -gt 0) {
                            $chartNo = $rowCols[0].Trim()
                            if ($chartNo -eq $targetHn) {
                                $targetRow = $rowCols
                                break
                            }
                        }
                    }

                    if ($targetRow) {
                        for ($i = 0; $i -lt $headers.Count; $i++) {
                            $h = $headers[$i]
                            $val = if ($i -lt $targetRow.Count) { $targetRow[$i].Trim() } else { "" }

                            if ($h -match "Wave Type") {
                                if ($val -match "ระดับ\s*(\d+)") {
                                    $inputs["wave_level"].Text = $matches[1]
                                    $hasExcelScores = $true
                                } elseif ($val -match "\b([1-7])\b") {
                                    $inputs["wave_level"].Text = $matches[1]
                                    $hasExcelScores = $true
                                }
                            }
                            if ($h -eq "HR" -and $val -match "^\s*\d+\s*$" -and !$inputs["mean_heart_rate"].Text) {
                                $inputs["mean_heart_rate"].Text = [string][int]$val.Trim()
                            }
                        }
                    }
                }
            }
        }
    }

    # 4. If Excel did not populate all scores, run Windows Native OCR on images
    if (!$hasExcelScores -and ($script:activeDdrImage -or $script:activeApgImage)) {
        $lblStatus.Text = "กำลังอ่านข้อมูลตัวเลขจากภาพรายงานด้วย OCR..."
        $lblStatus.ForeColor = [System.Drawing.Color]::FromArgb(79, 70, 229)
        $form.Refresh()

        if ($script:activeDdrImage) {
            if ($script:activeDdrImage.Name -match "^(\d+)_([A-Za-z0-9]+)_(\d{8})(\d{4})") {
                if (!$txtHn.Text) { $txtHn.Text = $matches[1] }
                if (!$txtName.Text -or $txtName.Text -eq "-") { $txtName.Text = $matches[2] }
                $dStr = $matches[3]
                $tStr = $matches[4]
                $lblExamDate.Text = "วันเวลาที่ตรวจ: " + $dStr.Substring(6,2) + "/" + $dStr.Substring(4,2) + "/" + $dStr.Substring(0,4) + " " + $tStr.Substring(0,2) + ":" + $tStr.Substring(2,2) + " (จากภาพ DDR)"
            }

            # หาขนาดของภาพเพื่อคำนวณตำแหน่งสัมพัทธ์ (Relative Coordinates) รองรับทุกความละเอียดภาพ
            $wImg = 1.0; $hImg = 1.0
            try {
                $imgObj = [System.Drawing.Image]::FromFile($script:activeDdrImage.FullName)
                $wImg = [double]$imgObj.Width
                $hImg = [double]$imgObj.Height
                $imgObj.Dispose()
            } catch {}

            $ddrOcr = Invoke-WindowsOcr $script:activeDdrImage.FullName
            if ($ddrOcr -and $wImg -gt 0 -and $hImg -gt 0) {
                foreach ($l in $ddrOcr.Lines) {
                    foreach ($w in $l.Words) {
                        $txt = $w.Text
                        if ($txt -match "^\d+(\.\d+)?$") {
                            $val = [double]$txt
                            $intStr = [string][int][Math]::Round($val)
                            $rx = $w.BoundingRect.X / $wImg
                            $ry = $w.BoundingRect.Y / $hImg

                            # 1.1 ANS Activity (~0.77, ~0.24)
                            if ($rx -ge 0.68 -and $rx -le 0.88 -and $ry -ge 0.20 -and $ry -le 0.27 -and !$inputs["ans_activity"].Text) {
                                $inputs["ans_activity"].Text = $intStr
                                $hasExcelScores = $true
                            }
                            # 1.2 ANS Balance (~0.77, ~0.31)
                            elseif ($rx -ge 0.68 -and $rx -le 0.88 -and $ry -ge 0.28 -and $ry -le 0.36 -and !$inputs["ans_balance"].Text) {
                                $inputs["ans_balance"].Text = $intStr
                            }
                            # 2.1 Stress Resistance (~0.51, ~0.43)
                            elseif ($rx -ge 0.44 -and $rx -le 0.60 -and $ry -ge 0.39 -and $ry -le 0.46 -and !$inputs["stress_resistance"].Text) {
                                $inputs["stress_resistance"].Text = $intStr
                            }
                            # 2.2 Stress Index (~0.51, ~0.49)
                            elseif ($rx -ge 0.44 -and $rx -le 0.60 -and $ry -ge 0.46 -and $ry -le 0.515 -and !$inputs["stress_index"].Text) {
                                $inputs["stress_index"].Text = $intStr
                            }
                            # 2.3 Fatigue Index (~0.51, ~0.54)
                            elseif ($rx -ge 0.44 -and $rx -le 0.60 -and $ry -ge 0.515 -and $ry -le 0.575 -and !$inputs["fatigue_index"].Text) {
                                $inputs["fatigue_index"].Text = $intStr
                            }
                            # 3.1 Mean Heart Rate (~0.51, ~0.62)
                            elseif ($rx -ge 0.44 -and $rx -le 0.60 -and $ry -ge 0.59 -and $ry -le 0.65 -and !$inputs["mean_heart_rate"].Text) {
                                $inputs["mean_heart_rate"].Text = $intStr
                            }
                            # 3.2 Electro-Cardiac Stability (~0.51, ~0.67)
                            elseif ($rx -ge 0.44 -and $rx -le 0.60 -and $ry -ge 0.65 -and $ry -le 0.72 -and !$inputs["electro_cardiac_stability"].Text) {
                                $inputs["electro_cardiac_stability"].Text = $intStr
                            }
                        }
                    }
                }
            }
        }

        if ($script:activeApgImage) {
            $wApg = 1.0; $hApg = 1.0
            try {
                $imgApgObj = [System.Drawing.Image]::FromFile($script:activeApgImage.FullName)
                $wApg = [double]$imgApgObj.Width
                $hApg = [double]$imgApgObj.Height
                $imgApgObj.Dispose()
            } catch {}

            $apgOcr = Invoke-WindowsOcr $script:activeApgImage.FullName
            if ($apgOcr) {
                foreach ($l in $apgOcr.Lines) {
                    if (!$inputs["wave_level"].Text) {
                        if ($l.Text -match "(?i)(?:Type|Level|Wave)\s*[:=\s]*([1-7])" -or $l.Text -match "([1-7])\s*(?:Good|Normal|Warning)") {
                            $inputs["wave_level"].Text = $matches[1]
                            $hasExcelScores = $true
                        }
                    }
                    if (!$inputs["mean_heart_rate"].Text -and $l.Text -match "(?i)\bHR\b\s*(\d{2,3})") {
                        $inputs["mean_heart_rate"].Text = $matches[1]
                    }
                    foreach ($w in $l.Words) {
                        $rx = if ($wApg -gt 0) { $w.BoundingRect.X / $wApg } else { 0 }
                        $ry = if ($hApg -gt 0) { $w.BoundingRect.Y / $hApg } else { 0 }

                        # 4.1 Wave Level digit (~0.147, ~0.588)
                        if (!$inputs["wave_level"].Text -and $w.Text -match "^[1-7]$" -and $rx -ge 0.10 -and $rx -le 0.22 -and $ry -ge 0.55 -and $ry -le 0.63) {
                            $inputs["wave_level"].Text = $w.Text
                            $hasExcelScores = $true
                        }
                        # Fallback HR on APG (~0.16, ~0.50)
                        if (!$inputs["mean_heart_rate"].Text -and $w.Text -match "^\d{2,3}$" -and $rx -ge 0.12 -and $rx -le 0.26 -and $ry -ge 0.46 -and $ry -le 0.54) {
                            $inputs["mean_heart_rate"].Text = $w.Text
                        }
                    }
                }
            }
        }
    }

    # ค่าเริ่มต้นสำหรับ Ectopic Beat (การเต้นผิดจังหวะ) หากมีข้อมูลเคส แต่ยังว่าง ให้เป็น 0
    if (($hasExcelScores -or $script:activeDdrImage -or $script:activeApgImage) -and !$inputs["ectopic_beat"].Text) {
        $inputs["ectopic_beat"].Text = "0"
    }

    # Validate all fields
    foreach ($k in $scoreRanges.Keys) {
        Validate-FieldValue $k
    }

    if ($hasExcelScores -or $script:activeDdrImage) {
        $foundMsg = if ($targetHn) { "ดึงผลตรวจของ HN: $targetHn สำเร็จเรียบร้อยค่ะ" } else { "ดึงผลตรวจล่าสุดสำเร็จเรียบร้อยค่ะ" }
        $lblStatus.Text = $foundMsg
        $lblStatus.ForeColor = [System.Drawing.Color]::FromArgb(16, 149, 106)
    } else {
        if ($targetHn) {
            $lblStatus.Text = "ไม่พบข้อมูลผลตรวจของ HN: $targetHn ในระบบค่ะ"
            $lblStatus.ForeColor = [System.Drawing.Color]::FromArgb(220, 38, 38)
        } else {
            $lblStatus.Text = "พร้อมรับข้อมูลเคสใหม่ (เมื่อตรวจเสร็จ ข้อมูลจะดึงมาแสดงอัตโนมัติค่ะ)"
            $lblStatus.ForeColor = [System.Drawing.Color]::FromArgb(100, 116, 139)
        }
    }
}

# หน้าจอเริ่มต้นให้ว่างเสมอ (ตามที่ลูกรักต้องการ) เพื่อพร้อมให้พิมพ์ HN หรือกดปุ่มดึงผลตรวจ
Clear-FormFields

# Button: Re-scan / Search by HN
$btnScanAgain.Add_Click({
    Scan-AllData "" $txtHn.Text.Trim()
})

# Button: Clear Screen
$btnClear.Add_Click({
    Clear-FormFields
})

# Press Enter on HN box to search
$txtHn.Add_KeyDown({
    if ($_.KeyCode -eq [System.Windows.Forms.Keys]::Enter) {
        $_.SuppressKeyPress = $true
        Scan-AllData "" $txtHn.Text.Trim()
    }
})

# Button: Browse Folder
$btnBrowseFolder.Add_Click({
    $fbd = New-Object System.Windows.Forms.FolderBrowserDialog
    $fbd.Description = "เลือกโฟลเดอร์ที่เก็บภาพรายงานผลตรวจ (DDR / APG)"
    if ($fbd.ShowDialog() -eq [System.Windows.Forms.DialogResult]::OK) {
        Scan-AllData $fbd.SelectedPath $txtHn.Text.Trim()
    }
})

# --- Send to MSR Handler ---
$btnSend.Add_Click({
    $hnVal = $txtHn.Text.Trim()
    if (!$hnVal) {
        [System.Windows.Forms.MessageBox]::Show("กรุณากรอก HN ผู้รับบริการก่อนส่งข้อมูลค่ะ", "แจ้งเตือน", [System.Windows.Forms.MessageBoxButtons]::OK, [System.Windows.Forms.MessageBoxIcon]::Warning)
        $txtHn.Focus()
        return
    }

    # Strict Validation of all 9 fields against MSR score ranges
    $errors = @()
    $firstInvalidInput = $null

    foreach ($k in @("ans_activity", "ans_balance", "stress_resistance", "stress_index", "fatigue_index", "mean_heart_rate", "electro_cardiac_stability", "ectopic_beat", "wave_level")) {
        $val = $inputs[$k].Text.Trim()
        $r = $scoreRanges[$k]

        if ($val -eq "") {
            $errors += "- $($r.nameEn) ($($r.nameTh)): ยังไม่ได้กรอกข้อมูล"
            if (!$firstInvalidInput) { $firstInvalidInput = $inputs[$k] }
        } elseif ($val -notmatch "^\s*[-+]?\d+(\.\d+)?\s*$") {
            $errors += "- $($r.nameEn) ($($r.nameTh)): ต้องเป็นตัวเลขเท่านั้น (ค่าปัจจุบัน: '$val')"
            if (!$firstInvalidInput) { $firstInvalidInput = $inputs[$k] }
        } else {
            $num = [int][Math]::Round([double]$val)
            if ($num -lt $r.min -or $num -gt $r.max) {
                $errors += "- $($r.nameEn) ($($r.nameTh)): ค่า $num ไม่อยู่ในช่วง $($r.rangeText)"
                if (!$firstInvalidInput) { $firstInvalidInput = $inputs[$k] }
            }
        }
    }

    if ($errors.Count -gt 0) {
        $errMsg = "พบข้อมูลผลตรวจไม่อยู่ในช่วงคะแนนที่ระบบ MSR กำหนด:`n`n" + ($errors -join "`n") + "`n`nกรุณาตรวจสอบและแก้ไขให้ถูกต้องตามเกณฑ์ก่อนส่งข้อมูลค่ะ"
        [System.Windows.Forms.MessageBox]::Show($errMsg, "คะแนนไม่อยู่ในเกณฑ์ MSR", [System.Windows.Forms.MessageBoxButtons]::OK, [System.Windows.Forms.MessageBoxIcon]::Warning)
        if ($firstInvalidInput) { $firstInvalidInput.Focus() }
        return
    }

    $btnSend.Enabled = $false
    $btnSend.Text = "กำลังส่งข้อมูลและภาพเข้าสู่ระบบ MSR..."
    $lblStatus.Text = "กำลังอัปโหลดข้อมูลและภาพรายงานเข้าสู่เซิร์ฟเวอร์ MSR..."
    $lblStatus.ForeColor = [System.Drawing.Color]::FromArgb(37, 99, 235)
    $form.Refresh()

    # ฟังก์ชันบีบอัดภาพรายงานผลตรวจ (DDR & APG) ให้มีขนาดเล็กระดับ ~150 KB คมชัดสูง ไม่เบลอ ประหยัดเนื้อที่เซิร์ฟเวอร์
    function Get-OptimizedImageBase64([string]$imagePath, [int]$maxWidth = 1100, [int]$quality = 72) {
        if (!$imagePath -or !(Test-Path $imagePath)) { return "" }
        try {
            $src = [System.Drawing.Image]::FromFile($imagePath)
            $scale = [Math]::Min(1.0, [double]$maxWidth / [double]$src.Width)
            $newW = [int]([Math]::Round($src.Width * $scale))
            $newH = [int]([Math]::Round($src.Height * $scale))
            
            $dest = New-Object System.Drawing.Bitmap($newW, $newH)
            $g = [System.Drawing.Graphics]::FromImage($dest)
            $g.InterpolationMode = [System.Drawing.Drawing2D.InterpolationMode]::HighQualityBicubic
            $g.SmoothingMode = [System.Drawing.Drawing2D.SmoothingMode]::HighQuality
            $g.PixelOffsetMode = [System.Drawing.Drawing2D.PixelOffsetMode]::HighQuality
            $g.CompositingQuality = [System.Drawing.Drawing2D.CompositingQuality]::HighQuality
            $g.DrawImage($src, 0, 0, $newW, $newH)
            
            $codec = [System.Drawing.Imaging.ImageCodecInfo]::GetImageEncoders() | Where-Object { $_.MimeType -eq 'image/jpeg' }
            $encParams = New-Object System.Drawing.Imaging.EncoderParameters(1)
            $encParams.Param[0] = New-Object System.Drawing.Imaging.EncoderParameter([System.Drawing.Imaging.Encoder]::Quality, [long]$quality)
            
            $ms = New-Object System.IO.MemoryStream
            $dest.Save($ms, $codec, $encParams)
            $bytes = $ms.ToArray()
            
            $ms.Dispose()
            $g.Dispose()
            $dest.Dispose()
            $src.Dispose()
            
            return [Convert]::ToBase64String($bytes)
        } catch {
            try {
                $rawBytes = [System.IO.File]::ReadAllBytes($imagePath)
                return [Convert]::ToBase64String($rawBytes)
            } catch {
                return ""
            }
        }
    }

    # บีบอัดภาพรายงาน DDR & APG ความคมชัดสูงและแปลงเป็น Base64 (~150 KB ต่อภาพ ประหยัดเนื้อที่เซิร์ฟเวอร์)
    $ddrBase64 = ""
    $apgBase64 = ""

    if ($script:activeDdrImage -and (Test-Path $script:activeDdrImage.FullName)) {
        $ddrBase64 = Get-OptimizedImageBase64 $script:activeDdrImage.FullName 1100 72
    }

    if ($script:activeApgImage -and (Test-Path $script:activeApgImage.FullName)) {
        $apgBase64 = Get-OptimizedImageBase64 $script:activeApgImage.FullName 1100 72
    }

    # Pure Integer Payload
    $payload = @{
        hn                        = $hnVal
        name                      = $txtName.Text.Trim()
        ans_activity              = [int][Math]::Round([double]$inputs["ans_activity"].Text.Trim())
        ans_balance               = [int][Math]::Round([double]$inputs["ans_balance"].Text.Trim())
        stress_resistance         = [int][Math]::Round([double]$inputs["stress_resistance"].Text.Trim())
        stress_index              = [int][Math]::Round([double]$inputs["stress_index"].Text.Trim())
        fatigue_index             = [int][Math]::Round([double]$inputs["fatigue_index"].Text.Trim())
        mean_heart_rate           = [int][Math]::Round([double]$inputs["mean_heart_rate"].Text.Trim())
        electro_cardiac_stability = [int][Math]::Round([double]$inputs["electro_cardiac_stability"].Text.Trim())
        ectopic_beat              = [int][Math]::Round([double]$inputs["ectopic_beat"].Text.Trim())
        wave_level                = [int][Math]::Round([double]$inputs["wave_level"].Text.Trim())
        matched_by                = "widget_v4"
        ddr_image_base64          = $ddrBase64
        apg_image_base64          = $apgBase64
    }

    try {
        $json = [System.Text.Encoding]::UTF8.GetBytes(($payload | ConvertTo-Json -Compress))
        $res = Invoke-RestMethod -Uri $serverUrl -Method Post -Body $json -ContentType "application/json; charset=utf-8" -TimeoutSec 20

        if ($res.ok) {
            $lblStatus.Text = "ส่งเข้า MSR สำเร็จแล้ว! (HN: $hnVal)"
            $lblStatus.ForeColor = [System.Drawing.Color]::FromArgb(16, 149, 106)
            try { [System.Media.SystemSounds]::Asterisk.Play() } catch {}
            
            $imgMsg = if ($ddrBase64 -or $apgBase64) { "`n`nพร้อมแนบภาพรายงาน DDR และ APG เข้าสู่ระบบเรียบร้อยค่ะ!" } else { "" }
            [System.Windows.Forms.MessageBox]::Show("ส่งข้อมูลผลตรวจของ HN: $hnVal ($($txtName.Text.Trim())) เข้าสู่ระบบ MSR สำเร็จเรียบร้อยแล้วค่ะ!$imgMsg`n`nข้อมูลตัวเลขจำนวนเต็มจะถูกนำไปคำนวณระดับในระบบ MSR ให้อัตโนมัติทันทีค่ะ", "ส่งสำเร็จ", [System.Windows.Forms.MessageBoxButtons]::OK, [System.Windows.Forms.MessageBoxIcon]::Information)
        } else {
            $lblStatus.Text = "เซิร์ฟเวอร์แจ้ง: $($res.error)"
            $lblStatus.ForeColor = [System.Drawing.Color]::FromArgb(220, 38, 38)
            [System.Windows.Forms.MessageBox]::Show("เซิร์ฟเวอร์แจ้งข้อผิดพลาด: $($res.error)", "ส่งไม่สำเร็จ", [System.Windows.Forms.MessageBoxButtons]::OK, [System.Windows.Forms.MessageBoxIcon]::Warning)
        }
    } catch {
        $lblStatus.Text = "ส่งไม่สำเร็จ: $($_.Exception.Message)"
        $lblStatus.ForeColor = [System.Drawing.Color]::FromArgb(220, 38, 38)
        [System.Windows.Forms.MessageBox]::Show("เกิดข้อผิดพลาดในการเชื่อมต่อเซิร์ฟเวอร์ MSR:`n$($_.Exception.Message)", "ส่งไม่สำเร็จ", [System.Windows.Forms.MessageBoxButtons]::OK, [System.Windows.Forms.MessageBoxIcon]::Error)
    } finally {
        $btnSend.Enabled = $true
        $btnSend.Text = "ส่งผลตรวจและภาพรายงานเข้าสู่ระบบ MSR"
    }
})

# Show Form
[System.Windows.Forms.Application]::EnableVisualStyles()
$null = $form.ShowDialog()
