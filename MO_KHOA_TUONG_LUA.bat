@echo off
:: Kiem tra quyen Administrator
net session >nul 2>&1
if %errorLevel% == 0 (
    goto :admin
) else (
    goto :elevate
)

:elevate
echo Dang yeu cau quyen Administrator...
powershell -Command "Start-Process '%~f0' -Verb RunAs"
exit /b

:admin
title LyangPOS - Mo khoa Tuong lua Windows
echo ====================================================
echo DANG THUC THI MO KHOA CONG 3579 TREN WINDOWS DEFENDER FIREWALL
echo ====================================================
echo.
echo [1/2] Dang xoa cac thiet lap cu (neu co)...
netsh advfirewall firewall delete rule name="LyangPOS LAN Access (3579)"

echo.
echo [2/2] Dang them thiet lap moi de mo cong 3579 cho cac may tram LAN ket noi...
netsh advfirewall firewall add rule name="LyangPOS LAN Access (3579)" dir=in action=allow protocol=TCP localport=3579

echo.
echo ====================================================
echo DA MO KHOA TUONG LUA THANH CONG!
echo May tram khac da co the ket noi den may chu qua IP cua may nay.
echo ====================================================
echo.
pause
