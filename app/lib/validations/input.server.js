

import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();
import { MongoClient, GridFSBucket } from 'mongodb';


console.log("DATABASE_URL:", process.env.DATABASE_URL);
export async function addData({ destination, checkIn, checkOut, adults, childs, rooms }) {
  try {
    // Insert a single document (not a transaction)
    const result = await prisma.$runCommandRaw({
      insert: "HotelBooking",
      documents: [
        {
          destination,
          checkIn,
          checkOut,
          adults: parseInt(adults),
          childs: parseInt(childs),
          rooms: parseInt(rooms),
          createdAt: new Date(),
        }
      ]
    });
    console.log("Booking Added:", result);
    return result;
  } catch (error) {
    console.error("Database Insertion Error:", error.message);
    throw error;
  }
}

//car code
export async function addCarRental({ pickupLocation, pickupDate, dropoffDate }) {
  try {
    const result = await prisma.$runCommandRaw({
      insert: "CarRental",
      documents: [
        {
          pickupLocation,
          pickupDate: new Date(pickupDate),
          dropoffDate: new Date(dropoffDate),
          createdAt: new Date(),
        }
      ]
    });
    console.log("Car Rental Added:", result);
    return result;
  } catch (error) {
    console.error("Database Insertion Error (CarRental):", error.message);
    throw error;
  }
}

// // Add Tour
export async function addTour({ location, tourDate }) {
  try {
    const result = await prisma.$runCommandRaw({
      insert: "Tours",
      documents: [
        {
          location,
          tourDate: new Date(tourDate),
          createdAt: new Date(),
        }
      ]
    });
    console.log("Tour Added:", result);
    return result;
  } catch (error) {
    console.error("Database Insertion Error (Tours):", error.message);
    throw error;
  }
}

// // Add Activity
export async function addActivity({ activity, activityDate }) {
  try {
    const result = await prisma.$runCommandRaw({
      insert: "Activities",
      documents: [
        {
          activity,
          activityDate: new Date(activityDate),
          createdAt: new Date(),
        }
      ]
    });
    console.log("Activity Added:", result);
    return result;
  } catch (error) {
    console.error("Database Insertion Error (Activities):", error.message);
    throw error;
  }
}


/// add registration page 
export async function addHotel({ hotelName, hotelEmail, hotelPhone, hotelWebsite, location, numRooms, category, facilities, images, mapUrl, cancellationPolicy, suitePrice, DeluxeDouble, DeluxeTwin }) {
  try {
    const result = await prisma.$runCommandRaw({
      insert: "Hotel",
      documents: [
        {
          hotelName,
          hotelEmail,
          hotelPhone,
          hotelWebsite,
          location,
          numRooms: parseInt(numRooms),
          category: parseInt(category),
          facilities,
          images,
          mapUrl,
          cancellationPolicy,
          suitePrice: parseFloat(suitePrice),
          DeluxeDouble: parseFloat(DeluxeDouble),
          DeluxeTwin: parseFloat(DeluxeTwin),
          createdAt: new Date(),
        }
      ]
    });
    console.log("Hotel Added:", result);
    return result;
  } catch (error) {
    console.error("Database Insertion Error:", error.message);
    throw error;
  }
}
// export async function addHotel({
//   hotelName,
//   hotelEmail,
//   hotelPhone,
//   hotelWebsite,
//   location,
//   numRooms,
//   category,
//   facilities,
//   images, // Ensure this contains GridFS file IDs
//   mapUrl,
//   cancellationPolicy,
//   suitePrice,
//   deluxeDouble,
//   deluxeTwin,
// }) {
//   try {
//     const result = await prisma.$runCommandRaw({
//       insert: "Hotel", // Collection name
//       documents: [
//         {
//           hotelName,
//           hotelEmail,
//           hotelPhone,
//           hotelWebsite,
//           location,
//           numRooms: parseInt(numRooms),
//           category: parseInt(category),
//           facilities,
//           images, // Store GridFS file IDs here
//           mapUrl,
//           cancellationPolicy,
//           suitePrice: parseFloat(suitePrice),
//           deluxeDouble: parseFloat(deluxeDouble), // Ensure this field is included
//           deluxeTwin: parseFloat(deluxeTwin),
//           createdAt: new Date(),
//         },
//       ],
//     });

//     console.log("Hotel Added:", result);
//     return result;
//   } catch (error) {
//     console.error("Database Insertion Error:", error.message);
//     throw error;
//   }
// }
export async function getHotelData() {
  try {
    const result = await prisma.$runCommandRaw({
      find: "HotelBooking",
      filter: {},
    });

    // Extract documents and format date fields as strings
    const hotelData = result.cursor.firstBatch.map((hotel) => ({
      ...hotel,
      checkIn: hotel.checkIn.toString(),
      checkOut: hotel.checkOut.toString(),
    }));

    return hotelData;
  } catch (error) {
    console.error("Database Retrieval Error:", error.message);
    throw error;
  }
}

//car data get 
export async function getCarData() {
  try {
    const result = await prisma.$runCommandRaw({
      find: "CarRental",
      filter: {},
    });

    const carData = result.cursor.firstBatch.map((cars) => ({
      ...cars,
      pickupDate: new Date(cars.pickupDate),    // Convert string to Date
      dropoffDate: new Date(cars.dropoffDate),  // Convert string to Date
    }));

    return carData;
  } catch (error) {
    console.error("Database Retrieval Error:", error.message);
    throw error;
  }
}

