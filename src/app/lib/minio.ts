import * as Minio from 'minio'

const globalForMinio = globalThis as unknown as {
  minio: Minio.Client | undefined
}

export const minioClient =
  globalForMinio.minio ??
  new Minio.Client({
    endPoint: process.env.MINIO_ENDPOINT || 'localhost',
    port: parseInt(process.env.MINIO_PORT || '9000'),
    useSSL: false,
    accessKey: process.env.MINIO_ACCESS_KEY || 'safa_minio',
    secretKey: process.env.MINIO_SECRET_KEY || 'safa_minio_pass',
  })

if (process.env.NODE_ENV !== 'production') {
  globalForMinio.minio = minioClient
}

export const BUCKET_NAME = process.env.MINIO_BUCKET || 'inspection-photos'

// Call this once at app startup to make sure the bucket exists
export async function ensureBucketExists() {
  const exists = await minioClient.bucketExists(BUCKET_NAME)
  if (!exists) {
    await minioClient.makeBucket(BUCKET_NAME, 'us-east-1')
    console.log(`✅ MinIO bucket "${BUCKET_NAME}" created`)
  } else {
    console.log(`✅ MinIO bucket "${BUCKET_NAME}" already exists`)
  }
}