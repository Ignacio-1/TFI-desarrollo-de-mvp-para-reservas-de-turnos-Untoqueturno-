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
      
      // Declaramos una cola específica y persistente para este microservicio
      const q = await channel.assertQueue(QUEUE_NAME, { durable: true });

      // Binding: Conectamos la cola a los mensajes que coincidan con "turno.reservado"
      await channel.bindQueue(q.queue, EXCHANGE_NAME, 'turno.reservado');

      console.log('✅ [Consumer] Suscripciones conectado a RabbitMQ, esperando eventos en background.');

      channel.consume(q.queue, (msg) => {
        if (msg) {
          const payload = JSON.parse(msg.content.toString());
          console.log(`[Consumer] Recibido evento asíncrono "turno.reservado":`, payload);
          
          // Lógica en segundo plano desconectada de la latencia web
          this.procesarAuditoriaSuscripcion(payload);

          // Confirmación manual (Acknowledge). Garantiza que si el servicio cae,
          // el mensaje vuelve a la cola y no se pierde ("At-least-once delivery").
          channel.ack(msg);
        }
      }, { noAck: false });
    } catch (error) {
      console.error('❌ [Consumer] Error conectando a RabbitMQ. Reintentando en 5s...', error);
      setTimeout(() => this.connect(), 5000);
    }
  }

  private procesarAuditoriaSuscripcion(data: any) {
    console.log(`--> [El Guardián] Auditando cupos de suscripción para el negocio ${data.businessId} tras reserva.`);
  }
}

export const listener = new EventListener();
