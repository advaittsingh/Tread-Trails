import mongoose, { Schema, type InferSchemaType, models, model } from "mongoose";

const pageHitSchema = new Schema(
  {
    sessionId: { type: String, required: true, index: true },
    path: { type: String, required: true },
  },
  { timestamps: { createdAt: true, updatedAt: false } }
);

pageHitSchema.index({ createdAt: -1 });

export type PageHitDoc = InferSchemaType<typeof pageHitSchema> & {
  _id: mongoose.Types.ObjectId;
};

export const PageHit = models.PageHit ?? model("PageHit", pageHitSchema);
