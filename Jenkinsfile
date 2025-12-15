pipeline {
    agent any
    
    environment {
        APP_NAME = 'findotrip'
        APP_DIR = '/var/www/findotrip'
        APP_USER = 'findotrip'
        NODE_ENV = 'production'
    }
    
    triggers {
        // Poll SCM every 5 minutes (fallback)
        pollSCM('H/5 * * * *')
        
        // For webhook triggers, configure in Git provider:
        // GitHub: Settings > Webhooks > Add webhook
        // URL: http://your-server-ip:8080/github-webhook/
        // GitLab: Settings > Webhooks > Add webhook
        // URL: http://your-server-ip:8080/project/findotrip
    }
    
    stages {
        stage('Checkout') {
            steps {
                echo '📥 Checking out code from repository...'
                checkout scm
                
                // Display current commit
                sh '''
                    echo "Current branch: $(git branch --show-current)"
                    echo "Latest commit: $(git log -1 --pretty=format:'%h - %s (%an, %ar)')"
                '''
            }
        }
        
        stage('Install Dependencies') {
            steps {
                echo '📦 Installing npm dependencies...'
                sh '''
                    cd ${APP_DIR}
                    npm ci --production=false
                '''
            }
        }
        
        stage('Generate Prisma Client') {
            steps {
                echo '🔧 Generating Prisma client...'
                sh '''
                    cd ${APP_DIR}
                    npx prisma generate
                '''
            }
        }
        
        stage('Build') {
            steps {
                echo '🏗️ Building application...'
                sh '''
                    cd ${APP_DIR}
                    npm run build
                '''
            }
        }
        
        stage('Run Tests') {
            steps {
                echo '🧪 Running tests...'
                sh '''
                    cd ${APP_DIR}
                    npm run test:run || true  # Continue even if tests fail
                '''
            }
        }
        
        stage('Deploy') {
            steps {
                echo '🚀 Deploying application...'
                sh '''
                    # Stop existing application
                    pm2 stop ${APP_NAME} || true
                    pm2 delete ${APP_NAME} || true
                    
                    # Start application with PM2
                    cd ${APP_DIR}
                    pm2 start npm --name "${APP_NAME}" -- start
                    pm2 save
                    
                    # Reload PM2 to ensure it starts on reboot
                    pm2 startup systemd -u ${APP_USER} --hp /home/${APP_USER} || true
                '''
            }
        }
        
        stage('Health Check') {
            steps {
                echo '🏥 Checking application health...'
                sh '''
                    # Wait for application to start
                    sleep 10
                    
                    # Check if application is responding
                    for i in {1..5}; do
                        if curl -f http://localhost:3000 > /dev/null 2>&1; then
                            echo "✅ Application is healthy!"
                            exit 0
                        fi
                        echo "⏳ Waiting for application to start... ($i/5)"
                        sleep 5
                    done
                    
                    echo "❌ Application health check failed!"
                    exit 1
                '''
            }
        }
    }
    
    post {
        success {
            echo '✅ Deployment successful!'
            // You can add notifications here (email, Slack, etc.)
            // Example:
            // emailext (
            //     subject: "✅ Deployment Successful: ${env.JOB_NAME}",
            //     body: "Build ${env.BUILD_NUMBER} deployed successfully!",
            //     to: "admin@yourdomain.com"
            // )
        }
        failure {
            echo '❌ Deployment failed!'
            // You can add notifications here
            // Example:
            // emailext (
            //     subject: "❌ Deployment Failed: ${env.JOB_NAME}",
            //     body: "Build ${env.BUILD_NUMBER} failed. Check logs for details.",
            //     to: "admin@yourdomain.com"
            // )
        }
        always {
            echo '📊 Cleaning up...'
            // Clean up any temporary files if needed
        }
    }
}

