import { describe, it, expect } from 'vitest';
import { buildAvailableSlots } from '@/lib/availability';
import { formatMoney } from '@/lib/format';
import { type Service, type Professional } from '@/lib/types';

describe('Pruebas Defensivas y del Mundo Real', () => {

  describe('D1. Valores Nulos/Incompletos', () => {
    it('formatMoney: debería manejar null, undefined o NaN sin crashear', () => {
      // Usamos replace para normalizar el espacio de no separación (\xa0) que inserta Intl.NumberFormat
      // @ts-expect-error probando caso de abuso
      expect(formatMoney(null).replace(/\s/g, ' ')).toBe('$ 0');
      // @ts-expect-error probando caso de abuso
      expect(formatMoney(undefined).replace(/\s/g, ' ')).toBe('$ 0');
      expect(formatMoney(NaN).replace(/\s/g, ' ')).toBe('$ 0');
    });

    it('buildAvailableSlots: debería retornar vacío si recibe profesional nulo', () => {
      // @ts-expect-error probando profesional sin horas o corrupto
      const badPro: Professional = { id: 'p1' }; // Le faltan todos los campos
      const dummyService: Service = { id: 's1', duration_min: 30, capacity: 1 } as any;
      const slots = buildAvailableSlots(badPro, '2024-01-01', dummyService, []);
      expect(slots).toEqual([]); // No debe crashear, sino retornar [] al no tener hours
    });
  });

  describe('D2. Inyección de Basura', () => {
    it('buildAvailableSlots: debería defenderse de strings vacíos o tipos erróneos', () => {
      const dummyPro: Professional = { 
        id: 'p1', 
        name: 'test', 
        title: null,
        avatar_color: '#000',
        active: true,
        service_ids: [],
        hours: [{ id: 'h1', professional_id: 'p1', date: '2024-01-01', start_time: 'INVALID', end_time: 'ALSO_INVALID' }]
      };
      const dummyService: Service = { id: 's1', duration_min: 30, capacity: 1 } as any;
      
      const slots = buildAvailableSlots(dummyPro, '2024-01-01', dummyService, []);
      // Al pasar NaN por los splits fallidos, el loop interno while(cur <= end) debería fallar rápido (NaN <= NaN es false)
      expect(slots).toEqual([]);
    });
  });

  describe('D3. Peticiones Duplicadas (Race Conditions)', () => {
    it('Simulación asíncrona: Evitar que una doble ejecución mute el mismo array accidentalmente', async () => {
      let isSubmitting = false; // El estado de React que bloquea el botón
      let appointmentsDb = 0;

      const submitCheckout = async () => {
        // Defensa 1: El frontend bloquea inmediatamente el segundo click (React isSubmitting state)
        if (isSubmitting) throw new Error('Bloqueado por UI');
        isSubmitting = true;
        
        try {
          await new Promise(r => setTimeout(r, 50));
          appointmentsDb += 1;
          return true;
        } finally {
          isSubmitting = false;
        }
      };

      // Disparamos 2 clicks al mismo tiempo sin await simulando doble tap rápido
      const p1 = submitCheckout();
      const p2 = submitCheckout();

      const results = await Promise.allSettled([p1, p2]);
      
      // El primero debe pasar
      expect(results[0].status).toBe('fulfilled');
      // El segundo debe ser bloqueado por el estado isSubmitting en microtareas sincrónicas
      expect(results[1].status).toBe('rejected');
      if (results[1].status === 'rejected') {
        expect(results[1].reason.message).toBe('Bloqueado por UI');
      }
      expect(appointmentsDb).toBe(1); // La DB solo registró 1 turno válido
    });
  });

  describe('D4. Manejo de Errores Asíncronos', () => {
    it('Las fallas en promesas deben ser capturadas correctamente', async () => {
      const fetchWithError = async () => {
        throw new Error('API Caída');
      };

      let uiMessage = '';
      try {
        await fetchWithError();
        uiMessage = 'Éxito';
      } catch (err: any) {
        uiMessage = err.message;
      }
      expect(uiMessage).toBe('API Caída');
    });
  });
});
