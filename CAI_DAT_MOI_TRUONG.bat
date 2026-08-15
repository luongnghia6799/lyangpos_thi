@echo off
setlocal enabledelayedexpansion
title LyangPOS - Cai dat moi truong Tauri v2 va Python
cls

:: --- THONG TIN LIEN QUAN ---
echo ============================================================================
echo   * LYANGPOS - TU DONG THIET LAP MOI TRUONG DU AN (TAURI v2 + PYTHON) *
echo ============================================================================
echo.
echo Cong cu nay se tu dong kiem tra va cai dat cac phan mem can thiet:
echo   - Git (Quan ly ma nguon)
echo   - Node.js LTS (Danh cho React Frontend va Tauri CLI)
echo   - Python 3.11 (Danh cho Backend va PyInstaller)
echo   - C++ Build Tools (Trinh bien dich MSVC cho Rust)
echo   - Rustup va Rust (Trinh bien dich ma nguon Tauri)
echo   - WebView2 Runtime (Thu vien hien thi giao dien Tauri)
echo.
echo ============================================================================
echo.

:: --- YEU CAU QUYEN ADMIN ---
net session >nul 2>&1
if "%errorlevel%" neq "0" (
    echo [!] Can quyen Quan tri vien (Administrator) de cai dat phan mem.
    echo [>] Dang yeu cau quyen Quan tri vien tu he thong...
    powershell -Command "Start-Process -FilePath '%0' -Verb RunAs"
    exit /b
)

:: --- KIEM TRA WINGET ---
where winget >nul 2>&1
if "%errorlevel%" neq "0" (
    echo [LOI] Khong tim thay Windows Package Manager (winget).
    echo Trinh quan ly winget duoc cai dat mac dinh tren Windows 10/11.
    echo Vui long cap nhat Windows hoac tai App Installer tu Microsoft Store.
    pause
    exit /b 1
)

:: --- PHAN 1: KIEM TRA TRANG THAI HIEN TAI ---
echo [*] Dang kiem tra cau hinh he thong hien tai, vui long doi...
echo.

:: 2. Kiem tra Node.js
set "NODE_STATUS=[Chua cai dat]"
set NODE_INSTALLED=0
node -v >nul 2>&1
if "%errorlevel%"=="0" (
    for /f "tokens=1" %%i in ('node -v 2^>^&1') do set NODE_VER=%%i
    set "NODE_STATUS=[Da cai dat] (!NODE_VER!)"
    set NODE_INSTALLED=1
)

:: 3. Kiem tra Python
set "PY_STATUS=[Chua cai dat]"
set PY_INSTALLED=0
python --version >nul 2>&1
if "%errorlevel%"=="0" (
    for /f "tokens=2" %%i in ('python --version 2^>^&1') do set PY_VER=%%i
    set "PY_STATUS=[Da cai dat] (v!PY_VER!)"
    set PY_INSTALLED=1
)

:: 4. Kiem tra C++ Build Tools
set "VS_STATUS=[Chua cai dat]"
set VS_INSTALLED=0
if exist "%ProgramFiles(x86)%\Microsoft Visual Studio\Installer\vswhere.exe" (
    for /f "usebackq tokens=*" %%i in (`"%ProgramFiles(x86)%\Microsoft Visual Studio\Installer\vswhere.exe" -latest -products * -requires Microsoft.VisualStudio.Workload.VCTools -property installationPath 2^>nul`) do (
        set VS_PATH=%%i
        if not "!VS_PATH!"=="" (
            set VS_INSTALLED=1
            set "VS_STATUS=[Da cai dat] (MSVC VCTools)"
        )
    )
)

:: 5. Kiem tra Rust
set "RUST_STATUS=[Chua cai dat]"
set RUST_INSTALLED=0
rustc --version >nul 2>&1
if "%errorlevel%"=="0" (
    for /f "tokens=2" %%i in ('rustc --version 2^>^&1') do set RUST_VER=%%i
    set "RUST_STATUS=[Da cai dat] (v!RUST_VER!)"
    set RUST_INSTALLED=1
)

