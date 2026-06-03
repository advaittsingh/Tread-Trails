declare module "multer" {
  import type { RequestHandler } from "express";

  interface MulterInstance {
    single(field: string): RequestHandler;
  }

  interface MulterAPI {
    (options?: {
      storage?: unknown;
      limits?: { fileSize?: number };
    }): MulterInstance;
    memoryStorage(): unknown;
  }

  const multer: MulterAPI;
  export default multer;
}
