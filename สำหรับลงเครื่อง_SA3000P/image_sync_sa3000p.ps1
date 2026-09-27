# ==============================================================================
# SA-3000P Auto Image & OCR Background Sync to MSR System
# Medicore SA-3000P -> MSR System (Mental Health Center 4)
# ==============================================================================

param(
    [string]$ServerUrl = "https://mhc4.dmh.go.th/msr/api/screening/bio/receive",
    [int]$IntervalSeconds = 3
)

# Force TLS 1.2
try {
    [System.Net.ServicePointManager]::SecurityProtocol = [System.Net.SecurityProtocolType]::Tls12 -bor [System.Net.SecurityProtocolType]::Tls11 -bor [System.Net.SecurityProtocolType]::Tls
    [System.Net.ServicePointManager]::ServerCertificateValidationCallback = {$true}
} catch {}

Add-Type -AssemblyName System.Runtime.WindowsRuntime
$asTaskGeneric = ([System.WindowsRuntimeSystemExtensions].GetMethods() | Where-Object { $_.Name -eq 'AsTask' -and $_.GetParameters().Count -eq 1 -and $_.GetParameters()[0].ParameterType.Name -eq 'IAsyncOperation`1' })[0]
function Await-WinRT($asOp, $type) {
    $m = $asTaskGeneric.MakeGenericMethod($type)
    $task = $m.Invoke($null, @($asOp))
    $task.Wait(-1) | Out-Null
    return $task.Result
}

# Preload WinRT types
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

Write-Host "==========================================================" -ForegroundColor Green
Write-Host "   SA-3000P Auto Image OCR Sync to MSR (MHC 4)          " -ForegroundColor Cyan
Write-Host "==========================================================" -ForegroundColor Green
Write-Host "Server API : $ServerUrl"
Write-Host "Status     : Background watcher active... (Press Ctrl+C to stop)`n"

$candidateImageDirs = @(
    "C:\SA THAI\Image",
    "C:\SAViewer_New THAI\Image",
    "D:\OneDrive\แฟรชไดรฟ\1",
    "D:\OneDrive\แฟรชไดรฟ\SAViewer_New THAI\Image",
    "D:\SAViewer_New THAI\Image",
    "C:\SA\Image"
)

$lastProcessedKey = ""

