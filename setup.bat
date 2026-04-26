@echo off
echo ==========================================
echo   Confix - Setup Script
echo ==========================================
echo.

echo [1/3] Installing root dependencies...
call npm install
if %errorlevel% neq 0 (
    echo ERROR: npm install failed. Make sure Node.js 18+ is installed.
    echo Download from: https://nodejs.org
    pause
    exit /b 1
)

echo.
echo [2/3] Installing frontend dependencies...
cd frontend
call npm install
cd ..

echo.
echo [3/3] Installing backend dependencies...
cd backend
call npm install
cd ..

echo.
echo ==========================================
echo   Setup complete!
echo   Run 'start.bat' to launch the project
echo ==========================================
pause
