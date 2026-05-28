import { PutObjectCommand, GetObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { s3Client, BUCKET_NAME } from '../config/s3';

/**
 * Uploads a file to S3.
 * Returns the permanent S3 URL of the uploaded file.
 */
export const uploadFile = async (
  fileBuffer: Buffer,
  fileName: string,
  mimeType: string
): Promise<string> => {
  const uniqueName = `${Date.now()}-${fileName}`;

  const command = new PutObjectCommand({
    Bucket: BUCKET_NAME,
    Key: uniqueName,
    Body: fileBuffer,
    ContentType: mimeType
  });
  await s3Client.send(command);

  return `https://${BUCKET_NAME}.s3.${process.env.AWS_REGION || 'us-east-1'}.amazonaws.com/${uniqueName}`;
};

/**
 * Downloads a file from S3 into a Buffer.
 */
export const getFileBuffer = async (fileUrl: string): Promise<Buffer> => {
  // Extract Key from S3 URL
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
};

/**
 * Generates a presigned URL for a given S3 URL.
 * Returns the presigned URL with a 15-minute expiration.
 */
export const getPresignedUrl = async (fileUrl: string | undefined): Promise<string | undefined> => {
  if (!fileUrl) return undefined;

  const urlParts = fileUrl.split('/');
  const key = urlParts[urlParts.length - 1];

  const command = new GetObjectCommand({
    Bucket: BUCKET_NAME,
    Key: key
  });

  // Expires in 15 minutes (900 seconds)
  const signedUrl = await getSignedUrl(s3Client, command, { expiresIn: 900 });
  return signedUrl;
};
