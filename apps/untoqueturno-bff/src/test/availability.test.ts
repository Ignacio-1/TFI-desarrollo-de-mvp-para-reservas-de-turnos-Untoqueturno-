import { describe, it, expect, vi, beforeEach } from 'vitest';
import { buildAvailableSlots } from '@/lib/availability';

// Simulamos la respuesta de fetch globalmente
global.fetch = vi.fn();

describe('Disponibilidad BFF - Interacción con Microservicio', () => {
  beforeEach(() => {
    vi.resetAllMocks();
  });

  it('debería retornar los slots obtenidos del microservicio', async () => {
    const mockSlots = [
      { time: '09:00', availableSpots: 1 },
      { time: '09:30', availableSpots: 1 }
    ];

    (global.fetch as any).mockResolvedValueOnce({
      ok: true,
      json: async () => ({ source: 'database', data: mockSlots })
    });

    const result = await buildAvailableSlots('p1', '2024-01-01', 's1');
    expect(result).toEqual(mockSlots);
    expect(global.fetch).toHaveBeenCalledWith(
      'http://availability-service:3000/api/v1/availability?proId=p1&date=2024-01-01&serviceId=s1',
      expect.any(Object)
    );
  });

  it('debería retornar vacío si la respuesta HTTP no es ok', async () => {
    (global.fetch as any).mockResolvedValueOnce({
      ok: false,
      status: 500
    });

    const result = await buildAvailableSlots('p1', '2024-01-01', 's1');
    expect(result).toEqual([]);
  });

  it('debería retornar vacío si el payload es inválido o no tiene array data', async () => {
    (global.fetch as any).mockResolvedValueOnce({
      ok: true,
      json: async () => ({ source: 'database', data: null })
    });

    const result = await buildAvailableSlots('p1', '2024-01-01', 's1');
    expect(result).toEqual([]);
  });

  it('debería manejar errores de red o excepciones sin romper (Defensivo)', async () => {
    (global.fetch as any).mockRejectedValueOnce(new Error('Network Error'));

    const result = await buildAvailableSlots('p1', '2024-01-01', 's1');
    expect(result).toEqual([]);
  });
});
