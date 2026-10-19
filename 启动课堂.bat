@echo off
chcp 65001 >nul
cd /d "%~dp0"
set PORT=877
where py >nul 2>nul && (set PY=py) || (set PY=python)
%PY% -c "import sys" >nul 2>nul
if errorlevel 1 (
  echo 未找到 Python，请直接双击 index.html（部分功能受限）
  pause
  exit /b 1
)
start "" http://127.0.0.1:%PORT%/home.html
%PY% serve.py %PORT%
pause
