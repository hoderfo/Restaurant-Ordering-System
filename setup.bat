@echo off
cls

echo Installing root dependencies...
call npm install
if %errorlevel% neq 0 (
    echo Failed to install root dependencies
    pause
    exit /b 1
)

echo Installing frontend dependencies...
cd src\frontend
call npm install
if %errorlevel% neq 0 (
    echo Failed to install frontend dependencies
    cd ..\..
    pause
    exit /b 1
)
cd ..\..

echo Generating Prisma client...
call npx prisma generate
if %errorlevel% neq 0 (
    echo Prisma generation failed
    pause
    exit /b 1
)

echo Syncing database schema...
call npx prisma db push --accept-data-loss

echo Seeding database...
call node scripts/seed.js

echo Building frontend...
call npm run build:frontend
if %errorlevel% neq 0 (
    echo Frontend build failed
    pause
    exit /b 1
)

echo Setup complete!
echo To start the project, run: npm start
echo Both backend and frontend will run on: http://localhost:3000
echo For development with hot reload, run: npm run dev
pause
