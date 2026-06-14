import express from 'express';
import { listener } from './infrastructure/event_listener';

const app = express();
const port = 3001;

app.use(express.json());

app.get('/health', (req, res) => res.send('OK'));
app.get('/ready', (req, res) => res.send('OK'));

app.listen(port, async () => {
  await listener.connect();
});
