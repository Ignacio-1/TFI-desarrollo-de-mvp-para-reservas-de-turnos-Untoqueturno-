import express from 'express';
import { publisher } from './infrastructure/message_broker';
import { readDbClient, writeDbClient } from './infrastructure/database';
import { getCachedAvailability, setCachedAvailability } from './infrastructure/cache';

const app = express();
const port = 3000;

app.use(express.json());

app.get('/api/v1/availability', async (req, res) => {
  try {
    const { proId, date, serviceId } = req.query;

    if (!proId || !date || !serviceId) {
      return res.status(400).json({ error: 'Missing parameters' });
    }

    const cacheKey = `availability:${proId}:${date}:${serviceId}`;
    const cachedData = await getCachedAvailability(cacheKey);

    if (cachedData) {
      return res.json({ source: 'cache', data: cachedData });
    }

    const { data, error } = await readDbClient
      .from('appointments')
      .select('*')
      .eq('professional_id', proId)
      .eq('date', date);

    if (error) throw error;

    const dummyAvailability = [
      { time: '09:00:00', availableSpots: 1 },
      { time: '10:00:00', availableSpots: 0 },
      { time: '11:00:00', availableSpots: 1 }
    ];

    await setCachedAvailability(cacheKey, dummyAvailability, 60);

    res.json({ source: 'database', data: dummyAvailability });
  } catch (error) {
    res.status(500).json({ error: 'Internal server error' });
  }
});

app.post('/api/v1/appointments', async (req, res) => {
  try {
    const { businessId, professionalId, slotTime, userEmail } = req.body;

    await publisher.publishTurnoReservado({
      businessId,
      professionalId,
      slotTime,
      userEmail
    });

    res.status(201).json({ status: 'pending_confirmation' });
  } catch (error) {
    res.status(500).json({ error: 'Internal server error' });
  }
});

app.get('/health', (req, res) => res.send('OK'));
app.get('/ready', (req, res) => res.send('OK'));

app.listen(port, async () => {
  await publisher.connect();
});
