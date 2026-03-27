import * as dotenv from 'dotenv';
dotenv.config();

import { PrismaClient } from '@prisma/client';
import * as fs from 'fs';
import * as path from 'path';
import { encrypt } from './utils/encryption';
import { uploadFile } from './utils/gcs';

async function main() {
  const connectionString = process.env.DATABASE_URL;
  const backupSecret = process.env.BACKUP_SECRET;

  if (!connectionString) {
    console.error('❌ DATABASE_URL is not set in environment variables');
    process.exit(1);
  }

  if (!backupSecret) {
    console.error('❌ BACKUP_SECRET is not set in environment variables');
    process.exit(1);
  }
  
  const prisma = new PrismaClient();

  console.log('🚀 Starting Monkey Mori Encrypted Cloud Backup...');

  try {
    const data = {
      timestamp: new Date().toISOString(),
      payload: {
        account: await prisma.account.findMany(),
        session: await prisma.session.findMany(),
        user: await prisma.user.findMany(),
        verificationToken: await prisma.verificationToken.findMany(),
        household: await prisma.household.findMany(),
        note: await prisma.note.findMany(),
      }
    };

    const jsonString = JSON.stringify(data, null, 2);
    const encryptedData = encrypt(jsonString, backupSecret);
    
    // Create backup filename
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const fileName = `backup-${timestamp}.json.enc`;
    const backupsDir = path.join(process.cwd(), 'backups');

    if (!fs.existsSync(backupsDir)) {
      fs.mkdirSync(backupsDir);
    }

    const filePath = path.join(backupsDir, fileName);
    fs.writeFileSync(filePath, encryptedData);
    console.log(`🔒 Local encrypted backup saved: ${filePath}`);

    // Upload to GCS
    await uploadFile(filePath);

    // Update 'latest' pointer
    const latestFileName = 'latest-backup.json.enc';
    const latestPath = path.join(backupsDir, latestFileName);
    fs.writeFileSync(latestPath, encryptedData);
    await uploadFile(latestPath);

    console.log('✨ Backup process completed successfully!');
  } catch (error) {
    console.error('❌ Backup failed:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

main();
