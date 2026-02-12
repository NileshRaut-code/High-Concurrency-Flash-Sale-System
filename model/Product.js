import mongoose from "mongoose";

const schema = new mongoose.Schema({
  name: String,
  price: Number
});

export const Product = mongoose.model("Product", schema);
