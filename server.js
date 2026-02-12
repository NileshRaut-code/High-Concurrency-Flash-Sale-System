import express from "express";
import { redis, subscriber } from "./redis.js";
import  {ConnectDb} from "./Mongodb.js";
import { RESERVE_STOCK_LUA, REVOKE_STOCK_LUA } from "./reservation.lua.js";
import { Product } from "./model/Product.js";
import { Cart } from "./model/Cart.js";
import { Order } from "./model/Order.js";
import cron from "node-cron"
const app = express();
app.use(express.json());


app.post("/product", async (req, res) => {
  res.json(await Product.create(req.body));
});

app.get("/token", async (req, res) => {
  try {
    const stockStatus = {};

    // Get all stock-related keys
    const keys = await redis.keys("stock:*");

    for (const key of keys) {
      // Skip sequence counters
      if (key.startsWith("stock:seq:")) continue;

      const productId = key.replace("stock:", "");

      // This key is guaranteed to be a LIST now
      const tokens = await redis.lrange(key, 0, -1);

      stockStatus[productId] = {
        availableCount: tokens.length,
        availableTokens: tokens
      };
    }

    // Active reservations
    const reservationKeys = await redis.keys("reservation:*:data");
    const reservations = {};

    for (const key of reservationKeys) {
      const orderId = key.split(":")[1];
      const data = await redis.get(key);
      if (!data) continue;

      reservations[orderId] = JSON.parse(data);
    }

    res.json({
      stock: stockStatus,
      activeReservations: reservations
    });
  } catch (err) {
    console.error("Token status error:", err);
    res.status(500).json({ message: "Failed to fetch token status" });
  }
});



app.post("/product/seed", async (req, res) => {
  console.log(req.body);
  
  const { productId, quantity } = req.body;

  const tokens = [];
  for (let i = 0; i < quantity; i++) {
    const seq = await redis.incr(`stock:seq:${productId}`);
    tokens.push(`${productId}-${seq}`);
  }

  await redis.rpush(`stock:${productId}`, ...tokens);
  res.json({ message: "Stock seeded", tokens });
});


app.post("/cart", async (_, res) => {
  res.json(await Cart.create({ items: [] }));
});

app.post("/cart/add", async (req, res) => {
  const { cartId, productId, quantity } = req.body;
  const cart = await Cart.findById(cartId);
  cart.items.push({ productId, quantity });
  await cart.save();
  res.json(cart);
});


app.post("/checkout", async (req, res) => {
  const { cartId } = req.body;
  const cart = await Cart.findById(cartId);
  const reservationKey = `reservation:${cartId}`;
  const args = [reservationKey, 60];
  cart.items.forEach(i =>
    args.push(i.productId.toString(), i.quantity)
  );
  const result = await redis.eval(RESERVE_STOCK_LUA, 0, ...args);
  if (!result) {
    return res.status(409).json({ message: "Out of stock" });
  }
  const parsed = JSON.parse(result);

  const order = await Order.create({
    cartId: cart._id,
    items: cart.items.map(i => ({
      productId: i.productId,
      quantity: i.quantity,
      tokens: parsed[i.productId]
    }))
  });

  res.json({ orderId: order._id, expiresIn: 60 });
});


app.post("/payment/success", async (req, res) => {
  const order = await Order.findById(req.body.orderId);
  order.status = "PAID";
  await order.save();
  await redis.del(`reservation:${order.cartId}`);
  await redis.del(`reservation:${order.cartId}:data`);

  res.json({ message: "Payment success" });
});

app.post("/payment/fail", async (req, res) => {
  const order = await Order.findById(req.body.orderId);
  const data = await redis.get(`reservation:${order.cartId}:data`);
  if (data) {
    await redis.eval(REVOKE_STOCK_LUA, 0, data);
    await redis.del(`reservation:${order.cartId}:data`);
  }
  await redis.del(`reservation:${order.cartId}`);
  order.status = "CANCELLED";
  await order.save();

  res.json({ message: "Payment failed, stock returned" });
});


subscriber.subscribe("__keyevent@0__:expired");
subscriber.on("message", async (_, key) => {
  if (!key.startsWith("reservation:")) return;
  console.log("send backed");
  
  const orderId = key.split(":")[1];
  const dataKey = `reservation:${orderId}:data`;

  const data = await redis.get(dataKey);
  if (!data) return;

  await redis.eval(REVOKE_STOCK_LUA, 0, data);
  await redis.del(dataKey);

  console.log("Expiry cleanup:", orderId);
});
function startCleanupCron() {

  cron.schedule("0 * * * *", async () => {
    console.log("started");
    
    const keys = await redis.keys("reservation:*:data");

    for (const key of keys) {
      const orderId = key.split(":")[1];
      const active = await redis.exists(`reservation:${orderId}`);
      if (active) continue;
      const data = await redis.get(key);
      if (!data) continue;
      await redis.eval(REVOKE_STOCK_LUA, 0, data);
      await redis.del(key);
      console.log("Cron cleanup:", orderId);
    }
  });
}


async function start() {
  await ConnectDb();
  startCleanupCron();
  app.listen(8000, () => console.log("Server running on 8000"));
}

start();
