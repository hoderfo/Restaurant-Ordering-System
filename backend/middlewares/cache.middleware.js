const redisClient = require('../redis/redisClient');

/**
 * Cache middleware to store and retrieve API responses from Redis.
 * @param {number} ttl - Time to live in seconds. Default is 3600 (1 hour).
 */
const cacheMiddleware = (ttl = 3600) => {
    return async (req, res, next) => {
        // Only cache GET requests
        if (req.method !== 'GET') {
            return next();
        }

        const key = `cache:${req.originalUrl || req.url}`;

        try {
            // Check if Redis is connected
            if (!redisClient.isOpen) {
                console.warn('⚠️ Redis not connected, skipping cache');
                return next();
            }

            const cachedData = await redisClient.get(key);

            if (cachedData) {
                // console.log(`🚀 Cache Hit: ${key}`);
                return res.status(200).json(JSON.parse(cachedData));
            }

            // console.log(`🐢 Cache Miss: ${key}`);

            // Store the original res.json function
            const originalJson = res.json;

            // Override res.json
            res.json = (body) => {
                // Only cache successful responses
                if (res.statusCode >= 200 && res.statusCode < 300) {
                    redisClient.set(key, JSON.stringify(body), {
                        EX: ttl
                    }).catch(err => console.error('❌ Redis Set Error:', err));
                }

                return originalJson.call(res, body);
            };

            next();
        } catch (error) {
            console.error('❌ Cache Middleware Error:', error);
            next();
        }
    };
};

const clearCache = async (pattern) => {
    await redisClient.delByPattern(pattern);
};

module.exports = { cacheMiddleware, clearCache };
