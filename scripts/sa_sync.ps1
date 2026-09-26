# ==============================================================================
# SA-3000P Auto Background Sync to MSR System (Smart Edition v2.0)
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

Write-Host "==========================================================" -ForegroundColor Green
Write-Host "   SA-3000P Auto Sync to MSR (Mental Health Center 4)    " -ForegroundColor Cyan
Write-Host "==========================================================" -ForegroundColor Green
Write-Host "Server API : $ServerUrl"
Write-Host "Status     : Background watcher active... (Press Ctrl+C to stop)`n"

$lastProcessedId = ""
$lastProcessedTime = [DateTime]::MinValue

function Parse-SmartScore([string]$str, [int]$defaultVal = 0) {
    if ([string]::IsNullOrWhiteSpace($str)) { return $defaultVal }
    if ($str -match "[-+]?\d*\.?\d+") {
        $num = [double]$matches[0]
        return [int][Math]::Round($num)
    }
    return $defaultVal
}

function Read-TsvRows([string]$filePath) {
    if (!(Test-Path $filePath)) { return $null }
    $lines = Get-Content $filePath -Encoding Unicode -ErrorAction SilentlyContinue
    if (!$lines -or $lines.Count -lt 2) {
        $lines = Get-Content $filePath -Encoding UTF8 -ErrorAction SilentlyContinue
    }
    if (!$lines -or $lines.Count -lt 2) { return $null }
    
    $headers = $lines[0].Split("`t") | ForEach-Object { $_.Trim().Trim([char]0xFEFF) }
    $rows = @()
    for ($i = 1; $i -lt $lines.Count; $i++) {
        $lineText = $lines[$i].Trim()
        if ($lineText) {
            $cols = $lines[$i].Split("`t")
            $row = @{}
            for ($j = 0; $j -lt $headers.Count; $j++) {
                $row[$headers[$j]] = if ($j -lt $cols.Count) { $cols[$j].Trim() } else { "" }
            }
            $rows += $row
        }
    }
    return $rows
}

function Send-BioToMsr($bioData) {
    try {
        $json = [System.Text.Encoding]::UTF8.GetBytes(($bioData | ConvertTo-Json -Compress))
        $res = Invoke-RestMethod -Uri $ServerUrl -Method Post -Body $json -ContentType "application/json; charset=utf-8" -TimeoutSec 10
        if ($res.ok) {
            Write-Host "[$([DateTime]::Now.ToString('HH:mm:ss'))] [SUCCESS] Sent to MSR! HN: $($bioData.hn) | Name: $($bioData.name) | HR: $($bioData.mean_heart_rate) | Wave: $($bioData.wave_level) | Stress: $($bioData.stress_index)" -ForegroundColor Green
            try { [System.Media.SystemSounds]::Asterisk.Play() } catch {}
        } else {
            Write-Host "[$([DateTime]::Now.ToString('HH:mm:ss'))] [SERVER ERROR] $($res.error)" -ForegroundColor Yellow
        }
    } catch {
        Write-Host "[$([DateTime]::Now.ToString('HH:mm:ss'))] [CONNECT ERROR] $($_.Exception.Message)" -ForegroundColor Red
    }
}

# Directories
$excelDirs = @(
    "C:\SAViewer_New THAI\EXCELDATA",
    "C:\SA THAI\EXCELDATA",
    "C:\SA\EXCELDATA",
    "D:\OneDrive\แฟรชไดรฟ\SAViewer_New THAI\EXCELDATA",
    "D:\SAViewer_New THAI\EXCELDATA"
)

$ptgDirs = @(
    "C:\SA THAI\PTGDATA",
    "C:\SA\PTGDATA",
    "D:\OneDrive\แฟรชไดรฟ\SA THAI\PTGDATA",
    "D:\SA THAI\PTGDATA"
)

