@echo off
REM ============================================================
REM  WeatherDesk - RMC Nagpur | Complete Setup Script
REM  This script installs ALL dependencies and runs the project.
REM  Run this after cloning the repo on a new system.
REM ============================================================

title WeatherDesk - Setup Script
color 0B

echo.
echo  ========================================================
echo   WeatherDesk - RMC Nagpur  ^|  Automated Setup Script
echo  ========================================================
echo.

REM ----------------------------------------------------------
REM  STEP 1: Check Prerequisites
REM ----------------------------------------------------------
echo [1/6] Checking prerequisites...
echo.

REM Check Node.js
where node >nul 2>nul
if %ERRORLEVEL% neq 0 (
    echo  [ERROR] Node.js is NOT installed!
    echo  Please install Node.js 18+ from https://nodejs.org
    echo.
    pause
    exit /b 1
)
for /f "tokens=*" %%i in ('node -v') do set NODE_VER=%%i
echo  [OK] Node.js found: %NODE_VER%

REM Check npm
where npm >nul 2>nul
if %ERRORLEVEL% neq 0 (
    echo  [ERROR] npm is NOT installed!
    echo  npm comes bundled with Node.js. Reinstall Node.js from https://nodejs.org
    echo.
    pause
    exit /b 1
)
for /f "tokens=*" %%i in ('npm -v') do set NPM_VER=%%i
echo  [OK] npm found: v%NPM_VER%

REM Check Git (optional but informative)
where git >nul 2>nul
if %ERRORLEVEL% neq 0 (
    echo  [WARN] Git is not installed. Not required to run, but recommended.
) else (
    for /f "tokens=*" %%i in ('git --version') do set GIT_VER=%%i
    echo  [OK] %GIT_VER%
)

echo.
echo  All prerequisites satisfied!
echo.

REM ----------------------------------------------------------
REM  STEP 2: Install Backend Dependencies
REM ----------------------------------------------------------
echo [2/6] Installing BACKEND dependencies...
echo.
echo  ---- Backend packages ----
echo    cors            ^(Cross-origin resource sharing^)
echo    express         ^(Web server framework^)
echo  --------------------------
echo.

cd /d "%~dp0backend"
if not exist "package.json" (
    echo  [ERROR] backend/package.json not found!
    echo  Make sure you are running this from the project root.
    pause
    exit /b 1
)

call npm install
if %ERRORLEVEL% neq 0 (
    echo  [ERROR] Backend dependency installation failed!
    pause
    exit /b 1
)
echo.
echo  [OK] Backend dependencies installed successfully.
echo.

REM ----------------------------------------------------------
REM  STEP 3: Install Frontend Dependencies
REM ----------------------------------------------------------
echo [3/6] Installing FRONTEND dependencies...
echo.
echo  ---- Frontend packages (dependencies) ----
echo    react                ^(UI library^)
echo    react-dom            ^(React DOM renderer^)
echo    react-router-dom     ^(Client-side routing^)
echo    react-hot-toast      ^(Toast notifications^)
echo    tailwindcss          ^(Utility-first CSS framework^)
echo    @tailwindcss/vite    ^(Tailwind Vite plugin^)
echo    tailwind-merge       ^(Merge Tailwind classes^)
echo    clsx                 ^(Conditional classNames^)
echo    framer-motion        ^(Animations^)
echo    recharts             ^(Charts / data visualization^)
echo    lucide-react         ^(Icon library^)
echo    jspdf                ^(PDF generation^)
echo    html2canvas          ^(HTML to canvas^)
echo    docx                 ^(DOCX document generation^)
echo    file-saver           ^(Client-side file saving^)
echo    papaparse            ^(CSV parsing^)
echo    date-fns             ^(Date utilities^)
echo    cheerio              ^(HTML parsing^)
echo.
echo  ---- Frontend packages (devDependencies) ----
echo    vite                 ^(Build tool / dev server^)
echo    @vitejs/plugin-react ^(React support for Vite^)
echo    typescript           ^(TypeScript compiler^)
echo    gh-pages             ^(GitHub Pages deployment^)
echo  ---------------------------------------------
echo.

cd /d "%~dp0frontend"
if not exist "package.json" (
    echo  [ERROR] frontend/package.json not found!
    echo  Make sure you are running this from the project root.
    pause
    exit /b 1
)

call npm install
if %ERRORLEVEL% neq 0 (
    echo  [ERROR] Frontend dependency installation failed!
    pause
    exit /b 1
)
echo.
echo  [OK] Frontend dependencies installed successfully.
echo.

REM ----------------------------------------------------------
REM  STEP 4: Ensure react & react-dom are installed
REM ----------------------------------------------------------
echo [4/6] Ensuring react and react-dom are installed...
echo.

call npm install react react-dom
if %ERRORLEVEL% neq 0 (
    echo  [ERROR] Failed to install react / react-dom!
    pause
    exit /b 1
)
echo.
echo  [OK] react and react-dom confirmed.
echo.

REM ----------------------------------------------------------
REM  STEP 5: Build Frontend for Production
REM ----------------------------------------------------------
echo [5/6] Building frontend for production...
echo.

call npm run build
if %ERRORLEVEL% neq 0 (
    echo  [ERROR] Frontend build failed!
    pause
    exit /b 1
)
echo.
echo  [OK] Frontend built successfully. Output in frontend/dist/
echo.

REM ----------------------------------------------------------
REM  STEP 6: Start the Server
REM ----------------------------------------------------------
echo [6/6] Starting WeatherDesk server...
echo.
echo  ========================================================
echo   Server will start on: http://localhost:3001
echo   Press Ctrl+C to stop the server.
echo  ========================================================
echo.

cd /d "%~dp0"
call node backend/server.js

pause
