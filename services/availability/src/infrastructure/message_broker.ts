import * as amqp from 'amqplib';

const RABBITMQ_URL = process.env.RABBITMQ_URL || 'amqp://localhost';
const EXCHANGE_NAME = 'untoqueturno.events';

export class MessageBrokerPublisher {
  private channel: amqp.Channel | null = null;

  async connect() {
    try {
      const connection = await amqp.connect(RABBITMQ_URL);
      this.channel = await connection.createChannel();
      
      await this.channel.assertExchange(EXCHANGE_NAME, 'topic', { durable: true });
    } catch (error) {
      setTimeout(() => this.connect(), 5000);
    }
  }

  async publishTurnoReservado(evento: { businessId: string, professionalId: string, slotTime: string, userEmail: string }) {
    if (!this.channel) throw new Error('El canal de RabbitMQ no está inicializado.');

    const routingKey = 'turno.reservado';
    const message = Buffer.from(JSON.stringify(evento));

    this.channel.publish(EXCHANGE_NAME, routingKey, message, { persistent: true });
  }
}

export const publisher = new MessageBrokerPublisher();
