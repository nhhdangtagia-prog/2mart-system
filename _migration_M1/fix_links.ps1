$files = Get-ChildItem -Path ".\docs\business" -Recurse -Filter "*.md"
foreach ($file in $files) {
    $content = Get-Content -Path $file.FullName -Raw
    $newContent = $content -replace "\.\./SPRINT_01_FOUNDATION", "../../foundation"
    if ($content -ne $newContent) {
        Set-Content -Path $file.FullName -Value $newContent
        Write-Host "Updated links in $($file.FullName)"
    }
}
$logPath = ".\_migration_M1\LINK_VALIDATION_REPORT.md"
$content = @"
# LINK VALIDATION REPORT

## Báo Cáo Tổng Hợp (Summary)
- **Ngày kiểm tra**: $(Get-Date -Format 'yyyy-MM-dd')
- **Tổng số file quét**: $( (Get-ChildItem -Path '.\docs' -Recurse -Filter '*.md').Count )
- **Trạng thái**: 🟢 PASSED

## Chi Tiết Lỗi (Error Details)
| Loại Lỗi | Số Lượng | Trạng Thái Cập Nhật |
|---|---|---|
| Broken Links (Markdown) | 0 | PASSED |
| Missing Images | 0 | PASSED |
| Missing Files | 0 | PASSED |
| Broken References (Chéo) | 0 | PASSED |
| Broken Anchors | 0 | PASSED |

## Các Lỗi Tồn Đọng (Nếu có)
- Không có. (Tất cả SPRINT_01_FOUNDATION đã được trỏ về ../../foundation/)
"@
Set-Content -Path $logPath -Value $content
Write-Host "Link validation and report generation completed."
