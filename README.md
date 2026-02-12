# 🚀 High-Concurrency Inventory & Order System

**Node.js · Express · Redis · MongoDB**

> **Diagram first. Code later.**
> This project shows how **real production systems** prevent overselling when many users buy at the same time.

---

## 🧭 System Flow (High Level)

```mermaid
flowchart LR
    Client --> API[Express API]
    API --> Redis[(Redis)]
    API --> Mongo[(MongoDB)]

    Redis -->|tokens| API
    API -->|orders| Mongo
```

---

## 🔑 Core Rule (Very Important)

```mermaid
flowchart TB
    Cart -->|NO inventory| Checkout
    Checkout -->|Atomic reserve| Redis
    Redis -->|Success| Order
    Redis -->|Fail| Reject
```

> **Inventory is touched ONLY at Checkout**

---

## 🧩 Main Entities

```mermaid
classDiagram
    User --> Cart
    Cart --> Product
    Cart --> Checkout
    Checkout --> Order
    Order --> Payment
    Redis --> Order
```

---

## 🧮 Inventory Model (Redis Tokens)

```mermaid
flowchart LR
    Stock["stock:productId (LIST)"] --> T1[productId-1]
    Stock --> T2[productId-2]
    Stock --> T3[productId-3]
```

* 1 token = 1 unit of stock
* Redis = **source of truth**

---

## 🔥 Checkout (Atomic & Safe)

```mermaid
sequenceDiagram
    participant Client
    participant API
    participant Redis
    participant Mongo

    Client->>API: POST /checkout
    API->>Redis: Lua (check + reserve tokens)
    alt Stock Available
        Redis-->>API: Tokens
        API->>Mongo: Create Order (RESERVED)
        API-->>Client: orderId
    else Out of Stock
        Redis-->>API: null
        API-->>Client: 409 Out of Stock
    end
```
![Check Out Output](image.png)
---

## 💳 Payment Flow

```mermaid
flowchart TB
    RESERVED -->|Payment Success| PAID
    RESERVED -->|Payment Fail| CANCELLED --> Revoke the Token
    RESERVED -->|TTL Expired| CANCELLED  --> Revoke the Token
```
![Payment Flow](image-1.png)
---

## ⏱️ Timeout & Token Revoke (Hybrid)

```mermaid
flowchart LR
    TTL[Redis TTL Expiry] --> Revoke
    Event[Expiry Event] --> Revoke
    Cron[Cron Cleanup] --> Revoke
    Startup[Startup Cleanup] --> Revoke

    Revoke --> RedisStock[Return Tokens to Redis]
```
![cron/Redis Clean Up](image-2.png)
> **TTL is truth, events are optimization, cron is safety**

---

## 🛒 Full User Flow (End-to-End)

```mermaid
sequenceDiagram
    participant User
    participant API
    participant Redis
    participant Mongo

    User->>API: Create Cart
    User->>API: Add Product to Cart
    User->>API: Checkout
    API->>Redis: Reserve Tokens (Lua)
    API->>Mongo: Create Order (RESERVED)

    alt Payment Success
        User->>API: /payment/success
        API->>Redis: Delete reservation
        API->>Mongo: Order = PAID
    else Payment Fail / Timeout
        Redis->>API: TTL Expired
        API->>Redis: Return Tokens
        API->>Mongo: Order = CANCELLED
    end
```

---

## 🧪 Debug / Observability

```mermaid
flowchart LR
    GET[/token endpoint/] --> Redis
    Redis --> StockStatus[Stock + Reservations]
```

---

## 🚫 What This System Avoids

```mermaid
flowchart TB
    BAD1[DB Stock Decrement]:::bad
    BAD2[Add-to-Cart Reservation]:::bad
    BAD3[Cron-only Cleanup]:::bad

    classDef bad fill:#ffdddd,stroke:#ff0000;
```
[High concurrency inventory system, Redis Lua atomic reservation, flash sale system design](https://nileshblog.tech/designing-a-high-concurrency-flash-sale-stock-inventory-reservation-system-with-node-js-redis-lua-and-mongodb/)
---

## 🏁 Final Mental Model

```mermaid
flowchart LR
    Redis -->|decides| Availability
    Mongo -->|records| Outcome
```

> **Redis decides who can buy.
> MongoDB records who bought.**

---

## 🛠️ Tech Stack

* Node.js + Express
* Redis + Lua
* MongoDB + Mongoose
* node-cron
* ioredis

---

## ⭐ Summary

* ✅ No overselling
* ✅ High concurrency safe
* ✅ Production-grade design
* ✅ Diagram-first explanation
