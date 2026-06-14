import * as amqp from 'amqplib';

const RABBITMQ_URL = process.env.RABBITMQ_URL || 'amqp://localhost';
const EXCHANGE_NAME = 'untoqueturno.events';
const QUEUE_NAME = 'subscriptions_audit_queue';

export class EventListener {
  async connect() {
    try {
      const connection = await amqp.connect(RABBITMQ_URL);
      const channel = await connection.createChannel();

      await channel.assertExchange(EXCHANGE_NAME, 'topic', { durable: true });
      
      const q = await channel.assertQueue(QUEUE_NAME, { durable: true });

      await channel.bindQueue(q.queue, EXCHANGE_NAME, 'turno.reservado');

      channel.consume(q.queue, (msg) => {
        if (msg) {
          const payload = JSON.parse(msg.content.toString());
          
          this.procesarAuditoriaSuscripcion(payload);

          channel.ack(msg);
        }
      }, { noAck: false });
    } catch (error) {
      setTimeout(() => this.connect(), 5000);
    }
  }

  private procesarAuditoriaSuscripcion(data: any) {
  }
}

export const listener = new EventListener();
