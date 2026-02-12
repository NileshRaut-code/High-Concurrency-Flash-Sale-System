import mongoose from "mongoose";

const OrderSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true
    },

    productId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Product",
      required: true
    },

    quantity: {
      type: Number,
      required: true,
      min: 1
    },

    amount: {
      type: Number,
      required: true,
      min: 0
    },

    status: {
      type: String,
      enum: ["pending_payment", "paid", "cancelled", "failed"],
      default: "pending_payment",
      index: true
    },

    razorpayOrderId: {
      type: String,
      index: true
    },

    paymentId: {
      type: String,
      index: true
    }
  },
  { timestamps: true }
);

export const Order = mongoose.model("Order", OrderSchema);
