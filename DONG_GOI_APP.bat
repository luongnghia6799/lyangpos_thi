@echo off
setlocal enabledelayedexpansion

:: --- CAU HINH PHIEN BAN ---
set APP_VERSION=3.1.0-standardized
set APP_NAME=LyangPOS

echo ======================================================
echo    BAT DAU QUA TRINH DONG GOI %APP_NAME% (v%APP_VERSION%)
echo ======================================================

:: 0. Don dep moi truong cu
echo 1. Dang xoa cac ban build cu va file tam...
if exist dist rd /s /q dist
if exist build rd /s /q build
if exist frontend\dist rd /s /q frontend\dist

:: Xoa file log cu de tranh dong goi vao ban build
if exist app_debug.log del /f /q app_debug.log
if exist tunnel.log del /f /q tunnel.log
if exist tunnel_err.log del /f /q tunnel_err.log

:: Xoa cache Python
echo    Dang xoa Python cache (__pycache__)...
for /d /r . %%d in (__pycache__) do @if exist "%%d" rd /s /q "%%d"

:: 1. Build Frontend
echo 2. Dang build Frontend (React)...
cd frontend
call npm install
call npm run build
if %errorlevel% neq 0 (
    echo [LOI] Khong the build Frontend.
    pause
    exit /b %errorlevel%
)
cd ..

:: 2. Chuan bi Backend
echo 3. Dang kiem tra va cai dat thu vien Backend...
:: Kiem tra hoac tao moi .venv
if not exist .venv (
    echo [*] Tao moi moi truong ao .venv...
    python -m venv .venv
)

:: Kiem tra xem .venv co hoat dong khong (phong khi bi chuyen may)
.venv\Scripts\python.exe -c "import sys" >nul 2>&1
if %ERRORLEVEL% NEQ 0 (
    echo [*] Phat hien .venv bi loi hoac khong dung duong dan, dang tao lai...
    rmdir /s /q .venv
    python -m venv .venv
)

call .venv\Scripts\activate

echo [*] Cai dat hoac cap nhat cac thu vien cho Backend...
python -m pip install -r backend/requirements.txt

:: 3. Dong goi tat ca bang PyInstaller
echo 4. Dang dong goi tat ca thanh file EXE duy nhat...
:: Su dung --clean de xoa cache PyInstaller
python -m PyInstaller --clean --noconfirm LyangPOS.spec

if %errorlevel% neq 0 (
    echo [LOI] Qua trinh dong goi PyInstaller bi loi.
    pause
    exit /b %errorlevel%
)

echo ======================================================
echo    HOAN THANH!
echo    Version: %APP_VERSION%
echo    Ket qua tai: dist/%APP_NAME%
echo    Luu y: Database easypos.db se duoc tu dong tao moi 
echo          hoac nang cap schema khi nguoi dung mo app.
echo ======================================================
pause
