$logPath = ".\_migration_M1\migration.log"
$matrixPath = ".\_migration_M1\DOCUMENT_VERSION_MATRIX.md"

function Write-Log {
    param([string]$message)
    $timestamp = Get-Date -Format "yyyy-MM-dd HH:mm:ss"
    $line = "[$timestamp] $message"
    Add-Content -Path $logPath -Value $line
    Write-Host $line
}

function Migrate-File {
    param(
        [string]$sourcePath,
        [string]$destPath,
        [string]$moduleName
    )

    if (-Not (Test-Path $sourcePath)) {
        Write-Log "ERROR: Source file not found: $sourcePath"
        return
    }

    Write-Log "Starting migration for $sourcePath -> $destPath"
    
    # Copy
    Copy-Item -Path $sourcePath -Destination $destPath -Force
    
    # Hash Verification
    $hash1 = (Get-FileHash -Path $sourcePath -Algorithm SHA256).Hash
    $hash2 = (Get-FileHash -Path $destPath -Algorithm SHA256).Hash
    
    if ($hash1 -ne $hash2) {
        Write-Log "FAIL: Hash mismatch for $destPath"
        Add-Content -Path $matrixPath -Value "| $(Split-Path $sourcePath -Leaf) | $(Split-Path $sourcePath -Parent) | $destPath | [ ] | FAILED |"
        return
    }
    
    Write-Log "SUCCESS: Hash verified for $destPath"
    
    # Metadata injection
    $date = Get-Date -Format "yyyy-MM-dd"
    $metadata = @"
---
title: "Document for $moduleName"
module: "$moduleName"
status: "Draft"
version: 0.1
owner: "BA Agent"
reviewer: "CTO"
updated: "$date"
dependencies: []
---

"@
    $content = Get-Content -Path $destPath -Raw
    # Ensure we don't double inject if it already has YAML frontmatter
    if ($content -notmatch "^\-\-\-") {
        Set-Content -Path $destPath -Value ($metadata + $content)
        Write-Log "Metadata added to $destPath"
    } else {
        Write-Log "Metadata already exists in $destPath"
    }

    # Update Version Matrix
    $fileName = Split-Path $sourcePath -Leaf
    $parent = Split-Path $sourcePath -Parent
    Add-Content -Path $matrixPath -Value "| $fileName | $parent | $destPath | [x] | Verified |"
    Write-Log "Migration complete for $destPath"
}

# Clear logs
Set-Content -Path $logPath -Value "=== MIGRATION LOG ==="

# Migrate Sprint 1
$sprint1Files = Get-ChildItem -Path ".\SPRINT_01_FOUNDATION" -Filter "*.md"
foreach ($file in $sprint1Files) {
    Migrate-File -sourcePath $file.FullName -destPath ".\docs\foundation\$($file.Name)" -moduleName "Foundation"
}

# Migrate Sprint 2 (BPD)
$bpdMap = @{
    "01_BPD_DASHBOARD.md" = "dashboard"
    "02_BPD_POS.md" = "pos"
    "03_BPD_PRODUCTS.md" = "product"
    "04_BPD_INVENTORY.md" = "inventory"
    "05_BPD_PURCHASE.md" = "purchase"
    "06_BPD_CUSTOMERS.md" = "customers"
    "07_BPD_SUPPLIERS.md" = "suppliers"
    "08_BPD_EMPLOYEES.md" = "employees"
    "09_BPD_SCHEDULE.md" = "schedule"
    "10_BPD_ATTENDANCE.md" = "attendance"
    "11_BPD_TIMESHEET.md" = "timesheet"
    "12_BPD_PAYROLL.md" = "payroll"
    "13_BPD_CASHBOOK.md" = "cashbook"
    "14_BPD_REPORTS.md" = "reports"
    "15_BPD_TAX.md" = "tax"
    "16_BPD_AUDIT_LOG.md" = "audit_log"
    "17_BPD_NOTIFICATION.md" = "notification"
    "18_BPD_SETTINGS.md" = "settings"
}

foreach ($key in $bpdMap.Keys) {
    $src = ".\SPRINT_02_BUSINESS_PROCESS\$key"
    $mod = $bpdMap[$key]
    $dest = ".\docs\business\$mod\BPD.md"
    Migrate-File -sourcePath $src -destPath $dest -moduleName $mod
}

# Migrate Sprint 3 (PRD)
$prdMap = @{
    "03_PRD_PRODUCTS.md" = "product"
    "04_PRD_INVENTORY.md" = "inventory"
    "07_PRD_SUPPLIERS.md" = "suppliers"
}
foreach ($key in $prdMap.Keys) {
    $src = ".\SPRINT_03_PRD\$key"
    $mod = $prdMap[$key]
    $dest = ".\docs\business\$mod\PRD.md"
    Migrate-File -sourcePath $src -destPath $dest -moduleName $mod
}

Write-Log "Phase B Complete."
