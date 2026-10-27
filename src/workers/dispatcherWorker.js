import { Worker } from 'bullmq';
import { redisConnection } from '../config/redis.js';
import { WEBHOOK_QUEUE_NAME } from '../queues/webhookQueue.js';
import { dlqQueue } from '../queues/dlqQueue.js';
import { sendWebhookNotification } from '../services/httpDispatcher.js';

const dispatcherWorker = new Worker(
  WEBHOOK_QUEUE_NAME,
  async (job) => {
    const { event, targetUrl, payload } = job.data;
    const currentAttempt = job.attemptsMade + 1;

    console.log(`[Tentativa ${currentAttempt}] Processando evento "${event}" -> ${targetUrl}`);

    try {
      const response = await sendWebhookNotification(targetUrl, payload);
      console.log(`✅ [Sucesso] Evento "${event}" entregue. HTTP Status: ${response.status}`);
      return { status: response.status, data: response.data };
    } catch (error) {
      const statusCode = error.response?.status;

      // Se for erro 5xx ou falha de rede/timeout, lança o erro para o BullMQ acionar o Retry
      if (!error.response || statusCode >= 500) {
        console.error(`⚠️ [Falha Temporária] Status ${statusCode || 'Timeout/Rede'}. Agendando retentativa...`);
        throw error;
      }

      // Erros 4xx são falhas irrecuperáveis do cliente (não devemos tentar novamente)
      console.error(`❌ [Falha Definitiva 4xx] Status HTTP ${statusCode}. Cancelando retentativas.`);
      throw new Error(`NonRetryableError: Status HTTP ${statusCode}`);
    }
  },
  { connection: redisConnection }
);

// Evento engatilhado quando TODAS as N tentativas falham
dispatcherWorker.on('failed', async (job, err) => {
  if (job && job.attemptsMade >= job.opts.attempts) {
    console.error(`🚨 [DLQ Triggered] Job ${job.id} esgotou ${job.opts.attempts} tentativas. Movendo para DLQ...`);

    await dlqQueue.add('dead-letter-job', {
      originalJobId: job.id,
      eventData: job.data,
      failedReason: err.message,
      failedAt: new Date().toISOString(),
      totalAttempts: job.attemptsMade,
    });
  }
});

console.log('⚡ Dispatcher Worker iniciado e escutando a fila...');