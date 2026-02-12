// Atomic stock reservation Lua script
export const RESERVE_LUA = `
-- KEYS[1] -> stock key (stock:productId)
-- ARGV[1] -> quantity to reserve

local stockKey = KEYS[1]
local quantity = tonumber(ARGV[1])

local available = redis.call("LLEN", stockKey)
if available < quantity then
  return nil
end

local token = redis.call("INCR", "reservation:counter")

for i = 1, quantity do
  redis.call("RPOP", stockKey)
end

return tostring(token)
`;
// Atomic rollback Lua script
export const ROLLBACK_LUA = `
-- KEYS[1] -> stock key (stock:productId)
-- ARGV[1] -> quantity to rollback

local stockKey = KEYS[1]
local quantity = tonumber(ARGV[1])

for i = 1, quantity do
  redis.call("LPUSH", stockKey, "rollback")
end

return true
`;
