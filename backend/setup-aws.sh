#!/bin/bash
# setup-aws.sh
# This script sets up a fresh Ubuntu server (e.g. EC2) with Node.js, PM2, Nginx, and MongoDB.

# Exit script on any error
set -e

echo "======================================"
echo " Starting System Update "
echo "======================================"
sudo apt update && sudo apt upgrade -y

echo "======================================"
echo " Installing Nginx "
echo "======================================"
sudo apt install -y nginx

echo "======================================"
echo " Installing Node.js (v20) "
echo "======================================"
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt install -y nodejs

echo "======================================"
echo " Installing PM2 globally "
echo "======================================"
sudo npm install -g pm2

echo "======================================"
echo " Installing MongoDB (v7.0 for Ubuntu 22.04 Jammy) "
echo "======================================"
# If using a different Ubuntu version, refer to the official MongoDB installation guide.
curl -fsSL https://www.mongodb.org/static/pgp/server-7.0.asc | \
   sudo gpg --batch --yes -o /usr/share/keyrings/mongodb-server-7.0.gpg \
   --dearmor
echo "deb [ arch=amd64,arm64 signed-by=/usr/share/keyrings/mongodb-server-7.0.gpg ] https://repo.mongodb.org/apt/ubuntu jammy/mongodb-org/7.0 multiverse" | sudo tee /etc/apt/sources.list.d/mongodb-org-7.0.list
sudo apt update
sudo apt install -y mongodb-org
sudo systemctl start mongod
sudo systemctl enable mongod

echo "======================================"
echo " Setting up Nginx Reverse Proxy "
echo "======================================"
# Using standard catch-all configuration for simplicity. 
# You can later edit /etc/nginx/sites-available/moneymind to add your domain mapping.

cat <<EOF | sudo tee /etc/nginx/sites-available/moneymind
server {
    listen 80 default_server;
    listen [::]:80 default_server;

    server_name _;

    location / {
        proxy_pass http://localhost:3000; # Assuming Express runs on port 3000
        proxy_http_version 1.1;
        proxy_set_header Upgrade \$http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host \$host;
        proxy_cache_bypass \$http_upgrade;
    }
}
EOF

# Enable the new site config and remove default
sudo ln -sf /etc/nginx/sites-available/moneymind /etc/nginx/sites-enabled/
sudo rm -f /etc/nginx/sites-enabled/default

# Test and restart Nginx
sudo nginx -t
sudo systemctl restart nginx

# Setup pm2 startup script (this binds pm2 to restart your app automatically on server reboot)
# We safely capture the output and execute it
PM2_STARTUP_CMD=\$(pm2 startup ubuntu -u \$USER --hp \$HOME | tail -n 1)
sudo su -c "\$PM2_STARTUP_CMD"

echo "======================================"
echo " Setup Complete! "
echo "======================================"
echo ""
echo "Next Steps:"
echo "1. Clone your git repository on this server if you haven't already."
echo "2. CD into your backend directory."
echo "3. Copy .env.example to .env and input your exact configuration values."
echo "   (Make sure Mongoose connects to: mongodb://127.0.0.1:27017/moneymind )"
echo "4. Make deploy.sh executable: chmod +x deploy.sh"
echo "5. Run your deployment script: ./deploy.sh"
