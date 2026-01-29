# Quick deployment script for Windows Server
Write-Host "🚀 Deploying to Windows Server..." -ForegroundColor Cyan
Write-Host ""

# SSH into server and run deployment
ssh administrator@159.65.10.222 "cd C:\Users\Administrator\kernel && powershell.exe -ExecutionPolicy Bypass -File deploy.ps1"

Write-Host ""
Write-Host "✅ Deployment complete!" -ForegroundColor Green
