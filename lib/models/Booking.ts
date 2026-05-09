import mongoose, { Schema, type InferSchemaType, models, model } from "mongoose";

const bookingSchema = new Schema(
  {
    userId: { type: Schema.Types.ObjectId, ref: "User", index: true },
    vehicleSlug: { type: String, required: true },
    vehicleName: { type: String, required: true },
    service: { type: String, required: true },
    date: { type: String, required: true },
    time: { type: String, required: true },
    contactName: { type: String, required: true, trim: true },
    contactEmail: { type: String, required: true, lowercase: true, trim: true },
    contactPhone: { type: String, required: true, trim: true },
    status: {
      type: String,
      enum: ["requested", "confirmed", "cancelled"],
      default: "requested",
      index: true,
    },
  },
  { timestamps: true }
);

export type BookingDoc = InferSchemaType<typeof bookingSchema> & {
  _id: mongoose.Types.ObjectId;
};

export const Booking = models.Booking ?? model("Booking", bookingSchema);
