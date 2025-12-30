#!/bin/bash

# ========================================
# FindoTrip - Docker Deployment Script
# ========================================
# Simple deployment script for Docker-based FindoTrip

set -e  # Exit on any error

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Functions
log_info() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

log_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

log_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

log_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Check if Docker is installed
check_docker() {
    if ! command -v docker &> /dev/null; then
        log_error "Docker is not installed. Please install Docker first."
        exit 1
    fi

    if ! command -v docker-compose &> /dev/null; then
        log_error "Docker Compose is not installed. Please install Docker Compose first."
        exit 1
    fi
}

# Setup environment
setup_environment() {
    log_info "Setting up environment..."

    if [ ! -f ".env" ]; then
        log_warning ".env file not found. Creating from template..."
        if [ -f "env.example" ]; then
            cp env.example .env
            log_warning "Please edit .env file with your configuration before proceeding."
            log_info "Run: nano .env"
            exit 1
        else
            log_error "env.example file not found. Please create .env manually."
            exit 1
        fi
    fi

    log_success "Environment file found."
}

# Deploy for development
deploy_dev() {
    log_info "Starting development deployment..."

    docker-compose -f docker-compose.yml -f docker-compose.dev.yml up -d
    log_success "Development environment started!"

    log_info "Application: http://localhost:3000"
    log_info "MongoDB Admin: http://localhost:8081"
    log_info "View logs: docker-compose logs -f"
}

# Deploy for production
deploy_prod() {
    log_info "Starting production deployment..."

    # Generate secrets if not present
    if ! grep -q "SESSION_SECRET=your-super-secure" .env 2>/dev/null; then
        log_info "Generating secure secrets..."
        if [ -f "scripts/generate-env-secrets.sh" ]; then
            bash scripts/generate-env-secrets.sh
        fi
    fi

    docker-compose -f docker-compose.yml -f docker-compose.prod.yml up -d
    log_success "Production environment started!"

    log_info "Application: http://your-domain.com (configure domain)"
    log_info "View logs: docker-compose logs -f"
}

# Setup SSL
setup_ssl() {
    log_info "Setting up SSL certificates..."

    if [ -z "$DOMAIN" ]; then
        read -p "Enter your domain name: " DOMAIN
    fi

    docker-compose --profile ssl up -d

    docker-compose exec certbot certbot certonly --webroot \
        --webroot-path=/var/www/certbot \
        -d $DOMAIN

    docker-compose exec nginx nginx -s reload
    log_success "SSL certificates configured for $DOMAIN"
}

# Show status
show_status() {
    log_info "Service Status:"
    docker-compose ps

    log_info "Resource Usage:"
    docker stats --no-stream
}

# Show logs
show_logs() {
    log_info "Showing logs (Ctrl+C to exit)..."
    docker-compose logs -f
}

# Stop services
stop_services() {
    log_info "Stopping all services..."
    docker-compose down
    log_success "Services stopped."
}

# Clean up
cleanup() {
    log_warning "This will remove all containers, volumes, and images!"
    read -p "Are you sure? (y/N): " -n 1 -r
    echo
    if [[ $REPLY =~ ^[Yy]$ ]]; then
        docker-compose down -v --remove-orphans
        docker system prune -a --volumes -f
        log_success "Cleanup completed."
    fi
}

# Main menu
show_menu() {
    echo "🐳 FindoTrip Docker Deployment"
    echo "=============================="
    echo "1) Deploy Development Environment"
    echo "2) Deploy Production Environment"
    echo "3) Setup SSL Certificates"
    echo "4) Show Service Status"
    echo "5) Show Logs"
    echo "6) Stop Services"
    echo "7) Cleanup (Dangerous!)"
    echo "8) Exit"
    echo ""
}

# Main script
main() {
    check_docker
    setup_environment

    while true; do
        show_menu
        read -p "Choose an option (1-8): " choice

        case $choice in
            1)
                deploy_dev
                break
                ;;
            2)
                deploy_prod
                break
                ;;
            3)
                setup_ssl
                ;;
            4)
                show_status
                ;;
            5)
                show_logs
                ;;
            6)
                stop_services
                ;;
            7)
                cleanup
                ;;
            8)
                log_info "Goodbye!"
                exit 0
                ;;
            *)
                log_error "Invalid option. Please choose 1-8."
                ;;
        esac
        echo ""
        read -p "Press Enter to continue..."
    done
}

# Run main function
main "$@"
