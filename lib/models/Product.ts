import mongoose, { Schema, type InferSchemaType, models, model } from "mongoose";

const variantSchema = new Schema(
  {
    id: { type: String, required: true },
    label: { type: String, required: true },
    priceModifier: { type: Number },
  },
  { _id: false }
);

const specSchema = new Schema(
  {
    label: { type: String, required: true },
    value: { type: String, required: true },
  },
  { _id: false }
);

const productSchema = new Schema(
  {
    legacyId: { type: String, index: true },
    slug: { type: String, required: true, unique: true, index: true },
    name: { type: String, required: true },
    brand: { type: String, required: true },
    category: { type: String, required: true },
    price: { type: Number },
    currency: { type: String, default: "INR" },
    images: [{ type: String }],
    description: { type: String, default: "" },
    specs: [specSchema],
    variants: [variantSchema],
    compatibleCars: [{ type: String }],
  },
  { timestamps: true }
);

export type ProductDoc = InferSchemaType<typeof productSchema> & {
  _id: mongoose.Types.ObjectId;
};

export const Product = models.Product ?? model("Product", productSchema);
