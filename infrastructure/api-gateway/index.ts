import express from 'express';
import CircuitBreaker from 'opossum';
import axios from 'axios';

const app = express();
const port = 8080;

// Configuración de Circuit Breaker para proteger el Gateway de caídas en cascada
const availabilityOptions = {
  timeout: 3000, // Falla si la petición dura más de 3 segundos
  errorThresholdPercentage: 50, // Se "Abre" el circuito si falla el 50% de peticiones
  resetTimeout: 10000 // Tarda 10 segundos antes de intentar un modo "Half-Open"
};

// Función proxy hacia el microservicio
const fetchAvailability = async (params: any) => {
  const { url, method } = params;
  const response = await axios({ url, method });
  return response.data;
};

const availabilityBreaker = new CircuitBreaker(fetchAvailability, availabilityOptions);

// Función Fallback: Lo que se responde automáticamente cuando el circuito está ABIERTO (roto)
availabilityBreaker.fallback(() => {
  return { 
    error: true, 
    message: "El servicio de disponibilidad está temporalmente congestionado (Cortocircuito Activo).",
    data: [] // Retornamos un array vacío para que el Tolerant Reader en React no explote
  };
});

// Logs para auditoría del Patrón
availabilityBreaker.on('open', () => console.warn('🔴 CIRCUIT BREAKER ABIERTO: Redirigiendo a Fallback.'));
availabilityBreaker.on('halfOpen', () => console.info('🟡 CIRCUIT BREAKER MEDIO ABIERTO: Probando recuperación.'));
availabilityBreaker.on('close', () => console.info('🟢 CIRCUIT BREAKER CERRADO: Operación normal.'));

app.get('/api/v1/availability', async (req, res) => {
  // Ruteo hacia el microservicio real
  const targetUrl = `http://availability-service:3000/api/v1/availability${req.url.substring(req.url.indexOf('?'))}`;
  try {
    const result = await availabilityBreaker.fire({ url: targetUrl, method: 'GET' });
    if (result.error) {
      res.status(503).json(result); // 503 Service Unavailable
    } else {
      res.json(result);
    }
  } catch (error: any) {
    res.status(500).json({ error: "Error de red en Gateway" });
  }
});

app.listen(port, () => {
  console.log(`🚀 API Gateway escuchando en el puerto ${port}`);
});