:: 6. Kiem tra WebView2 Runtime
set "WV_STATUS=[Chua cai dat]"
set WV_INSTALLED=0
reg query "HKLM\Software\Microsoft\EdgeUpdate\Clients\{F3017226-FE2A-4295-8ABB-345853B7322E}" /v pv >nul 2>&1 && set WV_INSTALLED=1
reg query "HKLM\SOFTWARE\WOW6432Node\Microsoft\EdgeUpdate\Clients\{F3017226-FE2A-4295-8ABB-345853B7322E}" /v pv >nul 2>&1 && set WV_INSTALLED=1
reg query "HKCU\Software\Microsoft\EdgeUpdate\Clients\{F3017226-FE2A-4295-8ABB-345853B7322E}" /v pv >nul 2>&1 && set WV_INSTALLED=1
if "!WV_INSTALLED!"=="1" (
    set "WV_STATUS=[Da cai dat]"
)

:: --- PHAN 2: BAO CAO KET QUA KIEM TRA ---
echo ============================================================================
echo   KET QUA KIEM TRA MOI TRUONG HE THONG:
echo ============================================================================
echo   1. Git:                %GIT_STATUS%
echo   2. Node.js:            %NODE_STATUS%
echo   3. Python:             %PY_STATUS%
echo   4. C++ Build Tools:    %VS_STATUS%
echo   5. Rust (rustc):       %RUST_STATUS%
echo   6. WebView2 Runtime:   %WV_STATUS%
echo ============================================================================
echo.

set /p BUILD_CONFIRM="[?] Ban co muon tu dong cai dat cac cong cu con thieu bang winget khong? (Y/N): "
if /i "!BUILD_CONFIRM!" neq "Y" (
    echo.
    echo [*] Da huy cai dat. Vui long chuan bi day du cac cong cu truoc khi build ung dung.
    pause
    exit /b 0
)

echo.
echo ============================================================================
echo   BAT DAU CAI DAT CAC CONG CU CON THIEU...
echo ============================================================================
echo.

:: Cai dat Git
if "%GIT_INSTALLED%"=="0" (
    echo [+] Dang cai dat Git...
    winget install --id Git.Git -e --accept-package-agreements --accept-source-agreements
    if "!errorlevel!"=="0" (
        set GIT_INSTALLED=1
        echo   [+] Git cai dat thanh cong.
    ) else (
        echo   [!] Loi cai dat Git.
    )
) else (
    echo [+] Git da duoc cai dat. Bo qua.
)
echo.

:: Cai dat Node.js
if "%NODE_INSTALLED%"=="0" (
    echo [+] Dang cai dat Node.js LTS...
    winget install --id OpenJS.NodeJS.LTS -e --accept-package-agreements --accept-source-agreements
    if "!errorlevel!"=="0" (
        set NODE_INSTALLED=1
        echo   [+] Node.js cai dat thanh cong.
    ) else (
        echo   [!] Loi cai dat Node.js.
    )
) else (
    echo [+] Node.js da duoc cai dat. Bo qua.
)
echo.

:: Cai dat Python
if "%PY_INSTALLED%"=="0" (
    echo [+] Dang cai dat Python 3.11...
    winget install --id Python.Python.3.11 -e --accept-package-agreements --accept-source-agreements
    if "!errorlevel!"=="0" (
        set PY_INSTALLED=1
        echo   [+] Python cai dat thanh cong.
    ) else (
        echo   [!] Loi cai dat Python.
    )
) else (
    echo [+] Python da duoc cai dat. Bo qua.
)
echo.

:: Cai dat C++ Build Tools
if "%VS_INSTALLED%"=="0" (
    echo [+] Dang cai dat C++ Build Tools (Visual Studio 2022 Build Tools)...
    echo     [!] Luu y: Qua trinh nay tai va cai dat khoang 1.5GB den 2GB.
    echo     Co the mat tu 10-20 phut tuya thuoc vao toc do mang va may tinh cua ban.
    winget install --id Microsoft.VisualStudio.2022.BuildTools -e --accept-package-agreements --accept-source-agreements --override "--add Microsoft.VisualStudio.Workload.VCTools --includeRecommended --passive --norestart"
    if "!errorlevel!"=="0" (
        set VS_INSTALLED=1
        echo   [+] C++ Build Tools cai dat thanh cong.
    ) else (
        echo   [!] Loi cai dat C++ Build Tools qua winget.
        echo       Ban co the tai thu cong tai: https://visualstudio.microsoft.com/visual-cpp-build-tools/
    )
) else (
    echo [+] C++ Build Tools da duoc cai dat. Bo qua.
)
echo.

