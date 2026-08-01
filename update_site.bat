@echo off
setlocal
cd /d "%~dp0"
python tools\build_data.py
if errorlevel 1 (
  echo.
  echo The update failed. Confirm that Python is installed and speakers.csv is saved as CSV UTF-8.
  pause
  exit /b 1
)
echo.
echo Website data updated successfully.
pause
