import { Queue } from 'bullmq';
import { redisConnection } from '../config/redis.js';

export const DLQ_QUEUE_NAME = 'webhook-dlq';

export const dlqQueue = new Queue(DLQ_QUEUE_NAME, {
  connection: redisConnection,
  defaultJobOptions: {
    removeOnComplete: false,
    removeOnFail: false,
  },
});