import { Storage } from '@google-cloud/storage';
import path from 'path';

/**
 * Returns a configured Google Cloud Storage client.
 * Ensures environment variables are loaded when called.
 */
function getStorage() {
  const projectId = process.env.GCS_PROJECT_ID;
  const clientEmail = process.env.GCS_CLIENT_EMAIL;
  // Handle escaped newlines properly from environment variables
  const privateKey = process.env.GCS_PRIVATE_KEY?.replace(/\\n/g, '\n');

  if (!projectId || !clientEmail || !privateKey) {
    throw new Error('GCS credentials are not fully configured in environment variables');
  }

  return new Storage({
    projectId,
    credentials: {
      client_email: clientEmail,
      private_key: privateKey,
    },
  });
}

export async function uploadFile(filePath: string) {
  const bucketName = process.env.GCS_BUCKET_NAME;
  if (!bucketName) {
    throw new Error('GCS_BUCKET_NAME is not defined or is missing in environment variables');
  }

  const storage = getStorage();
  const bucket = storage.bucket(bucketName);
  const fileName = path.basename(filePath);
  
  console.log(`📡 Uploading ${fileName} to GCS...`);
  
  await bucket.upload(filePath, {
    destination: fileName,
  });
  
  console.log(`✅ File ${fileName} successfully uploaded to GCS bucket: ${bucketName}`);
}
