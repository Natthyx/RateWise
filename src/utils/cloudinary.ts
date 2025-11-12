import dotenv from 'dotenv';

dotenv.config();

let cloudinary: any = null;
try {
  // Lazy require to avoid runtime error if dependency is not installed
  // eslint-disable-next-line @typescript-eslint/no-var-requires
  cloudinary = require('cloudinary').v2;
  if (process.env.CLOUDINARY_URL) {
    cloudinary.config({
      cloudinary_url: process.env.CLOUDINARY_URL,
    });
  } else if (process.env.CLOUDINARY_CLOUD_NAME && process.env.CLOUDINARY_API_KEY && process.env.CLOUDINARY_API_SECRET) {
    cloudinary.config({
      cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
      api_key: process.env.CLOUDINARY_API_KEY,
      api_secret: process.env.CLOUDINARY_API_SECRET,
    });
  }
} catch (_) {
  // Cloudinary is optional
}

export async function uploadToCloudinaryFromBuffer(buffer: Buffer, filename: string, folder = 'rately') {
  if (!cloudinary) throw new Error('Cloudinary SDK not available');
  return new Promise<string>((resolve, reject) => {
    const uploadStream = cloudinary.uploader.upload_stream(
      { folder, public_id: filename, resource_type: 'image' },
      (error: any, result: any) => {
        if (error) return reject(error);
        resolve(result.secure_url as string);
      }
    );
    uploadStream.end(buffer);
  });
}


