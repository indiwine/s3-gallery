-- CreateEnum
CREATE TYPE "S3Status" AS ENUM ('PENDING', 'UPLOADED', 'FAILED');

-- CreateEnum
CREATE TYPE "ImageSize" AS ENUM ('THUMBNAIL', 'SMALL', 'MEDIUM', 'LARGE', 'ORIGINAL');

-- CreateTable
CREATE TABLE "File" (
    "id" UUID NOT NULL,
    "path" TEXT NOT NULL,
    "width" INTEGER NOT NULL,
    "height" INTEGER NOT NULL,
    "status" "S3Status" NOT NULL DEFAULT 'PENDING',
    "fileSize" INTEGER NOT NULL,
    "mimeType" TEXT NOT NULL,
    "imageSize" "ImageSize" NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "photoId" UUID NOT NULL,

    CONSTRAINT "File_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Photo" (
    "id" UUID NOT NULL,
    "name" TEXT NOT NULL,
    "path" TEXT NOT NULL,
    "width" INTEGER NOT NULL,
    "height" INTEGER NOT NULL,
    "userId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "deletedAt" TIMESTAMP(3),
    "deleted" BOOLEAN NOT NULL DEFAULT false,
    "dateTaken" TIMESTAMP(3),
    "exifData" JSONB,
    "status" "S3Status" NOT NULL DEFAULT 'PENDING',
    "mimeType" TEXT NOT NULL,

    CONSTRAINT "Photo_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "File_id_photoId_imageSize_createdAt_updatedAt_idx" ON "File"("id", "photoId", "imageSize", "createdAt", "updatedAt");

-- CreateIndex
CREATE INDEX "Photo_name_path_createdAt_deletedAt_deleted_updatedAt_statu_idx" ON "Photo"("name", "path", "createdAt", "deletedAt", "deleted", "updatedAt", "status");

-- AddForeignKey
ALTER TABLE "File" ADD CONSTRAINT "File_photoId_fkey" FOREIGN KEY ("photoId") REFERENCES "Photo"("id") ON DELETE CASCADE ON UPDATE CASCADE;
