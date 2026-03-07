import sharp from 'sharp';
import { PutObjectCommand, DeleteObjectCommand } from '@aws-sdk/client-s3';
import { s3 } from '../config/storage';
import { env } from '../config/env';

export const storageService = {
  async uploadImage(assetId: string, imageId: string, buffer: Buffer): Promise<{ s3Key: string; url: string }> {
    const compressed = await sharp(buffer)
      .resize(1920, 1920, { fit: 'inside', withoutEnlargement: true })
      .webp({ quality: 85 })
      .toBuffer();

    const s3Key = `assets/${assetId}/${imageId}.webp`;

    await s3.send(
      new PutObjectCommand({
        Bucket: env.S3_BUCKET,
        Key: s3Key,
        Body: compressed,
        ContentType: 'image/webp',
        ACL: 'public-read',
      }),
    );

    const url = `${env.S3_ENDPOINT}/${env.S3_BUCKET}/${s3Key}`;
    return { s3Key, url };
  },

  async uploadLogo(merchantId: string, buffer: Buffer): Promise<{ s3Key: string; url: string }> {
    const compressed = await sharp(buffer)
      .resize(512, 512, { fit: 'inside', withoutEnlargement: true })
      .webp({ quality: 85 })
      .toBuffer();

    const s3Key = `merchants/${merchantId}/logo.webp`;

    await s3.send(
      new PutObjectCommand({
        Bucket: env.S3_BUCKET,
        Key: s3Key,
        Body: compressed,
        ContentType: 'image/webp',
        ACL: 'public-read',
      }),
    );

    const url = `${env.S3_ENDPOINT}/${env.S3_BUCKET}/${s3Key}`;
    return { s3Key, url };
  },

  async deleteFile(s3Key: string): Promise<void> {
    await s3.send(
      new DeleteObjectCommand({
        Bucket: env.S3_BUCKET,
        Key: s3Key,
      }),
    );
  },
};
