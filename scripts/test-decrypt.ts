import * as dotenv from 'dotenv';
dotenv.config();

import * as fs from 'fs';
import * as path from 'path';
import { decrypt } from './utils/encryption';

async function main() {
  const backupSecret = process.env.BACKUP_SECRET;

  if (!backupSecret) {
    console.error('❌ BACKUP_SECRET is not set in environment variables');
    process.exit(1);
  }

  // Find latest backup if no arguments provided
  let fileNameToDecrypt = process.argv[2];
  
  const backupsDir = path.join(process.cwd(), 'backups');

  if (!fileNameToDecrypt) {
    console.log('No file specified. Attempting to find latest backup...');
    const latestPath = path.join(backupsDir, 'latest-backup.json.enc');
    
    if (fs.existsSync(latestPath)) {
      fileNameToDecrypt = 'latest-backup.json.enc';
    } else {
      console.error('❌ Please specify a filename to decrypt (e.g. "latest-backup.json.enc" or "backup-2026-03-26.json.enc")');
      console.error('Usage: npx tsx scripts/test-decrypt.ts <filename>');
      process.exit(1);
    }
  }

  const filePath = path.join(backupsDir, fileNameToDecrypt);

  if (!fs.existsSync(filePath)) {
    console.error(`❌ File not found: ${filePath}`);
    process.exit(1);
  }

  console.log(`🔓 Starting decryption of: ${fileNameToDecrypt}...`);

  try {
    const encryptedData = fs.readFileSync(filePath, 'utf-8');
    const decryptedData = decrypt(encryptedData, backupSecret);
    const parsedData = JSON.parse(decryptedData);

    console.log('✨ Decryption totally successful! 🐵');
    console.log(`Backup Timestamp: ${parsedData.timestamp}`);
    console.log(`Records Summary:`);
    console.log(` - Users: ${parsedData.payload.user?.length || 0}`);
    console.log(` - Households: ${parsedData.payload.household?.length || 0}`);
    console.log(` - Notes: ${parsedData.payload.note?.length || 0}`);
    console.log(` - Accounts: ${parsedData.payload.account?.length || 0}`);
    
    // Optionally create a decrypted output file for manual inspection
    const outputFileName = fileNameToDecrypt.replace('.enc', '');
    const outputPath = path.join(backupsDir, `decrypted-${outputFileName}`);
    fs.writeFileSync(outputPath, JSON.stringify(parsedData, null, 2));
    
    console.log(`\n📄 A readable JSON copy was temporarily saved to: ${outputPath}`);
    console.log('⚠️  Please remember to delete this plain JSON file after verifying its contents!');

  } catch (error) {
    console.error('❌ Decryption failed:', error);
    process.exit(1);
  }
}

main();