//tour data get 
export async function getCarData() {
  try {
    const result = await prisma.$runCommandRaw({
      find: "Tours",
      filter: {},
    });

    const TourData = result.cursor.firstBatch.map((Tours) => ({
      ...Tours,
      tourDate: new Date(Tours.tourDate),  // Convert string to Date
    }));

    return TourData;
  } catch (error) {
    console.error("Database Retrieval Error:", error.message);
    throw error;
  }
}

//get activities data
// Correct export in input.server.js

export async function getActivitiesData() {
  try {
    const result = await prisma.$runCommandRaw({
      find: "Activities",
      filter: {},
    });

    const ActivitiesData = result.cursor.firstBatch.map((Activities) => ({
      ...Activities,
      activityDate: new Date(Activities.activityDate),
    }));

    return ActivitiesData;
  } catch (error) {
    console.error("Database Retrieval Error:", error.message);
    throw error;
  }
}


//get registration data

//working code
export async function getHotel() {
  try {
    // Use $runCommandRaw to fetch data from MongoDB
    const result = await prisma.$runCommandRaw({
      find: "Hotel",
      filter: {}, 
    });

    // Extract documents and format the createdAt field as a string
    const hotelData = result.cursor.firstBatch.map((hotel) => ({
      ...hotel,
      numRooms: parseInt(hotel.numRooms, 10),
      category: parseInt(hotel.category, 10),
      suitePrice: parseFloat(hotel.suitePrice),
      DeluxeDouble: parseFloat(hotel.DeluxeDouble),
      DeluxeTwin: parseFloat(hotel.DeluxeTwin),
      createdAt: hotel.createdAt.toString(), // Ensure createdAt is a string
    }));

    return hotelData;
  } catch (error) {
    console.error("Database Retrieval Error:", error.message);
    throw error;
  }
}

// export async function getHotel() {
//   const client = new MongoClient(process.env.MONGODB_URI);
//   await client.connect();
//   const db = client.db('your-database-name');
//   const bucket = new GridFSBucket(db, { bucketName: 'images' });

//   try {
//     const result = await db.collection('Hotel').find({}).toArray();

//     const hotelData = await Promise.all(result.map(async (hotel) => {
//       const images = await Promise.all(hotel.images.map(async (imageId) => {
//         const chunks = [];
//         const downloadStream = bucket.openDownloadStream(imageId);
//         for await (const chunk of downloadStream) {
//           chunks.push(chunk);
//         }
//         return Buffer.concat(chunks).toString('base64');
//       }));

//       return {
//         ...hotel,
//         numRooms: parseInt(hotel.numRooms, 10),
//         category: parseInt(hotel.category, 10),
//         suitePrice: parseFloat(hotel.suitePrice),
//         DeluxeDouble: parseFloat(hotel.DeluxeDouble),
//         DeluxeTwin: parseFloat(hotel.DeluxeTwin),
//         createdAt: hotel.createdAt.toString(),
//         images: images.map(img => `data:image/png;base64,${img}`), // Convert to Base64 for frontend
//       };
//     }));

//     return hotelData;
//   } catch (error) {
//     console.error("Database Retrieval Error:", error.message);
//     throw error;
//   } finally {
//     await client.close();
//   }
// }

// import { MongoClient, GridFSBucket } from "mongodb";

// export async function getHotel() {
//   if (!process.env.MONGODB_URI) {
//     throw new Error("MONGODB_URI is not defined in environment variables.");
//   }

//   const client = new MongoClient(process.env.MONGODB_URI);
//   await client.connect();
//   const db = client.db("findoDB");
//   const bucket = new GridFSBucket(db, { bucketName: "images" });

//   try {
//     const result = await db.collection("Hotel").find({}).toArray();

//     const hotelData = await Promise.all(
//       result.map(async (hotel) => {
//         const images = await Promise.all(
//           hotel.images?.map(async (imageId) => {
//             try {
//               const chunks = [];
//               const downloadStream = bucket.openDownloadStream(imageId);
//               for await (const chunk of downloadStream) {
//                 chunks.push(chunk);
//               }
//               return Buffer.concat(chunks).toString("base64");
//             } catch (error) {
//               console.error("Error retrieving image:", error.message);
//               return null; // Return null if the image is not found
//             }
//           }) || []
//         );

//         return {
//           ...hotel,
//           numRooms: parseInt(hotel.numRooms, 10),
//           category: parseInt(hotel.category, 10),
//           suitePrice: parseFloat(hotel.suitePrice),
//           deluxeDouble: parseFloat(hotel.deluxeDouble),
//           deluxeTwin: parseFloat(hotel.deluxeTwin),
//           createdAt: hotel.createdAt.toString(),
//           images: images.filter((img) => img !== null).map((img) => `data:image/png;base64,${img}`), // Filter out null values
//         };
//       })
//     );

//     return hotelData;
//   } catch (error) {
//     console.error("Database Retrieval Error:", error.message);
//     throw error;
//   } finally {
//     await client.close();
//   }
// }