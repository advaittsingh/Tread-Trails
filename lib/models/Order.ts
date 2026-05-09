import mongoose, { Schema, type InferSchemaType, models, model } from "mongoose";

const orderItemSchema = new Schema(
  {
    productSlug: { type: String, required: true },
    variantId: { type: String, required: true },
    variantLabel: { type: String, required: true },
    name: { type: String, required: true },
    image: { type: String, default: "" },
    quantity: { type: Number, required: true, min: 1 },
    unitPrice: { type: Number },
  },
  { _id: false }
);

const addressSchema = new Schema(
  {
    line1: { type: String, required: true },
    line2: { type: String, default: "" },
    city: { type: String, required: true },
    region: { type: String, required: true },
    postal: { type: String, required: true },
  },
  { _id: false }
);

const orderSchema = new Schema(
  {
    userId: { type: Schema.Types.ObjectId, ref: "User", index: true },
    guestEmail: { type: String, lowercase: true, trim: true },
    customerName: { type: String, required: true, trim: true },
    customerPhone: { type: String, required: true, trim: true },
    customerEmail: { type: String, required: true, lowercase: true, trim: true },
    shippingAddress: { type: addressSchema, required: true },
    items: { type: [orderItemSchema], required: true },
    total: { type: Number, required: true, min: 0 },
    currency: { type: String, default: "INR" },
    status: {
      type: String,
      enum: ["pending", "paid", "shipped", "cancelled"],
      default: "pending",
      index: true,
    },
    paymentMethod: { type: String, default: "stripe" },
    stripeCheckoutSessionId: { type: String, index: true },
    stripePaymentIntentId: { type: String },
  },
  { timestamps: true }
);

export type OrderDoc = InferSchemaType<typeof orderSchema> & {
  _id: mongoose.Types.ObjectId;
};

export const Order = models.Order ?? model("Order", orderSchema);
