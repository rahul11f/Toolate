import { Redis } from '@upstash/redis';
import { Ratelimit } from '@upstash/ratelimit';

const isMockRedis =
  !process.env.UPSTASH_REDIS_REST_URL ||
  process.env.UPSTASH_REDIS_REST_URL.includes('your-database-name');

let redisClient: any;
let signupLimiter: any;
let listingLimiter: any;
let otpLimiter: any;
let feedbackLimiter: any;

if (isMockRedis) {
  console.warn('Using in-memory Redis mock for local development.');
  
  // In-memory mock store
  const store = new Map<string, { value: any; expiresAt: number }>();
  
  redisClient = {
    get: async <T>(key: string): Promise<T | null> => {
      const entry = store.get(key);
      if (!entry) return null;
      if (entry.expiresAt < Date.now()) {
        store.delete(key);
        return null;
      }
      return entry.value as T;
    },
    set: async (key: string, value: any, options?: { ex?: number }) => {
      const duration = options?.ex ? options.ex * 1000 : 3600 * 1000;
      store.set(key, { value, expiresAt: Date.now() + duration });
      return 'OK';
    },
    del: async (key: string) => {
      store.delete(key);
      return 1;
    },
  };

  const createMockLimiter = () => ({
    limit: async () => ({ success: true, limit: 10, remaining: 9, reset: Date.now() + 60000 }),
  });

  signupLimiter = createMockLimiter();
  listingLimiter = createMockLimiter();
  otpLimiter = createMockLimiter();
  feedbackLimiter = createMockLimiter();
} else {
  redisClient = new Redis({
    url: process.env.UPSTASH_REDIS_REST_URL || '',
    token: process.env.UPSTASH_REDIS_REST_TOKEN || '',
  });

  signupLimiter = new Ratelimit({
    redis: redisClient,
    limiter: Ratelimit.slidingWindow(5, '1 h'),
    analytics: true,
    prefix: '@upstash/ratelimit/signup',
  });

  listingLimiter = new Ratelimit({
    redis: redisClient,
    limiter: Ratelimit.slidingWindow(10, '1 h'),
    analytics: true,
    prefix: '@upstash/ratelimit/listing',
  });

  otpLimiter = new Ratelimit({
    redis: redisClient,
    limiter: Ratelimit.slidingWindow(5, '5 m'),
    analytics: true,
    prefix: '@upstash/ratelimit/otp',
  });

  feedbackLimiter = new Ratelimit({
    redis: redisClient,
    limiter: Ratelimit.slidingWindow(5, '1 h'),
    analytics: true,
    prefix: '@upstash/ratelimit/feedback',
  });
}

export const redis = redisClient;
export const signupRateLimiter = signupLimiter;
export const listingRateLimiter = listingLimiter;
export const otpRateLimiter = otpLimiter;
export const feedbackRateLimiter = feedbackLimiter;
