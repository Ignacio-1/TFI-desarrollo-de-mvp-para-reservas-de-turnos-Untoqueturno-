import express from 'express';
import CircuitBreaker from 'opossum';
import axios from 'axios';

const app = express();
const port = 8080;

const availabilityOptions = {
  timeout: 3000,
  errorThresholdPercentage: 50,
  resetTimeout: 10000
};

const fetchAvailability = async (params: any) => {
  const { url, method } = params;
  const response = await axios({ url, method });
  return response.data;
};

const availabilityBreaker = new CircuitBreaker(fetchAvailability, availabilityOptions);

availabilityBreaker.fallback(() => {
  return { 
    error: true, 
    message: "El servicio de disponibilidad está temporalmente congestionado.",
    data: []
  };
});

app.get('/api/v1/availability', async (req, res) => {
  const targetUrl = `http://availability-service:3000/api/v1/availability${req.url.substring(req.url.indexOf('?'))}`;
  try {
    const result = await availabilityBreaker.fire({ url: targetUrl, method: 'GET' });
    if (result.error) {
      res.status(503).json(result);
    } else {
      res.json(result);
    }
  } catch (error: any) {
    res.status(500).json({ error: "Error de red en Gateway" });
  }
});

app.listen(port, () => {});
