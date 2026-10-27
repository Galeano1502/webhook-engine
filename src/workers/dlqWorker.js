import { Worker } from 'bullmq';
import { redisConnection } from '../config/redis.js';
import { DLQ_QUEUE_NAME } from '../queues/dlqQueue.js';

const dlqWorker = new Worker(
  DLQ_QUEUE_NAME,
  async (job) => {
    const { originalJobId, eventData, failedReason, failedAt, totalAttempts } = job.data;

    console.log('\n--------------------------------------------------');
    console.log('💀 [DEAD LETTER QUEUE] Notificação recebida:');
    console.log(`- Job Original ID: ${originalJobId}`);
    console.log(`- Evento: ${eventData.event}`);
    console.log(`- Destino: ${eventData.targetUrl}`);
    console.log(`- Total Tentativas: ${totalAttempts}`);
    console.log(`- Motivo: ${failedReason}`);
    console.log(`- Data/Hora: ${failedAt}`);
    console.log('--------------------------------------------------\n');
  },
  { connection: redisConnection }
);

console.log('💀 DLQ Worker iniciado e escutando mensagens mortas...');