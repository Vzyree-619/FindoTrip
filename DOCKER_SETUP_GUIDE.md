# 🐳 FindoTrip - Docker Setup Guide

A complete Docker-based deployment solution for FindoTrip that replaces Jenkins/Nginx setup with containerized services.

## 📋 Table of Contents

- [Prerequisites](#prerequisites)
- [Quick Start](#quick-start)
- [Configuration](#configuration)
- [Development Setup](#development-setup)
- [Production Setup](#production-setup)
- [SSL Configuration](#ssl-configuration)
- [Database Management](#database-management)
- [Monitoring & Logs](#monitoring--logs)
- [Backup & Restore](#backup--restore)
- [Troubleshooting](#troubleshooting)
- [Deployment Commands](#deployment-commands)

## 🎯 Prerequisites

Before starting, ensure you have:

### Required Software
- ✅ **Docker** (20.10+)
- ✅ **Docker Compose** (2.0+)
- ✅ **Git**
- ✅ **curl** or **wget**

### System Requirements
- **RAM**: Minimum 4GB, Recommended 8GB+
- **CPU**: 2+ cores
- **Storage**: 20GB+ free space
- **OS**: Linux (Ubuntu 20.04+, CentOS 8+, Debian 10+)

### Network Requirements
- **Ports**: 80, 443, 27017 (MongoDB), 6379 (Redis)
- **Domain**: Pointed to your server IP

## 🚀 Quick Start

### 1. Clone and Setup
```bash
# Clone repository
git clone https://github.com/yourusername/FindoTrip.git
cd FindoTrip

# Copy environment template
cp env.example .env

# Edit environment variables (see Configuration section)
nano .env
```

### 2. Development Deployment
```bash
# Start all services
docker-compose up -d

# View logs
docker-compose logs -f

# Access application
# - Frontend: http://localhost
# - MongoDB Admin: http://localhost:8081
```

### 3. Production Deployment
```bash
# Generate secure secrets
./scripts/generate-env-secrets.sh

# Start production services
docker-compose -f docker-compose.yml -f docker-compose.prod.yml up -d

# Setup SSL (optional)
docker-compose --profile ssl up -d
```

## ⚙️ Configuration

### Environment Variables

Create a `.env` file in the project root:

```env
# ========================================
# FINDOTRIP DOCKER ENVIRONMENT
# ========================================

# Application
NODE_ENV=production
APP_URL=https://yourdomain.com
PORT=3000

# Database (Docker Internal)
DATABASE_URL=mongodb://findotrip_user:findotrip_password@mongo:27017/findotrip

# Session Security (Generate with ./scripts/generate-env-secrets.sh)
SESSION_SECRET=your-super-secure-random-string-here
JWT_SECRET=another-super-secure-random-string-here

# MongoDB Docker Configuration
MONGO_ROOT_USERNAME=admin
MONGO_ROOT_PASSWORD=your_secure_mongo_root_password
MONGO_EXPRESS_USERNAME=admin
MONGO_EXPRESS_PASSWORD=your_secure_express_password

# Redis Configuration
REDIS_PASSWORD=your_secure_redis_password

# External Services (Same as before)
STRIPE_SECRET_KEY=sk_live_...
STRIPE_PUBLISHABLE_KEY=pk_live_...
CLOUDINARY_CLOUD_NAME=...
CLOUDINARY_API_KEY=...
CLOUDINARY_API_SECRET=...
SENDGRID_API_KEY=SG...
GOOGLE_CLIENT_ID=...
GOOGLE_CLIENT_SECRET=...
FACEBOOK_CLIENT_ID=...
FACEBOOK_CLIENT_SECRET=...

# Admin Account
ADMIN_EMAIL=admin@yourdomain.com
ADMIN_PASSWORD=ChangeThisSecurePassword123!
```

### Docker-Specific Variables

**MongoDB Configuration:**
```env
# Root credentials (for admin access)
MONGO_ROOT_USERNAME=admin
MONGO_ROOT_PASSWORD=secure_root_password

# Application user (created automatically)
# Username: findotrip_user
# Password: findotrip_password
# Database: findotrip
```

**Redis Configuration:**
```env
REDIS_PASSWORD=your_secure_redis_password
```

## 🛠️ Development Setup

### Start Development Environment
```bash
# Start all services with development overrides
docker-compose up -d

# Include MongoDB admin interface
docker-compose --profile dev up -d
```

### Development URLs
- **Application**: http://localhost
- **MongoDB Admin**: http://localhost:8081
  - Username: `admin` (from MONGO_EXPRESS_USERNAME)
  - Password: `your_secure_express_password`
- **MongoDB Direct**: localhost:27017
- **Redis Direct**: localhost:6379

### Development Workflow
```bash
# View logs
docker-compose logs -f app

# Restart application after code changes
docker-compose restart app

# Rebuild application
docker-compose build app
docker-compose up -d app

# Stop all services
docker-compose down
```

## 🏭 Production Setup

### 1. Server Preparation
```bash
# Update system
sudo apt update && sudo apt upgrade -y

# Install Docker
curl -fsSL https://get.docker.com -o get-docker.sh
sudo sh get-docker.sh
sudo systemctl enable docker

# Install Docker Compose
sudo curl -L "https://github.com/docker/compose/releases/latest/download/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
sudo chmod +x /usr/local/bin/docker-compose

# Add user to docker group (optional)
sudo usermod -aG docker $USER
```

### 2. Application Deployment
```bash
# Clone repository
git clone https://github.com/yourusername/FindoTrip.git
cd FindoTrip

# Setup environment
cp env.example .env
nano .env  # Configure your variables

# Generate secrets
./scripts/generate-env-secrets.sh

# Start production services
docker-compose -f docker-compose.yml -f docker-compose.prod.yml up -d

# Verify deployment
docker-compose ps
docker-compose logs -f
```

### 3. SSL Configuration (Let's Encrypt)
```bash
# Start SSL certificate manager
docker-compose --profile ssl up -d

# Get initial certificate (replace yourdomain.com)
docker-compose exec certbot certbot certonly --webroot \
  --webroot-path=/var/www/certbot \
  -d yourdomain.com \
  -d www.yourdomain.com

# Reload nginx configuration
docker-compose exec nginx nginx -s reload
```

### 4. Domain Configuration
Point your domain A record to your server IP:
```
yourdomain.com    A    YOUR_SERVER_IP
www.yourdomain.com A    YOUR_SERVER_IP
```

## 📊 Monitoring & Logs

### View Service Status
```bash
# Check all containers
docker-compose ps

# Check specific service
docker-compose ps app
docker-compose ps mongo
```

### Application Logs
```bash
# All services
docker-compose logs -f

# Specific service
docker-compose logs -f app
docker-compose logs -f nginx
docker-compose logs -f mongo
```

### Resource Usage
```bash
# Container resource usage
docker stats

# Disk usage
docker system df

# Clean up unused resources
docker system prune -a --volumes
```

## 💾 Database Management

### MongoDB Backup
```bash
# Create backup
docker-compose exec mongo mongodump --db findotrip --out /backup/$(date +%Y%m%d_%H%M%S)

# Copy backup to host
docker cp $(docker-compose ps -q mongo):/backup ./backups/

# Compress backup
tar -czf backup_$(date +%Y%m%d).tar.gz ./backups/
```

### MongoDB Restore
```bash
# Copy backup to container
docker cp ./backup_20231201.tar.gz $(docker-compose ps -q mongo):/backup/

# Extract and restore
docker-compose exec mongo bash -c "cd /backup && tar -xzf backup_20231201.tar.gz"
docker-compose exec mongo mongorestore --db findotrip /backup/backups/findotrip
```

### Database Maintenance
```bash
# Connect to MongoDB shell
docker-compose exec mongo mongosh -u findotrip_user -p findotrip_password findotrip

# Check database size
docker-compose exec mongo mongosh --eval "db.stats()"

# Repair database (if needed)
docker-compose exec mongo mongod --repair
```

## 🔧 Troubleshooting

### Common Issues

#### Application Won't Start
```bash
# Check application logs
docker-compose logs app

# Check environment variables
docker-compose exec app env | grep -E "(DATABASE_URL|SESSION_SECRET)"

# Restart application
docker-compose restart app
```

#### Database Connection Issues
```bash
# Check MongoDB logs
docker-compose logs mongo

# Test database connection
docker-compose exec mongo mongosh --eval "db.adminCommand('ping')"

# Check MongoDB user
docker-compose exec mongo mongosh -u findotrip_user -p findotrip_password findotrip --eval "db.stats()"
```

#### Nginx Issues
```bash
# Check nginx configuration
docker-compose exec nginx nginx -t

# Reload nginx
docker-compose exec nginx nginx -s reload

# Check nginx logs
docker-compose logs nginx
```

#### Port Conflicts
```bash
# Check what's using ports
sudo netstat -tulpn | grep :80
sudo netstat -tulpn | grep :443

# Stop conflicting services
sudo systemctl stop apache2
sudo systemctl stop nginx
```

#### Memory Issues
```bash
# Check memory usage
docker stats

# Increase Docker memory limit
# Edit /etc/docker/daemon.json
{
  "default-ulimits": {
    "nofile": {
      "Name": "nofile",
      "Hard": 64000,
      "Soft": 64000
    }
  }
}
```

### Reset Everything
```bash
# Stop and remove all containers, volumes, networks
docker-compose down -v --remove-orphans

# Clean up Docker system
docker system prune -a --volumes

# Restart fresh
docker-compose up -d
```

## 📝 Deployment Commands

### Development
```bash
# Start development environment
docker-compose up -d

# Start with MongoDB admin
docker-compose --profile dev up -d

# Rebuild and restart
docker-compose build && docker-compose up -d

# Stop all services
docker-compose down
```

### Production
```bash
# Start production environment
docker-compose -f docker-compose.yml -f docker-compose.prod.yml up -d

# Start with SSL
docker-compose -f docker-compose.yml -f docker-compose.prod.yml --profile ssl up -d

# Update application
git pull && docker-compose build app && docker-compose up -d app

# View production logs
docker-compose logs -f --tail=100
```

### Maintenance
```bash
# Backup database
docker-compose exec mongo mongodump --db findotrip --out /backup/$(date +%Y%m%d)

# Update all images
docker-compose pull

# Restart all services
docker-compose restart

# Scale services (if needed)
docker-compose up -d --scale app=3
```

## 🔒 Security Considerations

### Docker Security
```bash
# Run security scan
docker run --rm -v /var/run/docker.sock:/var/run/docker.sock \
  docker/docker-bench-security

# Use security-focused base images
# (Already configured in Dockerfile)
```

### Network Security
- ✅ Nginx as reverse proxy with security headers
- ✅ Rate limiting configured
- ✅ No direct database exposure in production
- ✅ Internal Docker network isolation

### Environment Security
- ✅ Secrets in environment variables
- ✅ No hardcoded passwords
- ✅ Secure random secrets generation
- ✅ Separate credentials for different services

## 📈 Scaling

### Horizontal Scaling
```bash
# Scale application containers
docker-compose up -d --scale app=3

# Load balancing with nginx
# (Already configured in nginx.conf)
```

### Database Scaling
```bash
# Use MongoDB replica set for high availability
# (Configure in docker-compose.prod.yml)
```

### Performance Optimization
```bash
# Enable Redis caching
# (Already configured, just set REDIS_URL in .env)

# Database indexing
# (Indexes created automatically in init.js)
```

## 🔄 Updates & Maintenance

### Application Updates
```bash
# Pull latest changes
git pull

# Build and deploy
docker-compose build app
docker-compose up -d app

# Zero-downtime deployment
docker-compose up -d --scale app=2
docker-compose up -d --scale app=1
```

### System Updates
```bash
# Update Docker images
docker-compose pull

# Update Docker Compose
sudo curl -L "https://github.com/docker/compose/releases/latest/download/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose

# System updates
sudo apt update && sudo apt upgrade -y
```

## 📞 Support

### Health Checks
```bash
# Application health
curl http://localhost/health

# Database health
docker-compose exec mongo mongosh --eval "db.adminCommand('ping')"
```

### Log Analysis
```bash
# Follow all logs
docker-compose logs -f

# Search logs for errors
docker-compose logs | grep -i error

# Export logs for analysis
docker-compose logs > logs_$(date +%Y%m%d).txt
```

---

## 🎉 You're All Set!

Your FindoTrip application is now running in a fully containerized environment with:

- ✅ **Automated deployment** with Docker Compose
- ✅ **Production-ready** configuration
- ✅ **SSL support** with Let's Encrypt
- ✅ **Database backups** and maintenance
- ✅ **Monitoring** and logging
- ✅ **Security** best practices
- ✅ **Scaling** capabilities

Enjoy your simplified deployment process! 🚀
