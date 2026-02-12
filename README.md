# 🚀 High Flash Sale

A distributed e-commerce system designed for high-volume flash sales with real-time inventory management.

---

## 📋 Project Overview

This is a backend application that handles flash sales with:
- **Real-time inventory management** using Redis
- **User authentication** with JWT
- **Shopping cart** management
- **Order processing**
- **Atomic stock reservations** using Lua scripts (prevents overbooking)
- **Scheduled tasks** using cron jobs

---

## 🏗️ System Architecture

```
┌─────────────────────────────────────────────────────┐
│                    Client/API                        │
├─────────────────────────────────────────────────────┤
│                    Express Server                    │
│  (Routes: /seed, /cart, /order, /checkout, etc)     │
├─────────────────────────────────────────────────────┤
│                                                      │
│  ┌──────────────┐              ┌──────────────┐    │
│  │   Redis      │              │   MongoDB    │    │
│  │              │              │              │    │
│  │ • Stock List │              │ • Users      │    │
│  │ • Lua Scripts│              │ • Orders     │    │
│  │ • Caching    │              │ • Carts      │    │
│  │ • Sessions   │              │ • Products   │    │
│  └──────────────┘              └──────────────┘    │
│                                                      │
├─────────────────────────────────────────────────────┤
│            Scheduled Tasks (Node-Cron)              │
│            (Cleanup, Rollback jobs)                 │
└─────────────────────────────────────────────────────┘
```

---

## 📦 Project Structure

```
High Flash Sale/
├── server.js              # Main Express server
├── Mongodb.js             # Database connection
├── redis.js               # Redis connection & setup
├── reservation.lua.js     # Lua scripts for atomic operations
├── package.json           # Dependencies
├── model/
│   ├── User.js           # User schema
│   ├── Product.js        # Product schema
│   ├── Cart.js           # Shopping cart schema
│   └── Order.js          # Order schema
```

---

## 🛠️ Technologies Used

| Technology | Purpose |
|-----------|---------|
| **Express.js** | Web framework & API routing |
| **MongoDB** | Persistent data storage |
| **Redis** | Fast inventory management & caching |
| **Lua Scripts** | Atomic stock reservation/rollback |
| **JWT** | User authentication |
| **Bcrypt** | Password encryption |
| **Node-Cron** | Scheduled background tasks |

---

## 🚀 Key Features

### 1. **Stock Reservation System**
- Use Redis to manage real-time inventory
- Lua scripts ensure atomic operations (no double-booking)
- Prevents race conditions in high-traffic scenarios

### 2. **Shopping Cart**
- Users can add/remove items
- Real-time stock availability checks
- Persisted in MongoDB

### 3. **Order Management**
- Users can place orders from their cart
- Order history tracking
- Order status management

### 4. **User Authentication**
- Secure login/signup with bcrypt
- JWT token-based authentication
- Session management via Redis

---

## 📝 API Endpoints (Example)

```
POST   /seed/product          - Seed inventory
POST   /cart/add              - Add item to cart
POST   /order/create          - Create order from cart
POST   /checkout              - Process payment & checkout
GET    /product/:id           - Get product details
POST   /auth/login            - User login
POST   /auth/register         - User registration
```

---

## 🔧 Installation & Setup

```bash
# 1. Install dependencies
npm install

# 2. Ensure MongoDB is running
# MongoDB should be accessible

# 3. Ensure Redis is running
# Redis should be accessible on localhost:6379

# 4. Start the server
node server.js
```

---

## � Checkout Flow Diagram

```
                    ┌─────────────────────┐
                    │   Request Cart      │
                    │   Checkout          │
                    └──────────┬──────────┘
                               │
                               ▼
                    ┌─────────────────────┐
                    │  Check Stock        │
                    │  Available?         │
                    └──────────┬──────────┘
                               │
                 ┌─────────────┴──────────────┐
                 │                            │
               FALSE                        TRUE
                 │                            │
                 ▼                            ▼
          ┌────────────┐          ┌──────────────────┐
          │  Return    │          │  Create Order    │
          │  Error     │          │  in MongoDB      │
          │  (Out of   │          └────────┬─────────┘
          │  Stock)    │                   │
          └────────────┘                   ▼
                                 ┌──────────────────┐
                                 │  Order Created   │
                                 │  (Status: Active)│
                                 └────────┬─────────┘
                                          │
                                          ▼
                                 ┌──────────────────┐
                                 │  Remove Stock    │
                                 │  from Redis      │
                                 │  (Deduct Items)  │
                                 └────────┬─────────┘
                                          │
                                          ▼
                                 ┌──────────────────┐
                                 │  Clear Cart      │
                                 │  from Database   │
                                 └────────┬─────────┘
                                          │
                                          ▼
                                 ┌──────────────────┐
                                 │  Order Complete  │
                                 │  Send Success    │
                                 │  Response        │
                                 └──────────────────┘
```

---

## �📊 How Flash Sales Work

1. **Admin seeds inventory** → Product stock added to Redis
2. **Users browse products** → Check available stock
3. **Users add to cart** → Stock reserved atomically via Lua script
4. **Users checkout** → Order created in MongoDB
5. **Stock updated** → Inventory decremented
6. **Order confirmed** → User receives confirmation

---

## 🔐 Data Security

- ✅ Passwords hashed with bcrypt
- ✅ JWT tokens for API authentication
- ✅ Atomic Lua scripts prevent race conditions
- ✅ Input validation on all endpoints

---

## 📌 Notes

- This system is optimized for **high-concurrency scenarios**
- Redis Lua scripts ensure **no inventory overbooking**
- MongoDB stores persistent data
- Node-Cron handles cleanup/maintenance tasks

---

---

