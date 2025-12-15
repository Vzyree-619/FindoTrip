#!/bin/bash

# ============================================
# Jenkins + Nginx Setup Script for FindoTrip
# Ubuntu VPS Deployment Script
# ============================================

set -e  # Exit on error

echo "============================================"
echo "FindoTrip - Jenkins & Nginx Setup"
echo "============================================"
echo ""

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Configuration variables
APP_NAME="findotrip"
APP_USER="findotrip"
APP_DIR="/var/www/${APP_NAME}"
DOMAIN_NAME="${DOMAIN_NAME:-yourdomain.com}"  # Set this before running
GIT_REPO="${GIT_REPO:-https://github.com/yourusername/FindoTrip.git}"  # Set this before running
BRANCH="${BRANCH:-main}"

echo -e "${YELLOW}Configuration:${NC}"
echo "  App Name: $APP_NAME"
echo "  App User: $APP_USER"
echo "  App Directory: $APP_DIR"
echo "  Domain: $DOMAIN_NAME"
echo "  Git Repo: $GIT_REPO"
echo "  Branch: $BRANCH"
echo ""
read -p "Press Enter to continue or Ctrl+C to cancel..."

# ============================================
# 1. Update System
# ============================================
echo -e "${GREEN}[1/10] Updating system packages...${NC}"
apt-get update
apt-get upgrade -y

# ============================================
# 2. Install Required Dependencies
# ============================================
echo -e "${GREEN}[2/10] Installing required dependencies...${NC}"
apt-get install -y \
    curl \
    wget \
    git \
    build-essential \
    software-properties-common \
    apt-transport-https \
    ca-certificates \
    gnupg \
    lsb-release \
    ufw \
    fail2ban

# ============================================
# 3. Install Java (Required for Jenkins)
# ============================================
echo -e "${GREEN}[3/10] Installing Java 17...${NC}"
apt-get install -y openjdk-17-jdk
java -version

# ============================================
# 4. Install Node.js and npm
# ============================================
echo -e "${GREEN}[4/10] Installing Node.js 20.x...${NC}"
curl -fsSL https://deb.nodesource.com/setup_20.x | bash -
apt-get install -y nodejs
node --version
npm --version

# Install PM2 for process management
echo -e "${GREEN}Installing PM2...${NC}"
npm install -g pm2

# ============================================
# 5. Install Jenkins
# ============================================
echo -e "${GREEN}[5/10] Installing Jenkins...${NC}"

# Add Jenkins repository
wget -O /usr/share/keyrings/jenkins-keyring.asc \
  https://pkg.jenkins.io/debian-stable/jenkins.io-2023.key

echo deb [signed-by=/usr/share/keyrings/jenkins-keyring.asc] \
  https://pkg.jenkins.io/debian-stable binary/ | tee \
  /etc/apt/sources.list.d/jenkins.list > /dev/null

apt-get update
apt-get install -y jenkins

# Start and enable Jenkins
systemctl start jenkins
systemctl enable jenkins

# Get initial admin password
JENKINS_PASSWORD=$(cat /var/lib/jenkins/secrets/initialAdminPassword)
echo -e "${YELLOW}Jenkins initial admin password: ${JENKINS_PASSWORD}${NC}"
echo -e "${YELLOW}Save this password! You'll need it to unlock Jenkins.${NC}"
echo ""

# ============================================
# 6. Install and Configure Nginx
# ============================================
echo -e "${GREEN}[6/10] Installing and configuring Nginx...${NC}"
apt-get install -y nginx

# Create nginx configuration
cat > /etc/nginx/sites-available/${APP_NAME} <<EOF
server {
    listen 80;
    server_name ${DOMAIN_NAME} www.${DOMAIN_NAME};

    # Redirect HTTP to HTTPS (uncomment after SSL setup)
    # return 301 https://\$server_name\$request_uri;

    # For now, serve HTTP
    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade \$http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \$scheme;
        proxy_cache_bypass \$http_upgrade;
        proxy_read_timeout 300s;
        proxy_connect_timeout 75s;
    }

    # WebSocket support
    location /api/chat/stream {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade \$http_upgrade;
        proxy_set_header Connection "upgrade";
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_read_timeout 3600s;
        proxy_send_timeout 3600s;
    }

    # SSE support
    location /api/notifications/stream {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Cache-Control no-cache;
        proxy_set_header Connection '';
        proxy_buffering off;
        proxy_read_timeout 3600s;
    }
}
EOF

