@echo off
title LyangPOS - Cloudflare Tunnel
echo ========================================
echo DANG KHOI TAO DUONG TRUYEN AN TOAN (HTTPS)
echo ========================================
echo.
echo [!] Luu y: Day la link tam thoi (Quick Tunnel).
echo     Moi lan bat lai se co mot link khac nhau.
echo.
echo Dang ket noi den Cloudflare...
".\tools\cloudflared.exe" tunnel --url http://localhost:3579
pause
