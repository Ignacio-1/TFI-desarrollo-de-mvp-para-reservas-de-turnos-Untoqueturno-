import amqp from 'amqplib';
import process from 'node:process';
import { Buffer } from 'node:buffer';

const RABBITMQ_URL = process.env.RABBITMQ_URL || 'amqp://admin:secret@localhost:5672';
const REQUEST_QUEUE = 'ai.chat.requests';
const RESPONSE_QUEUE = 'ai.chat.responses';

export async function generateAIResponseMock(userMessage: string): Promise<string> {
  // Simulador de latencia de red (2 segundos) para emular la llamada a la API real de OpenAI
  await new Promise(resolve => setTimeout(resolve, 2000));

  const lowerMsg = userMessage.toLowerCase();
  
  if (lowerMsg.includes('hola') || lowerMsg.includes('buen')) {
    return '¡Hola Administrador! Soy tu asistente de gestión Untoqueturno. Puedes preguntarme sobre tu agenda, pacientes, clases o balances financieros.';
  } else if (lowerMsg.includes('próximo turno') || lowerMsg.includes('proximo turno') || lowerMsg.includes('sigue') || lowerMsg.includes('agenda') || lowerMsg.includes('consultorio') || lowerMsg.includes('paciente')) {
    return '📋 Consultorio: Tu próximo paciente es Juan Pérez a las 15:30 para "Consulta General". Luego tienes a María Gómez a las 16:15.';
  } else if (lowerMsg.includes('gimnasio') || lowerMsg.includes('clase') || lowerMsg.includes('cupo') || lowerMsg.includes('crossfit')) {
    return '🏋️ Gimnasio: La clase de Funcional de las 18:00 está casi llena. Tienes 12 personas anotadas (cupo máximo: 15). Te quedan 3 lugares disponibles.';
  } else if (lowerMsg.includes('recaudad') || lowerMsg.includes('balance') || lowerMsg.includes('cuantos turnos') || lowerMsg.includes('dinero') || lowerMsg.includes('resumen')) {
    return '💰 Balance del día: Has completado 24 turnos el día de hoy. La recaudación total calculada es de $45,000 ARS. ¡Excelente jornada!';
  } else {
    return 'Comprendo. Actualmente estoy configurado para ayudarte con resúmenes de agenda, cupos de clases y reportes financieros. ¿En qué de esas áreas te puedo ayudar?';
  }
}

async function start() {
  let connection: any = null;
  
  // Lógica de reintentos para esperar a que RabbitMQ levante
  for (let i = 0; i < 10; i++) {
    try {
      connection = await amqp.connect(RABBITMQ_URL);
      console.log('🤖 AI Assistant conectado exitosamente a RabbitMQ');
      break;
    } catch (err) {
      console.log(`⏳ Esperando a RabbitMQ... (Intento ${i + 1}/10)`);
      await new Promise(res => setTimeout(res, 3000));
    }
  }

  if (!connection) {
    console.error('❌ Error crítico: No se pudo conectar a RabbitMQ');
    process.exit(1);
  }

  const channel = await connection.createChannel();
  
  // Declarar colas
  await channel.assertQueue(REQUEST_QUEUE, { durable: true });
  await channel.assertQueue(RESPONSE_QUEUE, { durable: true });

  console.log(`🤖 AI Assistant escuchando mensajes en la cola: ${REQUEST_QUEUE}`);

  channel.consume(REQUEST_QUEUE, async (msg: any) => {
    if (msg) {
      try {
        const userMessage = msg.content.toString();
        console.log(`📥 Petición recibida [ID: ${msg.properties.correlationId}]: "${userMessage}"`);

        // Llamada a nuestro "Inyector de Dependencia" (Mock OpenAI)
        const aiReply = await generateAIResponseMock(userMessage);

        // Publicamos la respuesta en la cola exclusiva del cliente (replyTo)
        if (msg.properties.replyTo) {
          channel.sendToQueue(msg.properties.replyTo, Buffer.from(aiReply), {
            correlationId: msg.properties.correlationId
          });
          console.log(`📤 Respuesta enviada a ${msg.properties.replyTo}`);
        }

        // Confirmamos a RabbitMQ que procesamos el mensaje exitosamente
        channel.ack(msg);
      } catch (err) {
        console.error('Error procesando mensaje:', err);
        channel.nack(msg);
      }
    }
  });
}

start();
