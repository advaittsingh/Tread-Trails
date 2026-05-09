import mongoose, { Schema, type InferSchemaType, models, model } from "mongoose";

const presenceSessionSchema = new Schema(
  {
    sessionId: { type: String, required: true, unique: true },
    path: { type: String, default: "/" },
    userAgent: { type: String, default: "" },
    ipHash: { type: String, default: "", index: true },
    city: { type: String },
    country: { type: String },
    lat: { type: Number },
    lng: { type: Number },
    geoResolved: { type: Boolean, default: false },
    lastSeenAt: { type: Date, default: Date.now },
  },
  { timestamps: false }
);

presenceSessionSchema.index({ lastSeenAt: 1 }, { expireAfterSeconds: 180 });

export type PresenceSessionDoc = InferSchemaType<typeof presenceSessionSchema> & {
  _id: mongoose.Types.ObjectId;
};

export const PresenceSession =
  models.PresenceSession ?? model("PresenceSession", presenceSessionSchema);
