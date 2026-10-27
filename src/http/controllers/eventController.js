import { webhookQueue } from '../../queues/webhookQueue.js';

export async function handleIngestEvent(req, res) {
  const { event, targetUrl, payload } = req.body;

  if (!event || !targetUrl || !payload) {
    return res.status(400).json({
      error: 'Payload inválido. Os campos "event", "targetUrl" e "payload" são obrigatórios.',
    });
  }

  // Enfileira o evento na fila principal do BullMQ
  const job = await webhookQueue.add('send-webhook', {
    event,
    targetUrl,
    payload,
    createdAt: new Date().toISOString(),
  });

  return res.status(202).json({
    message: 'Evento recebido e enfileirado com sucesso.',
    jobId: job.id,
  });
}