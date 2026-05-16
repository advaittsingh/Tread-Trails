import { z } from "zod";

import { MEDIA_FOLDERS } from "@/lib/media/constants";

export const mediaAssetPatchSchema = z.object({
  folder: z.enum(MEDIA_FOLDERS).optional(),
  tags: z
    .array(z.string().regex(/^[a-z0-9-]{1,40}$/))
    .max(20)
    .optional(),
  altText: z.string().max(500).nullable().optional(),
});
