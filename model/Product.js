import mongoose from "mongoose";

const ProductSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
      index: true
    },

    price: {
      type: Number,
      required: true,
      min: 0
    },

    totalStock: {
      type: Number,
      required: true,
      min: 0,
      default: 0
    },

    isFlashSale: {
      type: Boolean,
      default: false
    }
  },
  { timestamps: true }
);

export const Product = mongoose.model("Product", ProductSchema);
