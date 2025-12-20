import Redis, { RedisOptions } from 'ioredis'

const getRedisConfig = (): RedisOptions => { 
    const host = process.env.REDIS_HOST
    const port = Number(process.env.REDIS_PORT)
    const password = process.env.REDIS_PASSWORD || ''
    return {
        host,
        port,
        password,
        retryStrategy: (times: number) => {
            return Math.min(times * 50, 1000)
        },
        maxRetriesPerRequest: 3,
        connectTimeout: 10000,
        enableOfflineQueue: true,
        lazyConnect: true,
    }
}

let redisClient: Redis | null = null

export const getRedisClient = async (): Promise<Redis> => {
    if (redisClient) return redisClient
    const config = getRedisConfig()
    redisClient = new Redis(config)

    redisClient.on('error', (err) => {
        console.error('Redis error:', err)
    })

    redisClient.on('connect', () => {
        console.log('Redis connected')
    })

    redisClient.on('reconnecting', () => {
        console.log('Redis reconnecting')
    })

    redisClient.on('ready', () => {
        console.log('Redis ready')
    })

    redisClient.on('end', () => {
        console.log('Redis end')
    })
    return redisClient
}

export const checkRedisConnection = async (): Promise<boolean> => {
    try {
        const client = await getRedisClient()
        await client.ping()
        return true
    } catch (err) {
        console.error('Redis connection check failed:', err)
        return false
    }
}

export const closeRedisConnection = async (): Promise<void> => {
    if (redisClient) {
        await redisClient.quit()
        redisClient = null
        console.log('Redis connection closed')
    } else {
        console.log('Redis connection already closed')
    }
}