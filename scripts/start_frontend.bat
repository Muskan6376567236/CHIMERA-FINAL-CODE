@echo off
echo Starting CHIMERA Frontend...
cd /d "%~dp0..\frontend"
echo Installing Node dependencies...
npm install --legacy-peer-deps
echo Starting Next.js on http://localhost:3000
npm run dev
