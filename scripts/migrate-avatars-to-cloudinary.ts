#!/usr/bin/env tsx
import { PrismaClient } from '@prisma/client';
import { v2 as cloudinary } from 'cloudinary';
import fs from 'fs';
import path from 'path';

const prisma = new PrismaClient();

async function main() {
  const cloudName = process.env.CLOUDINARY_CLOUD_NAME;
  const apiKey = process.env.CLOUDINARY_API_KEY;
  const apiSecret = process.env.CLOUDINARY_API_SECRET;
  if (!cloudName || !apiKey || !apiSecret) {
    console.error('Missing Cloudinary env vars. Set CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY, CLOUDINARY_API_SECRET');
    process.exit(1);
  }
  cloudinary.config({ cloud_name: cloudName, api_key: apiKey, api_secret: apiSecret });

  const users = await prisma.user.findMany({ select: { id: true, avatar: true } });
  const localPrefix = '/uploads/';
  const publicDir = path.join(process.cwd(), 'public');
  let migrated = 0;

  for (const user of users) {
    const avatar = user.avatar;
    if (!avatar || !avatar.startsWith(localPrefix)) continue;
    const localPath = path.join(publicDir, avatar.replace(/^\//, ''));
    if (!fs.existsSync(localPath)) {
      console.warn(`File not found for user ${user.id}: ${localPath}`);
      continue;
    }
    try {
      const uploadRes = await cloudinary.uploader.upload(localPath, { folder: 'findo', overwrite: true, use_filename: true, unique_filename: false });
      await prisma.user.update({ where: { id: user.id }, data: { avatar: uploadRes.secure_url } });
      migrated++;
      console.log(`Migrated avatar for user ${user.id}`);
    } catch (err) {
      console.error(`Failed to migrate user ${user.id}:`, err);
    }
  }

  console.log(`Done. Migrated ${migrated} avatars.`);
}

main().then(() => prisma.$disconnect());

