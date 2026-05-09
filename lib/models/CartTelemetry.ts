import mongoose, { Schema, type InferSchemaType, models, model } from "mongoose";

const cartTelemetrySchema = new Schema(
  {
    sessionId: { type: String, required: true, unique: true, index: true },
    lines: { type: Schema.Types.Mixed, default: [] },
    itemCount: { type: Number, default: 0 },
    subtotalHint: { type: Number, default: 0 },
    userEmail: { type: String, lowercase: true, trim: true },
    lastPath: { type: String, default: "" },
    updatedAt: { type: Date, default: Date.now },
  },
  { timestamps: false }
);

cartTelemetrySchema.index({ updatedAt: -1 });

export type CartTelemetryDoc = InferSchemaType<typeof cartTelemetrySchema> & {
  _id: mongoose.Types.ObjectId;
};

export const CartTelemetry =
  models.CartTelemetry ?? model("CartTelemetry", cartTelemetrySchema);