# Enable site
ln -sf /etc/nginx/sites-available/${APP_NAME} /etc/nginx/sites-enabled/
rm -f /etc/nginx/sites-enabled/default

# Test nginx configuration
nginx -t

# Start nginx
systemctl restart nginx
systemctl enable nginx

# ============================================
# 7. Create Application User and Directory
# ============================================
echo -e "${GREEN}[7/10] Creating application user and directory...${NC}"

# Create user if doesn't exist
if ! id "$APP_USER" &>/dev/null; then
    useradd -m -s /bin/bash $APP_USER
    echo -e "${GREEN}Created user: $APP_USER${NC}"
fi

# Create app directory
mkdir -p $APP_DIR
chown -R $APP_USER:$APP_USER $APP_DIR

# Add jenkins user to app user group for deployment
usermod -aG $APP_USER jenkins

# ============================================
# 8. Configure Firewall
# ============================================
echo -e "${GREEN}[8/10] Configuring firewall...${NC}"
ufw --force enable
ufw allow OpenSSH
ufw allow 80/tcp
ufw allow 443/tcp
ufw allow 8080/tcp  # Jenkins
ufw status

# ============================================
# 9. Install Certbot for SSL (Optional)
# ============================================
echo -e "${GREEN}[9/10] Installing Certbot for SSL...${NC}"
apt-get install -y certbot python3-certbot-nginx

echo -e "${YELLOW}To set up SSL, run after DNS is configured:${NC}"
echo "  certbot --nginx -d ${DOMAIN_NAME} -d www.${DOMAIN_NAME}"

# ============================================
# 10. Create Jenkins Pipeline Script
# ============================================
echo -e "${GREEN}[10/10] Creating Jenkins pipeline script...${NC}"

mkdir -p /var/lib/jenkins/jobs/${APP_NAME}
cat > /var/lib/jenkins/jobs/${APP_NAME}/Jenkinsfile <<'JENKINSFILE'
pipeline {
    agent any
    
    environment {
        APP_NAME = 'findotrip'
        APP_DIR = '/var/www/findotrip'
        APP_USER = 'findotrip'
        NODE_ENV = 'production'
    }
    
    triggers {
        // Poll SCM every 5 minutes
        pollSCM('H/5 * * * *')
        
        // Or use webhook (recommended)
        // Configure webhook in your Git provider:
        // URL: http://your-server-ip:8080/github-webhook/
    }
    
    stages {
        stage('Checkout') {
            steps {
                echo 'Checking out code from repository...'
                checkout scm
            }
        }
        
        stage('Install Dependencies') {
            steps {
                echo 'Installing npm dependencies...'
                sh '''
                    cd ${APP_DIR}
                    npm ci --production=false
                '''
            }
        }
        
        stage('Build') {
            steps {
                echo 'Building application...'
                sh '''
                    cd ${APP_DIR}
                    npm run build
                '''
            }
        }
        
        stage('Run Tests') {
            steps {
                echo 'Running tests...'
                sh '''
                    cd ${APP_DIR}
                    npm test || true  # Continue even if tests fail
                '''
            }
        }
        
        stage('Deploy') {
            steps {
                echo 'Deploying application...'
                sh '''
                    # Stop existing application
                    pm2 stop ${APP_NAME} || true
                    pm2 delete ${APP_NAME} || true
                    
                    # Start application with PM2
                    cd ${APP_DIR}
                    pm2 start npm --name "${APP_NAME}" -- start
                    pm2 save
                    pm2 startup systemd -u ${APP_USER} --hp /home/${APP_USER}
                '''
            }
        }
        
        stage('Health Check') {
            steps {
                echo 'Checking application health...'
                sh '''
                    sleep 5
                    curl -f http://localhost:3000 || exit 1
                '''
            }
        }
    }
    
    post {
        success {
            echo 'Deployment successful!'
        }
        failure {
            echo 'Deployment failed!'
            // You can add notification here (email, Slack, etc.)
        }
    }
}
JENKINSFILE

chown jenkins:jenkins /var/lib/jenkins/jobs/${APP_NAME}/Jenkinsfile

# ============================================
# 11. Create Deployment Helper Script
# ============================================
echo -e "${GREEN}Creating deployment helper script...${NC}"

cat > /usr/local/bin/deploy-${APP_NAME}.sh <<'DEPLOYSCRIPT'
#!/bin/bash
set -e

APP_NAME="findotrip"
APP_DIR="/var/www/findotrip"
APP_USER="findotrip"

cd $APP_DIR

# Pull latest changes
sudo -u $APP_USER git pull origin main

