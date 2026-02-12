import mongoose from "mongoose";

const schema = new mongoose.Schema(
  {
    items: [
      {
        productId: mongoose.Schema.Types.ObjectId,
        quantity: Number,
        tokens: [String]
      }
    ],
    status: {
      type: String,
      enum: ["RESERVED", "PAID", "CANCELLED"],
      default: "RESERVED"
    },
    cartId:{
      type: mongoose.Schema.Types.ObjectId,
      required: true
    }
  },
  { timestamps: true }
);

export const Order = mongoose.model("Order", schema);