while ($true) {
    try {
        # Find candidate directories that exist
        $activeDirs = $candidateImageDirs | Where-Object { Test-Path $_ }

        foreach ($dir in $activeDirs) {
            $jpgs = Get-ChildItem -Path $dir -Filter "*.jpg" -ErrorAction SilentlyContinue | Sort-Object LastWriteTime -Descending
            $foundDdr = $null
            $foundApg = $null

            # แยกตามกลุ่มชื่อไฟล์ (รองรับทั้งระบบที่มี 2 หน้า และ 3 หน้า, ชื่อ DDR, PTG หรือ APG)
            $fNamedDdr = $jpgs | Where-Object { $_.Name -match "ddr" } | Select-Object -First 1
            $fMain = $jpgs | Where-Object { $_.Name -notmatch "\(\d+\)\.jpe?g$" -and $_.Name -notmatch "(?:ptg|apg)" } | Select-Object -First 1
            $foundDdr = if ($fNamedDdr) { $fNamedDdr } else { $fMain }

            if ($foundDdr) {
                $casePrefix = $foundDdr.BaseName -replace "(?:_ddr|_ptg|_apg|\(\d+\))$", ""
                $candidateApgs = $jpgs | Where-Object { 
                    $_.FullName -ne $foundDdr.FullName -and ($_.BaseName -like "$casePrefix*" -or $_.Name -match "^$casePrefix")
                }

                $foundApg = $candidateApgs | Where-Object { $_.Name -match "(?:ptg|apg)" } | Select-Object -First 1
                if (!$foundApg) {
                    $foundApg = $candidateApgs | Where-Object { $_.Name -match "\(3\)\.jpe?g$" } | Select-Object -First 1
                }
                if (!$foundApg) {
                    $foundApg = $candidateApgs | Where-Object { $_.Name -match "\(2\)\.jpe?g$" } | Select-Object -First 1
                }
            }

            if (!$foundDdr) {
                $foundDdr = $jpgs | Where-Object { $_.Name -match "ddr" } | Select-Object -First 1
                if (!$foundDdr) { $foundDdr = $jpgs | Where-Object { $_.Name -notmatch "\(\d+\)\.jpe?g$" } | Select-Object -First 1 }
            }
            if (!$foundApg) {
                $foundApg = $jpgs | Where-Object { $_.Name -match "(?:ptg|apg)" } | Select-Object -First 1
                if (!$foundApg) { $foundApg = $jpgs | Where-Object { $_.Name -match "\(3\)\.jpe?g$" } | Select-Object -First 1 }
                if (!$foundApg) { $foundApg = $jpgs | Where-Object { $_.Name -match "\(2\)\.jpe?g$" } | Select-Object -First 1 }
            }

            if ($foundDdr) {
                $uniqueKey = "$($foundDdr.FullName)_$($foundDdr.LastWriteTime.Ticks)"
                if ($uniqueKey -ne $lastProcessedKey) {
                    Write-Host "[$([DateTime]::Now.ToString('HH:mm:ss'))] Detected new report image: $($foundDdr.Name)" -ForegroundColor Cyan
                    
                    $hn = ""
                    $name = ""
                    $examDate = ""
                    
                    if ($foundDdr.Name -match "^(\d+)_([A-Za-z0-9]+)_(\d{8})(\d{4})") {
                        $hn = $matches[1]
                        $name = $matches[2]
                        $dStr = $matches[3]
                        $tStr = $matches[4]
                        $examDate = $dStr.Substring(0,4) + "-" + $dStr.Substring(4,2) + "-" + $dStr.Substring(6,2) + " " + $tStr.Substring(0,2) + ":" + $tStr.Substring(2,2)
                    }

                    $ansActivity = 0
                    $ansBalance = 0
                    $stressResistance = 0
                    $stressIndex = 0
                    $fatigueIndex = 0
                    $meanHeartRate = 0
                    $stability = 0
                    $ectopicBeat = 0
                    $waveLevel = 0

                    # Run OCR on DDR
                    $ddrOcr = Invoke-WindowsOcr $foundDdr.FullName
                    if ($ddrOcr) {
                        $allWords = @()
                        foreach ($l in $ddrOcr.Lines) {
                            foreach ($w in $l.Words) {
                                $allWords += @{ Text = $w.Text; X = [int]$w.BoundingRect.X; Y = [int]$w.BoundingRect.Y }
                            }
                        }

                        for ($i = 0; $i -lt $allWords.Count; $i++) {
                            if ($allWords[$i].Text -match "Chart" -and $i + 2 -lt $allWords.Count) {
                                if ($allWords[$i+2].Text -match "^\d+$" -and !$hn) { $hn = $allWords[$i+2].Text }
                            }
                        }

                        foreach ($w in $allWords) {
                            $txt = $w.Text
                            $y = $w.Y
                            $x = $w.X

                            if ($txt -match "^\d+(\.\d+)?$") {
                                $val = [double]$txt
                                if ($y -ge 650 -and $y -le 750 -and $x -ge 1550 -and $x -le 1750) { $ansActivity = [int][Math]::Round($val) }
                                elseif ($y -ge 850 -and $y -le 950 -and $x -ge 1550 -and $x -le 1750) { $ansBalance = [int][Math]::Round($val) }
                                elseif ($y -ge 1200 -and $y -le 1320 -and $x -ge 1000 -and $x -le 1200) { $stressResistance = [int][Math]::Round($val) }
                                elseif ($y -ge 1400 -and $y -le 1500 -and $x -ge 1000 -and $x -le 1200) { $stressIndex = [int][Math]::Round($val) }
                                elseif ($y -ge 1550 -and $y -le 1650 -and $x -ge 1000 -and $x -le 1200) { $fatigueIndex = [int][Math]::Round($val) }
                                elseif ($y -ge 1800 -and $y -le 1880 -and $x -ge 1000 -and $x -le 1200) { $meanHeartRate = [int][Math]::Round($val) }
                                elseif ($y -ge 1940 -and $y -le 2040 -and $x -ge 1000 -and $x -le 1200) { $stability = [int][Math]::Round($val) }
                            }
                        }
                    }

                    # Run OCR on APG
                    if ($foundApg) {
                        $apgOcr = Invoke-WindowsOcr $foundApg.FullName
                        if ($apgOcr) {
                            foreach ($l in $apgOcr.Lines) {
                                foreach ($w in $l.Words) {
                                    if ($w.Text -match "^[1-7]$" -and $w.BoundingRect.X -ge 250 -and $w.BoundingRect.X -le 400 -and $w.BoundingRect.Y -ge 1680 -and $w.BoundingRect.Y -le 1820) {
                                        $waveLevel = [int]$w.Text
                                    }
                                    if ($meanHeartRate -eq 0 -and $w.Text -match "^\d{2,3}$" -and $w.BoundingRect.X -ge 300 -and $w.BoundingRect.X -le 450 -and $w.BoundingRect.Y -ge 1450 -and $w.BoundingRect.Y -le 1550) {
                                        $meanHeartRate = [int]$w.Text
                                    }
                                }
                            }
                        }
                    }

                    if ($hn) {
                        $lastProcessedKey = $uniqueKey
                        
                        $ddrBase64 = ""
                        $apgBase64 = ""
                        try { $ddrBase64 = [Convert]::ToBase64String([System.IO.File]::ReadAllBytes($foundDdr.FullName)) } catch {}
                        if ($foundApg) {
                            try { $apgBase64 = [Convert]::ToBase64String([System.IO.File]::ReadAllBytes($foundApg.FullName)) } catch {}
                        }

                        $payload = @{
                            hn                        = $hn
                            name                      = if ($name) { $name } else { "-" }
                            exam_date                 = if ($examDate) { $examDate } else { [DateTime]::Now.ToString("yyyy-MM-dd HH:mm:ss") }
                            ans_activity              = $ansActivity
                            ans_balance               = $ansBalance
                            stress_resistance         = $stressResistance
                            stress_index              = $stressIndex
                            fatigue_index             = $fatigueIndex
                            mean_heart_rate           = $meanHeartRate
                            electro_cardiac_stability = $stability
                            ectopic_beat              = $ectopicBeat
                            wave_level                = $waveLevel
                            matched_by                = "image_ocr_auto"
                            ddr_image_base64          = $ddrBase64
                            apg_image_base64          = $apgBase64
                        }

                        Write-Host "[$([DateTime]::Now.ToString('HH:mm:ss'))] Sending OCR result to MSR (HN: $hn, Name: $name, HR: $meanHeartRate, Wave: $waveLevel)..." -ForegroundColor Yellow
                        
                        $json = [System.Text.Encoding]::UTF8.GetBytes(($payload | ConvertTo-Json -Compress))
                        $res = Invoke-RestMethod -Uri $ServerUrl -Method Post -Body $json -ContentType "application/json; charset=utf-8" -TimeoutSec 20
                        
                        if ($res.ok) {
                            Write-Host "[$([DateTime]::Now.ToString('HH:mm:ss'))] [SUCCESS] Uploaded to MSR! (Images attached)" -ForegroundColor Green
                            try { [System.Media.SystemSounds]::Asterisk.Play() } catch {}
                        } else {
                            Write-Host "[$([DateTime]::Now.ToString('HH:mm:ss'))] [SERVER ERROR] $($res.error)" -ForegroundColor Red
                        }
                    }
                }
            }
        }
    } catch {
        # ignore error and continue
    }

    Start-Sleep -Seconds $IntervalSeconds
}
