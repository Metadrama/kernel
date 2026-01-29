# Deployment Scripts

This directory contains scripts to deploy your application to the Windows Server.

## Quick Deploy

### Windows (PowerShell)
```powershell
.\deploy.ps1
```

### Linux/Mac (Bash)
```bash
./deploy.sh
```

## What it does

1. Connects to Windows Server via SSH
2. Navigates to `C:\Users\Administrator\kernel`
3. Runs the deployment script which:
   - Pulls latest code from GitHub
   - Installs npm dependencies
   - Builds production assets
   - Clears Laravel caches
   - Restarts IIS

## Setup (First Time Only)

### For Bash (Linux/Mac)
```bash
chmod +x deploy.sh
```

### For PowerShell (Windows)
Make sure you can run scripts:
```powershell
Set-ExecutionPolicy -ExecutionPolicy RemoteSigned -Scope CurrentUser
```

## Server Details

- **Host:** 159.65.10.222
- **User:** administrator
- **Deploy Path:** C:\Users\Administrator\kernel
- **IIS Site:** BM Preview

## Troubleshooting

If deployment fails:
1. Check if you can SSH manually: `ssh administrator@159.65.10.222`
2. Verify the server is running
3. Check IIS site status on the server
