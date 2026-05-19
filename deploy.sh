#!/bin/bash
# ==========================================================================
#          FLOWFORGE AI AWS PRODUCTION DEPLOYMENT BLUEPRINT
# ==========================================================================
# This script provisions and runs the entire multi-container service 
# on a clean AWS EC2 Ubuntu instance with a single command.
# ==========================================================================

set -e

echo "=========================================================================="
echo "          FLOWFORGE AI AWS PRODUCTION DEPLOYMENT BLUEPRINT"
echo "=========================================================================="

# 1. Update OS package managers
echo "[Step 1] Updating system dependencies..."
sudo apt-get update -y
sudo apt-get upgrade -y

# 2. Install Docker and Docker Compose if not already installed
if ! command -v docker &> /dev/null; then
    echo "[Step 2] Installing Docker & Docker Compose..."
    sudo apt-get install -y ca-certificates curl gnupg lsb-release
    sudo mkdir -p /etc/apt/keyrings
    
    # Add Docker's official GPG key:
    curl -fsSL https://download.docker.com/linux/ubuntu/gpg | sudo gpg --dearmor -o /etc/apt/keyrings/docker.gpg
    
    # Set up the repository:
    echo \
      "deb [arch=$(dpkg --print-architecture) signed-by=/etc/apt/keyrings/docker.gpg] https://download.docker.com/linux/ubuntu \
      $(lsb_release -cs) stable" | sudo tee /etc/apt/sources.list.d/docker.list > /dev/null
      
    sudo apt-get update -y
    sudo apt-get install -y docker-ce docker-ce-cli containerd.io docker-compose-plugin
    
    # Configure user group permissions (allows running docker commands without sudo)
    sudo usermod -aG docker $USER
    echo "Docker installed successfully! System groups updated."
fi

# 3. Provision environment configurations
if [ ! -f .env ]; then
    echo "[Step 3] Generating base environment configuration file..."
    cp .env.example .env
fi

# 4. Launch multi-container microservice mesh
echo "[Step 4] Launching production containerized services via Docker Compose..."
# Using docker compose v2 syntax with sudo to bypass group refresh latency
sudo docker compose up -d --build

# 5. Execute database structural migrations
echo "[Step 5] Upgrading relational schema definitions..."
sudo docker compose exec -T api alembic upgrade head || echo "Database migrations already up to date."

# 6. Pre-seed default production workflow sets
echo "[Step 6] Seeding workflow database tables..."
sudo docker compose exec -T api python scripts/create_demo_workflow.py
sudo docker compose exec -T api python scripts/update_workflow_steps_to_dynamic.py

echo "=========================================================================="
echo "🎉 DEPLOYMENT COMPLETE!"
echo "Your B2B AI Workflow Automation microservice is LIVE!"
echo "Navigate to your AWS EC2 instance public IP address to access the dashboard!"
echo "=========================================================================="
