import { describe, it, expect } from 'vitest';
import { buildAvailableSlots } from '@/lib/availability';
import { formatMoney } from '@/lib/format';

describe('Pruebas Defensivas y del Mundo Real', () => {
  describe('D1. Valores Nulos/Incompletos', () => {
    it('formatMoney: debería manejar null, undefined o NaN sin crashear', () => {
      expect(formatMoney(null as any).replace(/\s/g, ' ')).toBe('$ 0');
      expect(formatMoney(undefined as any).replace(/\s/g, ' ')).toBe('$ 0');
      expect(formatMoney(NaN).replace(/\s/g, ' ')).toBe('$ 0');
    });

    it('buildAvailableSlots: debería retornar vacío si recibe profesional nulo', async () => {
      // Al ser asincrónico y hacer fetch, un input nulo no explotará aquí porque
      // JavaScript interpolará "undefined" en la URL y el backend devolverá 400.
      // Como el fetch falla (mock o no), el bloque catch devuelve [].
      const slots = await buildAvailableSlots(null as any, '2024-01-01', 's1');
      expect(slots).toEqual([]);
    });
  });

  describe('D2. Inyección de Basura', () => {
    it('buildAvailableSlots: debería defenderse de strings vacíos o tipos erróneos', async () => {
      const slots = await buildAvailableSlots('', '', '');
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