:: Cai dat Rust (rustup)
if "%RUST_INSTALLED%"=="0" (
    echo [+] Dang cai dat Rustup va Rust stable toolchain...
    winget install --id Rustlang.Rustup -e --accept-package-agreements --accept-source-agreements
    if "!errorlevel!" neq "0" (
        echo   [!] Cai dat qua winget gap loi. Dang thu tai bo cai dat truc tiep...
        powershell -Command "Invoke-WebRequest -Uri 'https://win.rustup.rs/x86_64' -OutFile 'rustup-init.exe'"
        if exist rustup-init.exe (
            echo   [>] Dang chay rustup-init.exe... Chon tuy chon mac dinh (1) khi duoc hoi.
            start /wait rustup-init.exe -y --default-toolchain stable-x86_64-pc-windows-msvc
            del rustup-init.exe
            set RUST_INSTALLED=1
            echo   [+] Da chay xong bo cai dat Rustup.
        ) else (
            echo   [!] Khong the tai duoc rustup-init.exe. Hay cai dat thu cong tai https://rustup.rs
        )
    ) else (
        set RUST_INSTALLED=1
        echo   [+] Rustup cai dat thanh cong.
    )
) else (
    echo [+] Rust da duoc cai dat. Bo qua.
)
echo.

:: Cai dat WebView2
if "%WV_INSTALLED%"=="0" (
    echo [+] Dang cai dat WebView2 Runtime...
    winget install --id Microsoft.WebView2Runtime -e --accept-package-agreements --accept-source-agreements
    if "!errorlevel!"=="0" (
        set WV_INSTALLED=1
        echo   [+] WebView2 cai dat thanh cong.
    ) else (
        echo   [!] Loi cai dat WebView2 Runtime.
    )
) else (
    echo [+] WebView2 Runtime da duoc cai dat. Bo qua.
)
echo.

:: --- PHAN 3: CAP NHAT PATH TAM THOI VA HUONG DAN TIEP THEO ---
echo ============================================================================
echo   * LAM MOI BIEN MOI TRUONG *
echo ============================================================================
echo.
echo [*] Dang nap lai cac bien moi truong PATH moi cai dat...
for /f "usebackq tokens=*" %%a in (`powershell -Command "[Environment]::GetEnvironmentVariable('Path', 'Machine') + ';' + [Environment]::GetEnvironmentVariable('Path', 'User')"`) do set "PATH=%%a"
echo [+] Da lam moi bien PATH tam thoi trong CMD nay.
echo.

:: Dang ky msvc toolchain mac dinh cho rustup neu Rust moi cai dat
if "%RUST_INSTALLED%"=="1" (
    echo [*] Cau hinh MSVC lam toolchain mac dinh cho Rust...
    rustup default stable-x86_64-pc-windows-msvc >nul 2>&1
    rustup target add x86_64-pc-windows-msvc >nul 2>&1
)

echo ============================================================================
echo   * THIET LAP HOAN TAT! HUONG DAN BUOC TIEP THEO *
echo ============================================================================
echo.
echo [!] CANH BAO QUAN TRONG:
echo 1. Ban NEN KHOI DONG LAI MAY TINH de cac cong cu hoat dong hoan hao va dong bo.
echo 2. Neu khong khoi dong lai, ban PHAI TAT HET CAC CUA SO CMD, VS Code hien tai
echo    va mo lai mot cua so moi de nhan cac bien moi truong PATH moi.
echo.
echo 3. Cac lenh kiem tra thu cong sau khi khoi dong lai:
echo    - node -v
echo    - python --version
echo    - rustc --version
echo.
echo 4. De thuc hien build du an LyangPOS nay:
echo    - Mo CMD moi tai thu muc nay va chay file: build_tauri.bat
echo.
echo ============================================================================
pause