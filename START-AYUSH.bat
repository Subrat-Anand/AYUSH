@echo off
setlocal
cd /d "%~dp0"

echo ========================================
echo       AYUSH AI - STARTING APP
echo ========================================

if not exist "backend\node_modules" (
  echo Installing backend dependencies...
  cd backend
  call npm install
  if errorlevel 1 goto :error
  cd ..
)

if not exist "frontend\node_modules" (
  echo Installing frontend dependencies...
  cd frontend
  call npm install
  if errorlevel 1 goto :error
  cd ..
)

start "AYUSH Backend" cmd /k "cd /d "%~dp0backend" && npm run dev"
timeout /t 2 /nobreak >nul
start "AYUSH Frontend" cmd /k "cd /d "%~dp0frontend" && npm run dev"
timeout /t 4 /nobreak >nul
start "" "http://localhost:5173"
exit /b 0

:error
echo.
echo Dependency installation failed. Check your internet connection and run START-AYUSH.bat again.
pause
exit /b 1
