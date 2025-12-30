// ========================================
// FindoTrip - MongoDB Initialization Script
// ========================================
// This script runs when MongoDB container starts for the first time

db = db.getSiblingDB('findotrip');

// Create application user
db.createUser({
  user: 'findotrip_user',
  pwd: 'findotrip_password',
  roles: [
    {
      role: 'readWrite',
      db: 'findotrip'
    }
  ]
});

// Create indexes for better performance
db.properties.createIndex({ "location.coordinates": "2dsphere" });
db.properties.createIndex({ "price": 1 });
db.properties.createIndex({ "createdAt": -1 });

db.vehicles.createIndex({ "location.coordinates": "2dsphere" });
db.vehicles.createIndex({ "pricePerDay": 1 });
db.vehicles.createIndex({ "createdAt": -1 });

db.tours.createIndex({ "location.coordinates": "2dsphere" });
db.tours.createIndex({ "price": 1 });
db.tours.createIndex({ "createdAt": -1 });

db.users.createIndex({ "email": 1 }, { unique: true });
db.users.createIndex({ "createdAt": -1 });

db.bookings.createIndex({ "userId": 1 });
db.bookings.createIndex({ "createdAt": -1 });
db.bookings.createIndex({ "status": 1 });

db.payments.createIndex({ "bookingId": 1 });
db.payments.createIndex({ "status": 1 });
db.payments.createIndex({ "createdAt": -1 });

// Create collections if they don't exist
db.createCollection('properties');
db.createCollection('vehicles');
db.createCollection('tours');
db.createCollection('users');
db.createCollection('bookings');
db.createCollection('payments');
db.createCollection('wishlist');
db.createCollection('conversations');
db.createCollection('messages');

print('✅ FindoTrip database initialized successfully');
