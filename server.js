import express from "express";
import cron from "node-cron";
import { randomUUID } from "crypto";
import { ConnectDb } from "./Mongodb.js";
import { redis } from "./redis.js";
import { RESERVE_LUA, ROLLBACK_LUA } from "./reservation.lua.js";
import { Order } from "./model/Order.js";
import { Cart } from "./model/Cart.js";

const app = express();
app.use(express.json());

app.post("/seed/product", async (req, res) => {
  const { productId, quantity } = req.body;

  if (!productId || !quantity || quantity <= 0) {
    return res.status(400).json({ message: "Invalid input" });
  }

  const existing = await redis.llen(`stock:${productId}`);
  if (existing > 0) {
    return res.json({ message: "Already seeded" });
  }

  for (let i = 0; i < quantity; i++) {
    await redis.rpush(`stock:${productId}`, randomUUID());
  }

  res.json({ message: "Stock seeded", quantity });
});

app.post("/cart/add", async (req, res) => {
  const { userId, productId, quantity } = req.body;

  if (!userId || !productId || !quantity || quantity <= 0) {
    return res.status(400).json({ message: "Invalid input" });
  }

  const token = await redis.eval(
    RESERVE_LUA,
    1,
    `stock:${productId}`,
    quantity
  );

  if (!token) {
    return res.status(409).json({ message: "Out of stock" });
  }

  const reservationKey = `reserve:${userId}:${productId}`;
  const ttlSeconds = 300;

  await redis.set(reservationKey, token, "EX", ttlSeconds);

  const cart = await Cart.create({
    userId,
    productId,
    quantity,
    redisReservationKey: reservationKey,
    reservedToken: token,
    status: "active",
    expireAt: new Date(Date.now() + ttlSeconds * 1000)
  });

  res.json({
    message: "Added to cart",
    cartId: cart._id,
    expiresIn: ttlSeconds
  });
});

app.post("/order/create", async (req, res) => {
  const { cartId } = req.body;

  if (!cartId) {
    return res.status(400).json({ message: "Invalid input" });
  }

  const cart = await Cart.findOneAndUpdate(
    { _id: cartId, status: "active" },
    { status: "checkout" },
    { new: true }
  );

  if (!cart) {
    return res.status(400).json({ message: "Cart is not active" });
  }

  const reservation = await redis.get(cart.redisReservationKey);
  if (!reservation || reservation !== cart.reservedToken) {
    cart.status = "expired";
    await cart.save();
    return res.status(409).json({ message: "Reservation expired" });
  }

  const order = await Order.create({
    userId: cart.userId,
    productId: cart.productId,
    cartId: cart._id,
    quantity: cart.quantity,
    amount: cart.quantity * 100,
    status: "pending_payment",
    razorpayOrderId: null,
    paymentId: null
  });

  res.json({
    message: "Order created successfully",
    orderId: order._id
  });
});

app.post("/checkout/payment", async (req, res) => {
  const { cartId } = req.body;

  if (!cartId) {
    return res.status(400).json({ message: "Invalid input" });
  }

  const cart = await Cart.findById(cartId);
  if (!cart || cart.status !== "checkout") {
    return res.status(400).json({ message: "Invalid cart" });
  }

  res.json({ message: "Payment initiated" });
});

app.post("/payment/verify", async (req, res) => {
  const { orderId } = req.body;

  if (!orderId) {
    return res.status(400).json({ message: "Invalid input" });
  }

  const order = await Order.findById(orderId);
  if (!order) {
    return res.status(404).json({ message: "Order not found" });
  }

  if (order.status === "paid") {
    return res.json({ message: "Already processed" });
  }

  if (order.status !== "pending_payment") {
    return res.status(400).json({ message: "Invalid order state" });
  }

  order.status = "paid";
  await order.save();

  await redis.del(`reserve:${order.userId}:${order.productId}`);

  res.json({ message: "Payment successful" });
});

cron.schedule("*/1 * * * *", async () => {
  try {
    const now = new Date();

    const expiredCarts = await Cart.find({
      status: "active",
      expireAt: { $lte: now }
    });

    for (const cart of expiredCarts) {
      if (cart.status !== "active") continue;

      await redis.eval(
        ROLLBACK_LUA,
        1,
        `stock:${cart.productId}`,
        cart.quantity
      );

      await redis.del(cart.redisReservationKey);

      cart.status = "expired";
      await cart.save();
    }
  } catch (err) {
    console.error("Cron error:", err);
  }
});

async function start() {
  await ConnectDb();
  app.listen(8000, () => {
    console.log("started");
  });
}

start();
