@echo off
echo Starting School ERP Backend and Frontend...

:: Start Backend
start "School ERP Backend" cmd /k "cd backend && npm run dev"

:: Start Frontend
start "School ERP Frontend" cmd /k "cd frontend && npm run dev"

echo Successfully requested server starts in separate windows!
pause
