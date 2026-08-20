@echo off
cd /d "%~dp0apps\api"
node --import tsx/esm index.ts
