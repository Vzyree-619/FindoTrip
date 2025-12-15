#!/bin/bash

# ============================================
# Jenkins Post-Setup Configuration Script
# Run this after initial Jenkins setup
# ============================================

set -e

echo "============================================"
echo "Jenkins Post-Setup Configuration"
echo "============================================"
echo ""

# Colors
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

JENKINS_URL="${JENKINS_URL:-http://localhost:8080}"
JENKINS_USER="${JENKINS_USER:-admin}"
JENKINS_PASSWORD="${JENKINS_PASSWORD}"

if [ -z "$JENKINS_PASSWORD" ]; then
    echo -e "${YELLOW}Please provide Jenkins admin password:${NC}"
    read -s JENKINS_PASSWORD
fi

# Install Jenkins CLI
echo -e "${GREEN}Installing Jenkins CLI...${NC}"
wget ${JENKINS_URL}/jnlpJars/jenkins-cli.jar -O /tmp/jenkins-cli.jar

# Install required plugins
echo -e "${GREEN}Installing Jenkins plugins...${NC}"
java -jar /tmp/jenkins-cli.jar -s ${JENKINS_URL} -auth ${JENKINS_USER}:${JENKINS_PASSWORD} install-plugin \
    git \
    nodejs \
    pipeline-stage-view \
    workflow-aggregator \
    github \
    blueocean \
    -restart

echo ""
echo -e "${GREEN}Plugins installation initiated. Jenkins will restart.${NC}"
echo -e "${YELLOW}Wait for Jenkins to restart, then configure Node.js in:${NC}"
echo "  Manage Jenkins > Global Tool Configuration > NodeJS"
echo ""

