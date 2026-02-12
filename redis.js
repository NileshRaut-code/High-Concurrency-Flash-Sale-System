import Redis from 'ioredis'

const redis=new Redis()
  
redis.on("connect",()=>{
   console.log("redis conected");
})
redis.on("ready",()=>{
   console.log("redis ready");
})
redis.on("error",()=>{
   console.log("redis error");
})

export {redis}