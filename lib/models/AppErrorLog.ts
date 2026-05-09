import mongoose, { Schema, type InferSchemaType, models, model } from "mongoose";

/** Lightweight ring buffer–style error capture for admin monitoring */
const appErrorLogSchema = new Schema(
  {
    source: { type: String, required: true },
    message: { type: String, required: true },
    detail: { type: String },
    meta: { type: Schema.Types.Mixed },
  },
  { timestamps: { createdAt: true, updatedAt: false } }
);

appErrorLogSchema.index({ createdAt: -1 });

export type AppErrorLogDoc = InferSchemaType<typeof appErrorLogSchema> & {
  _id: mongoose.Types.ObjectId;
};

export const AppErrorLog =
  models.AppErrorLog ?? model("AppErrorLog", appErrorLogSchema);
