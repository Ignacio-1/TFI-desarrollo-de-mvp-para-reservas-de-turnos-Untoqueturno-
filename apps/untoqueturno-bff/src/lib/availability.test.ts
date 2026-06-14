import { describe, it, expect } from 'vitest';
import { buildAvailableSlots } from './availability';
import type { Professional, Service, Appointment } from './types';

describe('Availability Engine', () => {
  const dummyService: Service = {
    id: 's1',
    business_id: 'b1',
    name: 'Corte de pelo',
    duration_min: 30,
    price: 1000,
    deposit: 500,
    capacity: 1,
    active: true,
    description: '',
    target_gender: 'ambos'
  };

  const dummyProfessional: Professional = {
    id: 'p1',
    business_id: 'b1',
    name: 'Juan Perez',
    title: null,
    avatar_color: '#000000',
    service_ids: ['s1'],
    active: true,
    hours: [
      {
        id: 'h1',
        professional_id: 'p1',
        date: '2024-01-01',
        start_time: '09:00:00',
        end_time: '12:00:00',
      }
    ]
  };

  it('debería retornar todos los slots si no hay turnos ocupados', () => {
    const slots = buildAvailableSlots(dummyProfessional, '2024-01-01', dummyService, []);
    expect(slots).toEqual([
      { time: '09:00', availableSpots: 1 },
      { time: '09:30', availableSpots: 1 },
      { time: '10:00', availableSpots: 1 },
      { time: '10:30', availableSpots: 1 },
      { time: '11:00', availableSpots: 1 },
      { time: '11:30', availableSpots: 1 }
    ]);
  });

  it('debería filtrar los slots ocupados', () => {
    const appointments: Appointment[] = [
      {
        id: 'a1',
        business_id: 'b1',
        service_id: 's1',
        professional_id: 'p1',
        client_id: 'u1',
        client_name: 'Test',
        date: '2024-01-01',
        time: '10:00:00',
        status: 'confirmed',
        is_paid: false,
        created_at: new Date().toISOString()
      }
    ];

    const slots = buildAvailableSlots(dummyProfessional, '2024-01-01', dummyService, appointments);
    expect(slots).toEqual([
      { time: '09:00', availableSpots: 1 },
      { time: '09:30', availableSpots: 1 },
      { time: '10:30', availableSpots: 1 },
      { time: '11:00', availableSpots: 1 },
      { time: '11:30', availableSpots: 1 }
    ]);
  });

  it('debería incluir los slots de turnos cancelados', () => {
    const appointments: Appointment[] = [
      {
        id: 'a1',
        business_id: 'b1',
        service_id: 's1',
        professional_id: 'p1',
        client_id: 'u1',
        client_name: 'Test',
        date: '2024-01-01',
        time: '10:00:00',
        status: 'cancelled',
        is_paid: false,
        created_at: new Date().toISOString()
      }
    ];

    const slots = buildAvailableSlots(dummyProfessional, '2024-01-01', dummyService, appointments);
    expect(slots).toEqual([
      { time: '09:00', availableSpots: 1 },
      { time: '09:30', availableSpots: 1 },
      { time: '10:00', availableSpots: 1 },
      { time: '10:30', availableSpots: 1 },
      { time: '11:00', availableSpots: 1 },
      { time: '11:30', availableSpots: 1 }
    ]);
  });

  it('debería generar los slots correctos para un servicio de 45 minutos', () => {
    const service45: Service = { ...dummyService, duration_min: 45 };
    const slots = buildAvailableSlots(dummyProfessional, '2024-01-01', service45, []);
    expect(slots).toEqual([
      { time: '09:00', availableSpots: 1 },
      { time: '09:45', availableSpots: 1 },
      { time: '10:30', availableSpots: 1 },
      { time: '11:15', availableSpots: 1 }
    ]);
  });

  it('debería soportar capacidad múltiple', () => {
    const serviceCapacity2: Service = { ...dummyService, capacity: 2 };
    const appointments: Appointment[] = [
      {
        id: 'a1',
        business_id: 'b1',
        service_id: 's1',
        professional_id: 'p1',
        client_id: 'u1',
        client_name: 'Test',
        date: '2024-01-01',
        time: '10:00:00',
        status: 'confirmed',
        is_paid: false,
        created_at: new Date().toISOString()
      }
    ];

    const slots = buildAvailableSlots(dummyProfessional, '2024-01-01', serviceCapacity2, appointments);
    expect(slots).toEqual([
      { time: '09:00', availableSpots: 2 },
      { time: '09:30', availableSpots: 2 },
      { time: '10:00', availableSpots: 1 }, // Solo queda 1 lugar
      { time: '10:30', availableSpots: 2 },
      { time: '11:00', availableSpots: 2 },
      { time: '11:30', availableSpots: 2 }
    ]);
  });

  it('debería retornar vacío si el profesional no atiende ese día', () => {
    // 2024-01-02 no tiene horarios definidos para dummyProfessional
    const slots = buildAvailableSlots(dummyProfessional, '2024-01-02', dummyService, []);
    expect(slots).toEqual([]);
  });

  describe('Casos de Abuso y Límites (Edge Cases)', () => {
    it('debería manejar una fecha corrupta retornando vacío sin romper', () => {
      const slots = buildAvailableSlots(dummyProfessional, 'FECHA-CORRUPTA-SQL-INJECTION', dummyService, []);
      expect(slots).toEqual([]);
    });

    it('debería manejar duration_min en 0 o negativo sin caer en bucle infinito', () => {
      // Si duration es 0, el motor usa un fallback de 30 para evitar while(cur + 0 <= end) infinito.
      const serviceBad: Service = { ...dummyService, duration_min: 0 };
      const slots = buildAvailableSlots(dummyProfessional, '2024-01-01', serviceBad, []);
      // Debería usar 30 por defecto
      expect(slots.length).toBe(6); 
      expect(slots[0].time).toBe('09:00');
      expect(slots[1].time).toBe('09:30');
    });

    it('debería manejar un profesional sin horarios definidos correctamente', () => {
      const emptyPro: Professional = { ...dummyProfessional, hours: [] };
      const slots = buildAvailableSlots(emptyPro, '2024-01-01', dummyService, []);
      expect(slots).toEqual([]);
    });
  });
});
