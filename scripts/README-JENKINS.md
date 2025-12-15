# Jenkins CI/CD Setup Guide for FindoTrip

This guide will help you set up Jenkins for automated deployment of FindoTrip on your Ubuntu VPS.

## Prerequisites

- Ubuntu 20.04 or later
- Root or sudo access
- Domain name (optional, for SSL)
- Git repository URL

## Quick Setup

### 1. Configure Variables

Before running the script, set these environment variables:

```bash
export DOMAIN_NAME="yourdomain.com"
export GIT_REPO="https://github.com/yourusername/FindoTrip.git"
export BRANCH="main"
```

### 2. Run the Setup Script

```bash
# Make script executable
chmod +x jenkins-nginx-setup.sh

# Run as root
sudo ./jenkins-nginx-setup.sh
```

The script will:
- Install Java 17
- Install Node.js 20.x
- Install Jenkins
- Install and configure Nginx
- Set up firewall rules
- Create deployment scripts
- Configure application directory

### 3. Access Jenkins

After the script completes:

1. Open your browser: `http://your-server-ip:8080`
2. Get the initial admin password:
   ```bash
   sudo cat /var/lib/jenkins/secrets/initialAdminPassword
   ```
3. Complete the Jenkins setup wizard
4. Install recommended plugins

### 4. Post-Setup Configuration

#### Install Additional Plugins

Run the post-setup script (optional):

```bash
chmod +x jenkins-post-setup.sh
export JENKINS_PASSWORD="your-admin-password"
sudo ./jenkins-post-setup.sh
```

Or manually install:
- Git plugin
- NodeJS plugin
- Pipeline plugin
- GitHub plugin (if using GitHub)

#### Configure Node.js in Jenkins

1. Go to: **Manage Jenkins > Global Tool Configuration**
2. Find **NodeJS** section
3. Click **Add NodeJS**
4. Name: `NodeJS-20`
5. Version: `20.x` (or latest LTS)
6. Save

#### Configure Git Credentials

1. Go to: **Manage Jenkins > Manage Credentials**
2. Add credentials for your Git repository
3. Use SSH keys or username/password

### 5. Create Jenkins Pipeline Job

1. **New Item** > **Pipeline**
2. Name: `findotrip`
3. **Pipeline** section:
   - Definition: **Pipeline script from SCM**
   - SCM: **Git**
   - Repository URL: Your Git repository URL
   - Credentials: Select your Git credentials
   - Branch: `*/main`
   - Script Path: `Jenkinsfile`
4. **Build Triggers**:
   - ✅ **Poll SCM**: `H/5 * * * *` (every 5 minutes)
   - Or configure webhook (recommended)

### 6. Set Up Webhook (Recommended)

#### For GitHub:

1. Go to your repository > **Settings > Webhooks**
2. Click **Add webhook**
3. Payload URL: `http://your-server-ip:8080/github-webhook/`
4. Content type: `application/json`
5. Events: **Just the push event**
6. Active: ✅
7. Click **Add webhook**

#### For GitLab:

1. Go to your project > **Settings > Webhooks**
2. URL: `http://your-server-ip:8080/project/findotrip`
3. Trigger: **Push events**
4. Click **Add webhook**

### 7. Initial Application Setup

```bash
# Clone repository
cd /var/www/findotrip
sudo -u findotrip git clone https://github.com/yourusername/FindoTrip.git .

# Set up environment variables
sudo -u findotrip ./setup-env.sh

# Install dependencies
sudo -u findotrip npm ci

# Build application
sudo -u findotrip npm run build

# Start with PM2
sudo -u findotrip pm2 start npm --name "findotrip" -- start
sudo -u findotrip pm2 save
```

### 8. Set Up SSL (After DNS is Configured)

```bash
sudo certbot --nginx -d yourdomain.com -d www.yourdomain.com
```

This will automatically configure HTTPS in Nginx.

### 9. Update Nginx for HTTPS

After SSL setup, update the Nginx config to redirect HTTP to HTTPS:

```nginx
server {
    listen 80;
    server_name yourdomain.com www.yourdomain.com;
    return 301 https://$server_name$request_uri;
}

server {
    listen 443 ssl http2;
    server_name yourdomain.com www.yourdomain.com;
    
    ssl_certificate /etc/letsencrypt/live/yourdomain.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/yourdomain.com/privkey.pem;
    
    # ... rest of configuration
}
```

## Jenkinsfile Configuration

The Jenkinsfile is automatically created at:
`/var/lib/jenkins/jobs/findotrip/Jenkinsfile`

You can customize it or copy it to your repository root.

## Manual Deployment

If you need to deploy manually:

```bash
sudo /usr/local/bin/deploy-findotrip.sh
```

## Monitoring

### Check Application Status

```bash
pm2 status
pm2 logs findotrip
```

### Check Nginx Status

```bash
sudo systemctl status nginx
sudo nginx -t
```

### Check Jenkins Status

```bash
sudo systemctl status jenkins
```

## Troubleshooting

### Jenkins won't start

```bash
sudo systemctl status jenkins
sudo journalctl -u jenkins -f
```

### Application not accessible

1. Check if PM2 is running: `pm2 status`
2. Check application logs: `pm2 logs findotrip`
3. Check Nginx: `sudo nginx -t`
4. Check firewall: `sudo ufw status`

### Build fails in Jenkins

1. Check Jenkins console output
2. Verify Node.js is configured in Global Tool Configuration
3. Check Git credentials
4. Verify environment variables are set

### Permission issues

```bash
# Fix ownership
sudo chown -R findotrip:findotrip /var/www/findotrip

# Add jenkins to findotrip group
sudo usermod -aG findotrip jenkins
```

## Security Recommendations

1. **Change Jenkins default port** (if needed):
   ```bash
   sudo nano /etc/default/jenkins
   # Change HTTP_PORT=8080 to your desired port
   ```

2. **Set up Jenkins reverse proxy** with Nginx (recommended for production)

3. **Enable Jenkins security**:
   - Configure user authentication
   - Set up role-based access control
   - Enable CSRF protection

4. **Keep system updated**:
   ```bash
   sudo apt update && sudo apt upgrade -y
   ```

## Useful Commands

```bash
# Restart Jenkins
sudo systemctl restart jenkins

# Restart Nginx
sudo systemctl restart nginx

# Restart application
pm2 restart findotrip

# View Jenkins logs
sudo journalctl -u jenkins -f

# View application logs
pm2 logs findotrip

# Check disk space
df -h
```

## Support

For issues or questions, check:
- Jenkins logs: `/var/log/jenkins/jenkins.log`
- Application logs: `pm2 logs findotrip`
- Nginx logs: `/var/log/nginx/error.log`

