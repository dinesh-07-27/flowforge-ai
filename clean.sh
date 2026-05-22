#!/bin/bash
# ==========================================================================
#          FLOWFORGE AI DISK SPACE DEEP CLEAN SYSTEM
# ==========================================================================
# This script shuts down all containers, clears virtual memory, vacuums logs,
# and purges all cached/intermediate Docker build layers to free maximum disk.
# ==========================================================================

echo "=========================================================================="
echo "          FLOWFORGE AI DISK SPACE DEEP CLEAN"
echo "=========================================================================="

# 1. Stop all Docker services and delete containers/volumes
echo "[Step 1] Stopping and removing all Docker containers & volumes..."
sudo docker compose down --volumes --remove-orphans || true
if [ "$(sudo docker ps -aq)" ]; then
    echo "Stopping remaining standalone containers..."
    sudo docker stop $(sudo docker ps -aq) || true
    echo "Removing remaining standalone containers..."
    sudo docker rm $(sudo docker ps -aq) || true
fi

# 2. Reclaim Virtual Memory Disk Space (Resize swap to 1GB)
echo "[Step 2] Optimizing Swap virtual memory to 1GB..."
sudo swapoff /swapfile || true
sudo rm -f /swapfile || true
sudo fallocate -l 1G /swapfile
sudo chmod 600 /swapfile
sudo mkswap /swapfile
sudo swapon /swapfile

# 3. Clean Apt Packages and Caches
echo "[Step 3] Cleaning system package caches..."
sudo apt-get autoremove -y
sudo apt-get clean

# 4. Vacuum System Logs (Journald)
echo "[Step 4] Vacuuming system journal logs..."
sudo journalctl --vacuum-size=10M || true

# 5. Clean Log Files
echo "[Step 5] Cleaning archived log files..."
sudo find /var/log -type f -regex '.*\.gz$' -delete || true
sudo find /var/log -type f -regex '.*\.[0-9]$' -delete || true

# 6. Aggressive Docker Prune (System & BuildKit cache)
echo "[Step 6] Running aggressive Docker system & BuildKit cache prune..."
sudo docker system prune -a -f --volumes
sudo docker builder prune -a -f

# 7. Print Disk Usage Summary
echo "=========================================================================="
echo "🎉 DISK CLEAN COMPLETE!"
echo "Current storage status:"
df -h /
echo "=========================================================================="
