@echo off
cd /d %~dp0
where py >nul 2>nul
if errorlevel 1 (
  echo OpenBudget local mode requires Python 3. Use the desktop installer for normal use.
  pause
  exit /b 1
)
py local_server.py --open
if errorlevel 1 pause
