import Redis from 'ioredis'

const redis=new Redis("redis://localhost:6379")
redis.config("SET", "notify-keyspace-events", "Ex")
 const subscriber = new Redis("redis://loclhost:6379");
redis.on("connect",()=>{
   console.log("redis conected");
})
redis.on("ready",()=>{
   console.log("redis ready");
})
redis.on("error",()=>{
   console.log("redis error");
})

export {redis,subscriber}