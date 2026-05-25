import { PutObjectCommand, GetObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { s3Client, BUCKET_NAME } from '../config/s3';
import fs from 'fs';
import path from 'path';

// Local storage fallback paths
const UPLOADS_DIR = path.join(__dirname, '../../uploads');
if (!fs.existsSync(UPLOADS_DIR)) {
  fs.mkdirSync(UPLOADS_DIR, { recursive: true });
}

const isS3Configured = (): boolean => {
  return (
    process.env.AWS_ACCESS_KEY_ID !== undefined &&
    process.env.AWS_ACCESS_KEY_ID !== '' &&
    process.env.AWS_SECRET_ACCESS_KEY !== undefined &&
    process.env.AWS_SECRET_ACCESS_KEY !== '' &&
    process.env.AWS_S3_BUCKET !== undefined &&
    process.env.AWS_S3_BUCKET !== ''
  );
};

/**
 * Uploads a file to S3 (or saves locally if S3 is not configured)
 * Returns the URL/path of the saved file
 */
export const uploadFile = async (
  fileBuffer: Buffer,
  fileName: string,
  mimeType: string
): Promise<string> => {
  const uniqueName = `${Date.now()}-${fileName}`;

  if (isS3Configured()) {
    try {
      const command = new PutObjectCommand({
        Bucket: BUCKET_NAME,
        Key: uniqueName,
        Body: fileBuffer,
        ContentType: mimeType
      });
      await s3Client.send(command);
      return `https://${BUCKET_NAME}.s3.${process.env.AWS_REGION || 'us-east-1'}.amazonaws.com/${uniqueName}`;
    } catch (error) {
      console.warn('S3 upload failed, falling back to local storage:', error);
    }
  }

  // Fallback to local storage
  const localPath = path.join(UPLOADS_DIR, uniqueName);
  await fs.promises.writeFile(localPath, fileBuffer);
  // Return a relative route that our backend can serve
  return `/uploads/${uniqueName}`;
};

/**
 * Downloads/reads a file from S3 or local storage into a Buffer
 */
export const getFileBuffer = async (fileUrl: string): Promise<Buffer> => {
  // If it's a local fallback file
  if (fileUrl.startsWith('/uploads/')) {
    const fileName = fileUrl.replace('/uploads/', '');
    const localPath = path.join(UPLOADS_DIR, fileName);
    return await fs.promises.readFile(localPath);
  }

  // If S3 is configured and it looks like an S3 URL
  if (isS3Configured() && fileUrl.includes('amazonaws.com')) {
    try {
      // Extract Key from URL
      const urlParts = fileUrl.split('/');
      const key = urlParts[urlParts.length - 1];

      const command = new GetObjectCommand({
        Bucket: BUCKET_NAME,
        Key: key
      });
      const response = await s3Client.send(command);
      
      if (!response.Body) {
        throw new Error('S3 body is empty');
      }

      // Convert stream to buffer
      const streamToBuffer = (stream: any): Promise<Buffer> =>
        new Promise((resolve, reject) => {
          const chunks: any[] = [];
          stream.on('data', (chunk: any) => chunks.push(chunk));
          stream.on('error', reject);
          stream.on('end', () => resolve(Buffer.concat(chunks)));
        });

      return await streamToBuffer(response.Body);
    } catch (error) {
      console.error('Failed to read from S3:', error);
      throw error;
    }
  }

  // Otherwise, assume it might be a direct local file path
  if (fs.existsSync(fileUrl)) {
    return await fs.promises.readFile(fileUrl);
  }

  throw new Error(`Invalid file URL or file not found: ${fileUrl}`);
};

/**
 * Generates a presigned URL for a given permanent S3 URL.
 * Returns the presigned URL with a short expiration (15 minutes).
 */
export const getPresignedUrl = async (fileUrl: string | undefined): Promise<string | undefined> => {
  if (!fileUrl) return undefined;

  // If local fallback file, return as is
  if (fileUrl.startsWith('/uploads/')) {
    return fileUrl;
  }

  // Generate signed URL if S3 is configured and URL is an S3 URL
  if (isS3Configured() && fileUrl.includes('amazonaws.com')) {
    try {
      const urlParts = fileUrl.split('/');
      const key = urlParts[urlParts.length - 1];

      const command = new GetObjectCommand({
        Bucket: BUCKET_NAME,
        Key: key
      });

      // Expires in 15 minutes (900 seconds)
      const signedUrl = await getSignedUrl(s3Client, command, { expiresIn: 900 });
      return signedUrl;
    } catch (error) {
      console.error('Failed to generate presigned S3 URL:', error);
      return fileUrl; // Fallback to permanent URL
    }
  }

  return fileUrl;
};
