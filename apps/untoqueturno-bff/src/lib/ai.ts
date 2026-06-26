import { createServerFn } from '@tanstack/react-start';
import amqp from 'amqplib';

const RABBITMQ_URL = process.env.RABBITMQ_URL || 'amqp://admin:secret@127.0.0.1:5672';
const REQUEST_QUEUE = 'ai.chat.requests';

export const askAI = createServerFn({ method: 'POST' })
  .validator((message: string) => message)
  .handler(async ({ data: message }) => {
    let connection: any = null;
    try {
      connection = await amqp.connect(RABBITMQ_URL);
      const channel = await connection.createChannel();

      // Aseguramos la cola principal de peticiones
      await channel.assertQueue(REQUEST_QUEUE, { durable: true });

      // Creamos una cola exclusiva y temporal para recibir la respuesta (Patrón RPC)
      const q = await channel.assertQueue('', { exclusive: true });
      const correlationId = Math.random().toString() + Date.now().toString();

      return await new Promise<string>((resolve) => {
        // Timeout de seguridad de 8 segundos
        const timeout = setTimeout(() => {
          if (connection) connection.close();
          resolve("Lo siento, estoy tardando demasiado en pensar. Intenta de nuevo.");
        }, 8000);

        // Escuchamos en nuestra cola exclusiva
        channel.consume(q.queue, (msg: any) => {
          if (msg && msg.properties.correlationId === correlationId) {
            clearTimeout(timeout);
            const reply = msg.content.toString();
            resolve(reply);
            setTimeout(() => { if (connection) connection.close() }, 500); // Cerramos tras resolver
          }
        }, { noAck: true });

        // Enviamos la petición indicando a dónde y con qué ID queremos la respuesta
        channel.sendToQueue(REQUEST_QUEUE, Buffer.from(message), {
          correlationId: correlationId,
          replyTo: q.queue
        });
      });
    } catch (err) {
      console.error("RPC AI Error:", err);
      if (connection) setTimeout(() => connection.close(), 500);
      return "No me he podido conectar con mi cerebro de IA (RabbitMQ está offline).";
    }
  });