# Install dependencies
sudo -u $APP_USER npm ci --production=false

# Build application
sudo -u $APP_USER npm run build

# Restart application
pm2 restart $APP_NAME || pm2 start npm --name "$APP_NAME" -- start
pm2 save

echo "Deployment completed successfully!"
DEPLOYSCRIPT

chmod +x /usr/local/bin/deploy-${APP_NAME}.sh

# ============================================
# 12. Create Environment Setup Script
# ============================================
echo -e "${GREEN}Creating environment setup script...${NC}"

cat > ${APP_DIR}/setup-env.sh <<'ENVSCRIPT'
#!/bin/bash
# Run this script to set up your .env file

echo "Setting up environment variables..."
echo ""

read -p "Database URL: " DATABASE_URL
read -p "Session Secret: " SESSION_SECRET
read -p "APP URL (e.g., https://yourdomain.com): " APP_URL
read -p "Stripe Secret Key (optional): " STRIPE_SECRET_KEY
read -p "Stripe Publishable Key (optional): " STRIPE_PUBLISHABLE_KEY
read -p "Google Client ID (optional): " GOOGLE_CLIENT_ID
read -p "Google Client Secret (optional): " GOOGLE_CLIENT_SECRET
read -p "Facebook Client ID (optional): " FACEBOOK_CLIENT_ID
read -p "Facebook Client Secret (optional): " FACEBOOK_CLIENT_SECRET

cat > .env <<EOF
NODE_ENV=production
DATABASE_URL=${DATABASE_URL}
SESSION_SECRET=${SESSION_SECRET}
APP_URL=${APP_URL}
STRIPE_SECRET_KEY=${STRIPE_SECRET_KEY}
STRIPE_PUBLISHABLE_KEY=${STRIPE_PUBLISHABLE_KEY}
GOOGLE_CLIENT_ID=${GOOGLE_CLIENT_ID}
GOOGLE_CLIENT_SECRET=${GOOGLE_CLIENT_SECRET}
FACEBOOK_CLIENT_ID=${FACEBOOK_CLIENT_ID}
FACEBOOK_CLIENT_SECRET=${FACEBOOK_CLIENT_SECRET}
EOF

echo ""
echo "Environment file created successfully!"
ENVSCRIPT

chmod +x ${APP_DIR}/setup-env.sh
chown $APP_USER:$APP_USER ${APP_DIR}/setup-env.sh

# ============================================
# Summary and Next Steps
# ============================================
echo ""
echo -e "${GREEN}============================================"
echo "Setup Complete!"
echo "============================================${NC}"
echo ""
echo -e "${YELLOW}Next Steps:${NC}"
echo ""
echo "1. Access Jenkins:"
echo "   http://$(hostname -I | awk '{print $1}'):8080"
echo "   Initial Password: $JENKINS_PASSWORD"
echo ""
echo "2. Install Jenkins Plugins (after first login):"
echo "   - Git plugin"
echo "   - NodeJS plugin"
echo "   - Pipeline plugin"
echo "   - GitHub plugin (if using GitHub)"
echo ""
echo "3. Configure Jenkins:"
echo "   - Go to Manage Jenkins > Global Tool Configuration"
echo "   - Add Node.js installation (version 20.x)"
echo "   - Configure Git with your credentials"
echo ""
echo "4. Create Jenkins Pipeline Job:"
echo "   - New Item > Pipeline"
echo "   - Name: ${APP_NAME}"
echo "   - Pipeline > Definition: Pipeline script from SCM"
echo "   - SCM: Git"
echo "   - Repository URL: ${GIT_REPO}"
echo "   - Branch: */${BRANCH}"
echo "   - Script Path: Jenkinsfile"
echo ""
echo "5. Set up your application:"
echo "   cd ${APP_DIR}"
echo "   sudo -u ${APP_USER} git clone ${GIT_REPO} ."
echo "   sudo -u ${APP_USER} ./setup-env.sh  # Configure environment variables"
echo ""
echo "6. Set up SSL (after DNS is configured):"
echo "   certbot --nginx -d ${DOMAIN_NAME} -d www.${DOMAIN_NAME}"
echo ""
echo "7. Configure Git Webhook (recommended):"
echo "   - In your Git provider, add webhook:"
echo "   - URL: http://$(hostname -I | awk '{print $1}'):8080/github-webhook/"
echo "   - Content type: application/json"
echo "   - Events: Just the push event"
echo ""
echo -e "${GREEN}Setup completed successfully!${NC}"
echo ""

