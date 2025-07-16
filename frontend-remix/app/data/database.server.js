import { PrismaClient } from '@prisma/client';

/**
 * @type PrismaClient
 */
let prisma;

if (process.env.NODE_ENV === 'production') {
  prisma = new PrismaClient();
  prisma.$connect();
} else {
  if (!global.__db) {
    global.__db = new PrismaClient();
    global.__db.$connect();
  }
  prisma = global.__db;
}

export { prisma };
// import { PrismaClient } from "@prisma/client";

// let prisma;

// if (!global.prisma) {
//   global.prisma = new PrismaClient();
// }

// prisma = global.prisma;

// export { prisma };