# --- Main Watcher Loop ---
while ($true) {
    try {
        # Check PTGDATA for newly created test
        $newestIni = $null
        foreach ($d in $ptgDirs) {
            if (Test-Path $d) {
                $f = Get-ChildItem -Path $d -Filter "*.ini" -ErrorAction SilentlyContinue | Sort-Object LastWriteTime -Descending | Select-Object -First 1
                if ($f -and (!$newestIni -or $f.LastWriteTime -gt $newestIni.LastWriteTime)) {
                    $newestIni = $f
                }
            }
        }

        # Check EXCELDATA for APG/HRV files
        $latestExcelTime = [DateTime]::MinValue
        $activeExcelDir = $null
        foreach ($d in $excelDirs) {
            if (Test-Path $d) {
                $apg = Join-Path $d "APGResult.xls"
                $hrv = Join-Path $d "HRVResult.xls"
                if (Test-Path $apg) {
                    $t = (Get-Item $apg).LastWriteTime
                    if ($t -gt $latestExcelTime) { $latestExcelTime = $t; $activeExcelDir = $d }
                }
                if (Test-Path $hrv) {
                    $t = (Get-Item $hrv).LastWriteTime
                    if ($t -gt $latestExcelTime) { $latestExcelTime = $t; $activeExcelDir = $d }
                }
            }
        }

        # If we have an Excel update or new test
        $checkTime = if ($latestExcelTime -gt [DateTime]::MinValue) { $latestExcelTime } else { if ($newestIni) { $newestIni.LastWriteTime } else { [DateTime]::MinValue } }
        $currentId = if ($newestIni) { $newestIni.Name } else { "$latestExcelTime" }

        if ($checkTime -gt $lastProcessedTime -and $currentId -ne $lastProcessedId) {
            # Collect data
            $hn = ""
            $name = ""
            $examDate = ""

            if ($newestIni) {
                $iniLines = Get-Content $newestIni.FullName -ErrorAction SilentlyContinue
                foreach ($l in $iniLines) {
                    if ($l -match "^\s*USERNO\s*=\s*(.+)$") { $hn = $matches[1].Trim() }
                    if ($l -match "^\s*USERNM\s*=\s*(.+)$") { $name = $matches[1].Trim() }
                }
                $examDate = $newestIni.LastWriteTime.ToString("yyyy-MM-dd HH:mm:ss")
            }

            # Pull scores from Excel if available
            $wave = 0
            $hr = 0
            $stress = 0
            $ansAct = 0
            $ansBal = 0
            $stressRes = 0
            $fatigue = 0
            $stability = 0
            $ectopic = 0

            if ($activeExcelDir) {
                $apgPath = Join-Path $activeExcelDir "APGResult.xls"
                if (Test-Path $apgPath) {
                    $apgRows = Read-TsvRows $apgPath
                    if ($apgRows -and $apgRows.Count -gt 0) {
                        $matched = if ($hn) { ($apgRows | Where-Object { $_["ChartNo"] -eq $hn } | Select-Object -Last 1) } else { $apgRows[$apgRows.Count - 1] }
                        if (!$matched) { $matched = $apgRows[$apgRows.Count - 1] }
                        if (!$hn) { $hn = $matched["ChartNo"] }
                        if (!$name) { $name = $matched["ชื่อ"] }
                        $wave = Parse-SmartScore $matched["Wave Type"] 0
                        $hr = Parse-SmartScore $matched["HR"] 0
                    }
                }

                $hrvPath = Join-Path $activeExcelDir "HRVResult.xls"
                if (Test-Path $hrvPath) {
                    $hrvRows = Read-TsvRows $hrvPath
                    if ($hrvRows -and $hrvRows.Count -gt 0) {
                        $matched = if ($hn) { ($hrvRows | Where-Object { $_["ChartNo"] -eq $hn } | Select-Object -Last 1) } else { $hrvRows[$hrvRows.Count - 1] }
                        if (!$matched) { $matched = $hrvRows[$hrvRows.Count - 1] }
                        foreach ($k in $matched.Keys) {
                            if ($k -match "(?i)psi|stress index|ความเครียด") { $stress = Parse-SmartScore $matched[$k] 0 }
                            if ($k -match "(?i)activity") { $ansAct = Parse-SmartScore $matched[$k] 0 }
                            if ($k -match "(?i)balance|lf/hf") { $ansBal = Parse-SmartScore $matched[$k] 0 }
                            if ($k -match "(?i)resist") { $stressRes = Parse-SmartScore $matched[$k] 0 }
                            if ($k -match "(?i)fatigue") { $fatigue = Parse-SmartScore $matched[$k] 0 }
                            if ($k -match "(?i)stability") { $stability = Parse-SmartScore $matched[$k] 0 }
                            if ($k -match "(?i)ectopic") { $ectopic = Parse-SmartScore $matched[$k] 0 }
                            if ($hr -eq 0 -and $k -match "(?i)hr|heart") { $hr = Parse-SmartScore $matched[$k] 0 }
                        }
                    }
                }
            }

            # If we have at least HN and valid test time
            if ($hn) {
                $lastProcessedId = $currentId
                $lastProcessedTime = $checkTime

                if (!$examDate) { $examDate = [DateTime]::Now.ToString("yyyy-MM-dd HH:mm:ss") }

                $payload = @{
                    hn                        = $hn
                    name                      = if ($name) { $name } else { "-" }
                    exam_date                 = $examDate
                    ans_activity              = $ansAct
                    ans_balance               = $ansBal
                    stress_resistance         = $stressRes
                    stress_index              = $stress
                    fatigue_index             = $fatigue
                    mean_heart_rate           = $hr
                    electro_cardiac_stability = $stability
                    ectopic_beat              = $ectopic
                    wave_level                = $wave
                }

                Write-Host "[$([DateTime]::Now.ToString('HH:mm:ss'))] New test detected: HN: $hn ($name) -> Sending to MSR..." -ForegroundColor Cyan
                Send-BioToMsr $payload
            }
        }
    } catch {
        # ignore error and continue
    }

    Start-Sleep -Seconds $IntervalSeconds
}
