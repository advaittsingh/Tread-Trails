import multer from "multer";

export type UploadedFile = {
  buffer: Buffer;
  originalname: string;
  mimetype: string;
};

export const adminUpload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 12 * 1024 * 1024 },
});

export function multerFileToWebFile(file: UploadedFile): File {
  const bytes = new Uint8Array(file.buffer);
  const blob = new Blob([bytes], { type: file.mimetype });
  return new File([blob], file.originalname, { type: file.mimetype });
}
