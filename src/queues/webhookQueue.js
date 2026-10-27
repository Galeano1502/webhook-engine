import { Queue } from 'bullmq';
import { redisConnection } from '../config/redis.js';

export const WEBHOOK_QUEUE_NAME = 'webhook-dispatch';

export const webhookQueue = new Queue(WEBHOOK_QUEUE_NAME, {
  connection: redisConnection,
  defaultJobOptions: {
    attempts: 5,
    backoff: {
      type: 'exponential',
      delay: 2000,
    },
    removeOnComplete: {
      age: 3600,
      count: 1000,
    },
    removeOnFail: false,
  },
});