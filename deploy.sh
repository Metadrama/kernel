#!/bin/bash
# Quick deployment script for Windows Server

echo "🚀 Deploying to Windows Server..."
echo ""

# SSH into server and run deployment
sshpass -p 'D3fender!' ssh -o StrictHostKeyChecking=no administrator@159.65.10.222 "cd C:\Users\Administrator\kernel && powershell.exe -ExecutionPolicy Bypass -File deploy.ps1"

echo ""
echo "✅ Deployment complete!"
