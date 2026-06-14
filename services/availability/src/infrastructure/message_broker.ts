import * as amqp from 'amqplib';

// Se utiliza la variable inyectada por Docker Compose
const RABBITMQ_URL = process.env.RABBITMQ_URL || 'amqp://localhost';
const EXCHANGE_NAME = 'untoqueturno.events';

export class MessageBrokerPublisher {
  private channel: amqp.Channel | null = null;

  async connect() {
    try {
      const connection = await amqp.connect(RABBITMQ_URL);
      this.channel = await connection.createChannel();
      
      // Declaramos un Exchange tipo 'topic' para distribuir mensajes a múltiples colas
      await this.channel.assertExchange(EXCHANGE_NAME, 'topic', { durable: true });
      console.log('✅ [Publisher] Conectado a RabbitMQ');
    } catch (error) {
      console.error('❌ [Publisher] Error conectando a RabbitMQ. Reintentando en 5s...', error);
      // Lógica de resiliencia: Si RabbitMQ no arrancó aún, intentamos nuevamente
      setTimeout(() => this.connect(), 5000);
    }
  }

  async publishTurnoReservado(evento: { businessId: string, professionalId: string, slotTime: string, userEmail: string }) {
    if (!this.channel) throw new Error('El canal de RabbitMQ no está inicializado.');

    const routingKey = 'turno.reservado';
    const message = Buffer.from(JSON.stringify(evento));

    // Publicación asíncrona "Fire-and-forget" persistente
    this.channel.publish(EXCHANGE_NAME, routingKey, message, { persistent: true });
    console.log(`[Publisher] Evento Asíncrono emitido: ${routingKey}`, evento);
  }
}

export const publisher = new MessageBrokerPublisher();
