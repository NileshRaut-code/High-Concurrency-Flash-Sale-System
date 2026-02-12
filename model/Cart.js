import mongoose from "mongoose";

const schema = new mongoose.Schema({
  items: [
    {
      productId: mongoose.Schema.Types.ObjectId,
      quantity: Number
    }
  ]
});

export const Cart = mongoose.model("Cart", schema);
