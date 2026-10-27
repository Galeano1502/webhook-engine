import axios from 'axios';

export async function sendWebhookNotification(targetUrl, payload) {
  return await axios.post(targetUrl, payload, {
    timeout: 5000, // Aborta requisições que demorarem mais de 5s
    headers: {
      'Content-Type': 'application/json',
      'User-Agent': 'WebhookEngine-Dispatcher/1.0',
    },
  });
}