module.exports = {
  apps: [{
    name: 'findotrip',
    script: './build/index.js', // or your start script
    cwd: '/var/www/findotrip/FindoTrip',
    env: {
      NODE_ENV: 'production',
      DATABASE_URL: 'mongodb+srv://findotrip_admin:ogvBMaZeEjNIWqsG@findotrip.cia0jdg.mongodb.net/FindoTrip?retryWrites=true&w=majority&appName=FindoTrip',
      SESSION_SECRET: 'your-secret-key-change-in-production',
      CLOUDINARY_CLOUD_NAME: "dcl3zbyyw",
     CLOUDINARY_CLOUD_NAME: "dcl3zbyyw",
    REDIS_URL: "redis://localhost:6379",
   NODE_ENV: "production",
CHAT_SECRET_KEY:"your-chat-secret",
CLOUDINARY_API_KEY:"756147368862446",
CLOUDINARY_API_SECRET:"wLeNwtluV1Bwg-_43h64U8I6EOg"
      // Add any other environment variables you need
    }
  }]
}
