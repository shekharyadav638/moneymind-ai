#!/bin/bash
# deploy.sh
# Routine deployment script used to pull new updates and restart your application via PM2.

# Stop if any command fails
set -e

# Setup some output styling
GREEN='\033[0;32m'
YELLOW='\033[0;33m'
RESET='\033[0m'

echo -e "\n${YELLOW}=== Starting Backend Deployment ===${RESET}\n"

# Step 1: Pull from main
# Assumes you are running this from within your backend directory branch that is tracking origin/main
echo -e "${GREEN}[1/4] Pulling latest code from Github...${RESET}"
git pull origin main

# Step 2: Install dependencies
echo -e "${GREEN}[2/4] Installing any new Node.js dependencies...${RESET}"
npm install

# Step 3: Run database migrations (If you have any - optional)
# Uncomment the below if you configure a migration script
# echo -e "${GREEN}[3.5] Running Database Migrations...${RESET}"
# npm run db:migrate

# Step 4: Restart pm2
echo -e "${GREEN}[3/4] Restarting process via PM2...${RESET}"
# pm2 start handles the first time, pm2 reload handles subsequent true graceful zero-downtime restarts
pm2 start ecosystem.config.js --env production || pm2 reload ecosystem.config.js --env production

# Step 5: Save PM2 config to ensure it survives reboot
echo -e "${GREEN}[4/4] Saving PM2 state...${RESET}"
pm2 save

echo -e "\n${GREEN}=== Deployment Complete! ===${RESET}\n"
