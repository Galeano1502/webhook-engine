import express from 'express';

const app = express();
app.use(express.json());

let requestCount = 0;

// Rota 1: Sucesso constante (200 OK)
app.post('/webhook-success', (req, res) => {
  console.log('[Mock Server] Requisição recebida com SUCESSO:', req.body.event);
  return res.status(200).json({ received: true });
});

// Rota 2: Instabilidade simulada (Falha nas primeiras 3 tentativas, depois responde 200 OK)
app.post('/webhook-unstable', (req, res) => {
  requestCount++;
  if (requestCount <= 3) {
    console.log(`[Mock Server] Instabilidade simulada (Tentativa ${requestCount}). Retornando HTTP 503...`);
    return res.status(503).json({ error: 'Servidor Temporariamente Indisponível' });
  }

  console.log(`[Mock Server] Recuperado com sucesso na tentativa ${requestCount}! Retornando HTTP 200.`);
  return res.status(200).json({ status: 'Recuperado com sucesso!' });
});

// Rota 3: Falha total (Retorna sempre 500 Internal Server Error para forçar o envio à DLQ)
app.post('/webhook-fail', (req, res) => {
  console.log('[Mock Server] Falha permanente simulada (HTTP 500).');
  return res.status(500).json({ error: 'Erro Fatal Interno' });
});

app.listen(4000, () => {
  console.log('⚙️ Mock Target Server rodando na porta 4000');
});