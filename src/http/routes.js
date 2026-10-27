import { Router } from 'express';
import { handleIngestEvent } from './controllers/eventController.js';

const routes = Router();

routes.post('/events', handleIngestEvent);

routes.get('/health', (req, res) => {
  return res.status(200).json({ status: 'OK', timestamp: new Date().toISOString() });
});

export default routes;