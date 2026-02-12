import express from "express"
import { ConnectDb } from "./Mongodb"
import { redis } from "./redis"
import { RESERVE_LUA } from "./reservation.lua.js"
import { randomUUID } from "crypto"
import { Order } from "./model/Order.js"
import cron from "node-cron"
const app=express()

app.post("/seed/product",async(req,res)=>{
 const {productId,quantity}=req.body

 const existing=await redis.llend(`stock:${productId}`)
 if(existing>0){
   return res.json({
      message:"already seeded"
   })
 }

 for(let i=0;i<quantity;i++){
   await redis.rpush(`stock:${productId}`,randomUUID)
 }

 res.json({
   message:"stocked Seeded",
   quantity
 })

})

app.post("/cart/add",async(req,res)=>{
   const {userId,productId,quantity}=req.body;

   const token=await redis.eval(
      RESERVE_LUA,1,`stock:${productId}`,quantity
   )
   if(!token){
      res.status(409).json({message:"Out of Stock"})
   }
   await redis.set(
      `reserve:${userId}:${productId}`
   )

   res.json({
      message:"added to cart",
      quantity
   })
})

app.post("/order/create",async(req,res)=>{
   const {userId,productId,quantity}=req.body;
const reservation=await redis.get(`reserve:${userId}:${productId}`)
   if(!reservation){
      res.status(409).json({message:"Reservation Expired"})
   }

   const order=await Order.create({userId,productId,quantity})

})

app.post("/checkout/payment",async()=>{
   const {orderId}=req.body;
   const order=await Order.findOne(orderId);

   if(!order || order.status!=='PENDING_PAYMENT'){
      return res.status(400).json({message:"Invalid Order"})
   }
   order.status='PAID';
   await order.save();
   await redis.del(`reserve:${order.userId}:${order.productId}`)
   res.json({
      message:"payment succesful"
   })
})

cron.schedule('',()=>{

})


async function start(){
   await ConnectDb();
   app.listen(8000,()=>{
      console.log("strtaed"); 
   })
}

start();