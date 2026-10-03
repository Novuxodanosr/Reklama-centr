@echo off
chcp 1251 >nul
title Сайт REKLAMA CENTR
cd /d "%~dp0"

echo ============================================================
echo   САЙТ REKLAMA CENTR
echo   Адрес в браузере: http://localhost:3000
echo.
echo   Это окно должно оставаться открытым, пока вы смотрите сайт.
echo   Чтобы выключить сайт - просто закройте это окно.
echo ============================================================
echo.

rem Если сайт уже работает - просто открываем браузер.
netstat -ano | findstr /r /c:":3000 .*LISTENING" >nul
if not errorlevel 1 (
  echo Сайт уже работает. Открываю браузер...
  start "" "http://localhost:3000"
  timeout /t 3 >nul
  exit /b 0
)

where node >nul 2>&1
if errorlevel 1 (
  echo Не найден Node.js. Установите его с сайта nodejs.org и запустите этот файл снова.
  pause
  exit /b 1
)

if not exist "node_modules\" (
  echo Первый запуск: устанавливаю компоненты, это займёт минуту-две...
  call npm install
  if errorlevel 1 (
    echo Не удалось установить компоненты. Проверьте интернет и запустите снова.
    pause
    exit /b 1
  )
)

echo Запускаю сайт... Браузер откроется сам, обычно через 10-30 секунд.
echo.

rem Помощник в фоне: ждёт, пока сайт ответит, и открывает браузер.
start "" /b powershell -NoProfile -ExecutionPolicy Bypass -Command "$u='http://localhost:3000/'; for($i=0;$i -lt 120;$i++){ try { $null = Invoke-WebRequest -UseBasicParsing -TimeoutSec 90 $u; Start-Process $u; break } catch { Start-Sleep -Seconds 1 } }"

call npm run dev
