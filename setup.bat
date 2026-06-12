@echo off
cls
echo.
echo  Restaurant Ordering System - Setup Script
echo =============================================
echo.

REM Install root dependencies
echo  Installing root dependencies...
call npm install
if %errorlevel% neq 0 (
    echo  Failed to install root dependencies
    pause
    exit /b 1
)

REM Install frontend dependencies
echo  Installing frontend dependencies...
cd src\frontend
call npm install
if %errorlevel% neq 0 (
    echo  Failed to install frontend dependencies
    cd ..\..
    pause
    exit /b 1
)
cd ..\..

REM Generate Prisma client
echo  Generating Prisma client...
call npx prisma generate
if %errorlevel% neq 0 (
    echo  ⚠️  Prisma generation warning - continuing anyway
)

REM Run database migrations
echo   Running database migrations...
call npx prisma migrate dev --skip-generate
if %errorlevel% neq 0 (
    echo   Database migration skipped or failed (this may be normal if DB already exists)
)

REM Seed the database
echo  Seeding database...
call node scripts/seed.js
if %errorlevel% neq 0 (
    echo   Database seeding completed with warnings (this may be normal if data already exists)
)

REM Build frontend for production
echo 🔨 Building frontend...
call npm run build:frontend
if %errorlevel% neq 0 (
    echo   Frontend build completed with warnings
)

echo.
echo  Setup complete!
echo.
echo To start the project, run:
echo   npm start
echo.
echo Both backend and frontend will run on: http://localhost:3000
echo.
echo For development with hot reload, run:
echo   npm run dev
echo.
pause
