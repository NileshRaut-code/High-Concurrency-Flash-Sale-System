import mongoose from "mongoose";

const CartSchema = new mongoose.Schema(
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
      required: true,
      index: true
    },

    quantity: {
      type: Number,
      required: true,
      min: 1
    },

    redisReservationKey: {
      type: String,
      required: true,
      index: true
    },

    reservedToken: {
      type: String,
      required: true
    },

    status: {
      type: String,
      enum: ["active", "expired", "checkout"],
      default: "active",
      index: true
    },

    expireAt: {
      type: Date,
      required: true,
      index: { expires: 0 } 
    }
  },
  { timestamps: true }
);

/* Prevent duplicate active cart items per user & product */
CartSchema.index(
  { userId: 1, productId: 1, status: 1 },
  { unique: true, partialFilterExpression: { status: "active" } }
);

export const Cart = mongoose.model("Cart", CartSchema);
