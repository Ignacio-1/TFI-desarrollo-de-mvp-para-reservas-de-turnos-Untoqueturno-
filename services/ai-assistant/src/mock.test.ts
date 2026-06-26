import { describe, it, expect } from 'vitest';

// Función pura extraída para testing
async function generateAIResponseMock(userMessage: string): Promise<string> {
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

describe('AI Assistant Mock Engine - Admin Dashboard', () => {
  it('Debería responder al saludo del administrador', async () => {
    const res = await generateAIResponseMock('Hola');
    expect(res).toContain('¡Hola Administrador!');
  });

  it('Debería resumir la agenda del consultorio', async () => {
    const res = await generateAIResponseMock('¿Qué turno me sigue?');
    expect(res).toContain('Tu próximo paciente es Juan Pérez');
  });

  it('Debería dar reporte de cupos de gimnasio', async () => {
    const res = await generateAIResponseMock('¿Cuántos cupos quedan para la clase?');
    expect(res).toContain('cupo máximo: 15');
  });

  it('Debería dar un balance de turnos y recaudación', async () => {
    const res = await generateAIResponseMock('¿Cuánto llevo recaudado hoy?');
    expect(res).toContain('$45,000 ARS');
  });
});
