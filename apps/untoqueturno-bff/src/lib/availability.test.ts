import { describe, it, expect, vi, beforeEach } from 'vitest';
import { buildAvailableSlots } from './availability';

// Simulamos la respuesta de fetch globalmente
global.fetch = vi.fn();

describe('Availability Engine (BFF)', () => {
  beforeEach(() => {
    vi.resetAllMocks();
  });

  it('debería retornar todos los slots si no hay turnos ocupados', async () => {
    const mockSlots = [
      { time: '09:00', availableSpots: 1 },
      { time: '09:30', availableSpots: 1 },
      { time: '10:00', availableSpots: 1 },
      { time: '10:30', availableSpots: 1 },
      { time: '11:00', availableSpots: 1 },
      { time: '11:30', availableSpots: 1 }
    ];

    (global.fetch as any).mockResolvedValueOnce({
      ok: true,
      json: async () => ({ source: 'database', data: mockSlots })
    });

    const result = await buildAvailableSlots('p1', '2024-01-01', 's1');
    expect(result).toEqual(mockSlots);
  });

  it('debería filtrar los slots ocupados', async () => {
    const mockSlots = [
      { time: '09:00', availableSpots: 1 },
      { time: '09:30', availableSpots: 1 },
      { time: '10:30', availableSpots: 1 },
      { time: '11:00', availableSpots: 1 },
      { time: '11:30', availableSpots: 1 }
    ];

    (global.fetch as any).mockResolvedValueOnce({
      ok: true,
      json: async () => ({ source: 'database', data: mockSlots })
    });

    const result = await buildAvailableSlots('p1', '2024-01-01', 's1');
    expect(result).toEqual(mockSlots);
  });

  it('debería incluir los slots de turnos cancelados', async () => {
    const mockSlots = [
      { time: '09:00', availableSpots: 1 },
      { time: '09:30', availableSpots: 1 },
      { time: '10:00', availableSpots: 1 },
      { time: '10:30', availableSpots: 1 },
      { time: '11:00', availableSpots: 1 },
      { time: '11:30', availableSpots: 1 }
    ];
    (global.fetch as any).mockResolvedValueOnce({
      ok: true,
      json: async () => ({ source: 'database', data: mockSlots })
    });
    const result = await buildAvailableSlots('p1', '2024-01-01', 's1');
    expect(result).toEqual(mockSlots);
  });

  it('debería generar los slots correctos para un servicio de 45 minutos', async () => {
    const mockSlots = [
      { time: '09:00', availableSpots: 1 },
      { time: '09:45', availableSpots: 1 },
      { time: '10:30', availableSpots: 1 },
      { time: '11:15', availableSpots: 1 }
    ];
    (global.fetch as any).mockResolvedValueOnce({
      ok: true,
      json: async () => ({ source: 'database', data: mockSlots })
    });
    const result = await buildAvailableSlots('p1', '2024-01-01', 's1');
    expect(result).toEqual(mockSlots);
  });

  it('debería soportar capacidad múltiple', async () => {
    const mockSlots = [
      { time: '09:00', availableSpots: 2 },
      { time: '09:30', availableSpots: 2 },
      { time: '10:00', availableSpots: 1 },
      { time: '10:30', availableSpots: 2 },
      { time: '11:00', availableSpots: 2 },
      { time: '11:30', availableSpots: 2 }
    ];
    (global.fetch as any).mockResolvedValueOnce({
      ok: true,
      json: async () => ({ source: 'database', data: mockSlots })
    });
    const result = await buildAvailableSlots('p1', '2024-01-01', 's1');
    expect(result).toEqual(mockSlots);
  });

  it('debería retornar vacío si el profesional no atiende ese día', async () => {
    (global.fetch as any).mockResolvedValueOnce({ ok: true, json: async () => ({ data: [] }) });
    const result = await buildAvailableSlots('p1', '2024-01-02', 's1');
    expect(result).toEqual([]);
  });

  describe('Casos de Abuso y Límites (Edge Cases)', () => {
    it('debería manejar una fecha corrupta retornando vacío sin romper', async () => {
      (global.fetch as any).mockResolvedValueOnce({ ok: true, json: async () => ({ data: [] }) });
      const result = await buildAvailableSlots('p1', 'FECHA-CORRUPTA', 's1');
      expect(result).toEqual([]);
    });

    it('debería manejar duration_min en 0 o negativo sin caer en bucle infinito', async () => {
      const mockSlots = [
        { time: '09:00', availableSpots: 1 },
        { time: '09:30', availableSpots: 1 },
        { time: '10:00', availableSpots: 1 },
        { time: '10:30', availableSpots: 1 },
        { time: '11:00', availableSpots: 1 },
        { time: '11:30', availableSpots: 1 }
      ];
      (global.fetch as any).mockResolvedValueOnce({ ok: true, json: async () => ({ data: mockSlots }) });
      const result = await buildAvailableSlots('p1', '2024-01-01', 's1');
      expect(result).toHaveLength(6);
      expect(result[0].time).toBe('09:00');
    });

    it('debería manejar un profesional sin horarios definidos correctamente', async () => {
      (global.fetch as any).mockResolvedValueOnce({ ok: true, json: async () => ({ data: [] }) });
      const result = await buildAvailableSlots('p1', '2024-01-01', 's1');
      expect(result).toEqual([]);
    });
  });
});
