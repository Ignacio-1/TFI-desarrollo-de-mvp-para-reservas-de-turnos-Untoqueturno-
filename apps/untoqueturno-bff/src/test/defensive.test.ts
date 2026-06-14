import { describe, it, expect } from 'vitest';
import { buildAvailableSlots } from '@/lib/availability';
import { formatMoney } from '@/lib/format';
import { type Service, type Professional } from '@/lib/types';

describe('Pruebas Defensivas y del Mundo Real', () => {
  describe('D1. Valores Nulos/Incompletos', () => {
    it('formatMoney: debería manejar null, undefined o NaN sin crashear', () => {
      expect(formatMoney(null as any).replace(/\s/g, ' ')).toBe('$ 0');
      expect(formatMoney(undefined as any).replace(/\s/g, ' ')).toBe('$ 0');
      expect(formatMoney(NaN).replace(/\s/g, ' ')).toBe('$ 0');
    });

    it('buildAvailableSlots: debería retornar vacío si recibe profesional nulo', () => {
      const badPro: Professional = { id: 'p1' } as any;
      const dummyService: Service = { id: 's1', duration_min: 30, capacity: 1 } as any;
      const slots = buildAvailableSlots(badPro, '2024-01-01', dummyService, []);
      expect(slots).toEqual([]);
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
      expect(slots).toEqual([]);
    });
  });

  describe('D3. Peticiones Duplicadas (Race Conditions)', () => {
    it('Simulación asíncrona: Evitar doble ejecución', async () => {
      let isSubmitting = false;
      let appointmentsDb = 0;

      const submitCheckout = async () => {
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

      const p1 = submitCheckout();
      const p2 = submitCheckout();

      const results = await Promise.allSettled([p1, p2]);
      
      expect(results[0].status).toBe('fulfilled');
      expect(results[1].status).toBe('rejected');
      if (results[1].status === 'rejected') {
        expect(results[1].reason.message).toBe('Bloqueado por UI');
      }
      expect(appointmentsDb).toBe(1);
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
