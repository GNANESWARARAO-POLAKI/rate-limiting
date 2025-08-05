@echo off
echo ========================================
echo    Rate Limiting Test Website
echo ========================================
echo.
echo This will start a test website on port 5000 that demonstrates
echo IP-based rate limiting for anonymous users.
echo.
echo The server will be accessible:
echo   - Locally: http://localhost:5000
echo   - Network: http://[YOUR-IP]:5000 (from other devices)
echo.
echo Make sure your FastAPI rate limiting service is running on port 8000
echo before starting this test website.
echo.

echo Getting network information...
python get_network_info.py
echo.
echo ========================================
pause

cd /d "%~dp0"
python server.py ========================================
echo    Rate Limiting Test Website
echo ========================================
echo.
echo This will start a test website on port 3001 that demonstrates
echo IP-based rate limiting for anonymous users.
echo.
echo Make sure your FastAPI rate limiting service is running on port 8000
echo before starting this test website.
echo.
pause

cd /d "%~dp0"
python server.py
