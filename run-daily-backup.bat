@echo off
setlocal

:: Get the current date and time
for /f "tokens=2 delims==" %%I in ('wmic os get localdatetime /value') do set datetime=%%I
set "hh=%datetime:~8,2%"
set "dd=%datetime:~6,2%"
set "MM=%datetime:~4,2%"
set "yyyy=%datetime:~0,4%"

set "DateStr=05h00-%dd%%MM%%yyyy%"
set "BackupDir=e:\2 - TỔNG HỢP CÁC DỰ ÁN AGENT\PHẦN MỀM 2 MART CLAUDE\PHẦN MỀM BÁN HÀNG 2 MART"

cd /d "%BackupDir%"

echo [!] Starting database backup...
docker exec 2mart-postgres pg_dump -U postgres -d 2mart_db > "Backup\%DateStr%-BACKUP DỮ LIỆU.sql"

echo [!] Starting source code backup...
tar.exe -a -c -f "Backup\%DateStr%-BACKUP SOURCE CODE.zip" --exclude="node_modules" --exclude=".git" --exclude="scratch" --exclude="_SAO_LUU_KHONG_DUOC_XOA" --exclude="Backup" apps docs packages src package.json turbo.json pnpm-workspace.yaml pnpm-lock.yaml .env start-2mart.cmd database services

echo [!] Backup completed.
endlocal
