export const RESERVE_STOCK_LUA = `
-- ARGV[1] = reservation key
-- ARGV[2] = ttl
-- ARGV[3...] = productId, qty pairs

local reservationKey = ARGV[1]
local ttl = tonumber(ARGV[2])
local result = {}

-- CHECK
for i = 3, #ARGV, 2 do
  local pid = ARGV[i]
  local qty = tonumber(ARGV[i+1])
  if redis.call("LLEN", "stock:"..pid) < qty then
    return nil
  end
end

-- RESERVE
for i = 3, #ARGV, 2 do
  local pid = ARGV[i]
  local qty = tonumber(ARGV[i+1])

  local tokens = redis.call("LRANGE", "stock:"..pid, 0, qty-1)
  redis.call("LTRIM", "stock:"..pid, qty, -1)

  result[pid] = tokens
end

redis.call("SET", reservationKey, "1", "EX", ttl)
redis.call("SET", reservationKey..":data", cjson.encode(result))

return cjson.encode(result)
`;

export const REVOKE_STOCK_LUA = `
local data = cjson.decode(ARGV[1])

for pid, tokens in pairs(data) do
  for i = 1, #tokens do
    redis.call("RPUSH", "stock:"..pid, tokens[i])
  end
end

return true
`;
