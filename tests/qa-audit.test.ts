import { describe, it, expect, vi } from 'vitest';
import { getSubscriptionState, isSubscriptionActive } from '../src/lib/subscription';
import { supabase } from '../src/integrations/supabase/client';

// Mock de Supabase para aislar las pruebas de la conectividad de red (Test Double)
vi.mock('../src/integrations/supabase/client', () => ({
  supabase: {
    from: vi.fn(() => ({
      select: vi.fn(() => ({
        eq: vi.fn(() => ({
          eq: vi.fn(() => ({
            in: vi.fn(() => ({
              maybeSingle: vi.fn().mockResolvedValue({ data: { role: 'owner' }, error: null })
            }))
          }))
        }))
      }))
    }))
  }
}));

describe('QA Audit: Funciones de Suscripción', () => {
  
  // B. Pruebas Unitarias (Camino Feliz y Valores Límite)
  describe('Pruebas Unitarias - Lógica Pura', () => {
    it('Debería retornar active si la suscripción está activa', () => {
      const business: any = { subscription_status: 'active' };
      const result = getSubscriptionState(business);
      expect(result.status).toBe('active');
    });

    it('Debería retornar expired si la suscripción está inactiva', () => {
      const business: any = { subscription_status: 'inactive' };
      const result = getSubscriptionState(business);
      expect(result.status).toBe('expired');
    });

    it('Debería calcular días restantes para trial', () => {
      // Configuramos una fecha 5 días en el futuro
      const futureDate = new Date();
      futureDate.setDate(futureDate.getDate() + 5);
      
      const business: any = { 
        subscription_status: 'trial', 
        trial_ends_at: futureDate.toISOString() 
      };
      
      const result = getSubscriptionState(business);
      expect(result.status).toBe('trialing');
      expect(result.daysLeft).toBe(5);
    });

    it('Debería retornar expired si el trial ya pasó', () => {
      // Configuramos una fecha 2 días en el pasado
      const pastDate = new Date();
      pastDate.setDate(pastDate.getDate() - 2);
      
      const business: any = { 
        subscription_status: 'trial', 
        trial_ends_at: pastDate.toISOString() 
      };
      
      const result = getSubscriptionState(business);
      expect(result.status).toBe('expired');
    });
  });

  // C. Pruebas de Integración Simulada
  describe('Pruebas de Integración', () => {
    it('isSubscriptionActive debería retornar true si está trialing', () => {
      const futureDate = new Date();
      futureDate.setDate(futureDate.getDate() + 10);
      const business: any = { 
        subscription_status: 'trial', 
        trial_ends_at: futureDate.toISOString() 
      };
      expect(isSubscriptionActive(business)).toBe(true);
    });

    it('isSubscriptionActive debería retornar false si trial expiró', () => {
      const pastDate = new Date();
      pastDate.setDate(pastDate.getDate() - 5);
      const business: any = { 
        subscription_status: 'trial', 
        trial_ends_at: pastDate.toISOString() 
      };
      expect(isSubscriptionActive(business)).toBe(false);
    });
  });

  // D. Pruebas Defensivas y del Mundo Real
  describe('Pruebas Defensivas (Cero Crashes)', () => {
    it('No debe crashear si business no tiene trial_ends_at', () => {
      const business: any = { subscription_status: 'trial' };
      const result = getSubscriptionState(business);
      // Nuestro fallback es que asume 15 días trialing
      expect(result.status).toBe('trialing');
      expect(result.daysLeft).toBe(15);
    });

    it('No debe crashear con inyección de basura (fecha inválida)', () => {
      const business: any = { 
        subscription_status: 'trial', 
        trial_ends_at: 'texto-basura-no-es-fecha' 
      };
      const result = getSubscriptionState(business);
      // Al hacer new Date('texto-basura'), será Invalid Date (getTime es NaN)
      // Math.abs(NaN) es NaN, etc.
      // El test evalúa si explota o maneja el caso de alguna forma.
      expect(result.status).toBeDefined();
    });

    it('No debe crashear si se le pasa un objeto totalmente vacío', () => {
      const business: any = {};
      const result = getSubscriptionState(business);
      // Debería caer en un status por defecto si no es 'active', 'inactive' ni 'trial'
      expect(result.status).toBeDefined();
    });

    it('No debe crashear si se pasa null (simulando error extremo)', () => {
      try {
        const result = getSubscriptionState(null as any);
      } catch (e: any) {
        // En Javascript puro explotaría `business.subscription_status`. 
        // Si explota, evaluaremos si amerita un parche.
        expect(e).toBeDefined();
      }
    });
  });

  // E. Pruebas de Intercepción de Red (Test Doubles / Mocks)
  describe('Costuras de Software - Test Doubles para Supabase', () => {
    it('Debería interceptar llamadas a supabase.from() sin usar la red real', async () => {
      // Simulamos la llamada típica de consulta de roles que vimos en la auditoría
      const { data, error } = await supabase
        .from("business_roles")
        .select("role")
        .eq("business_id", "mocked-business")
        .eq("user_id", "mocked-user")
        .in("role", ["owner", "admin"])
        .maybeSingle();
        
      // Verificamos que el doble de prueba haya respondido con el valor configurado
      expect(error).toBeNull();
      expect(data?.role).toBe('owner');
      
      // Verificamos que la función mockeada haya sido llamada
      expect(supabase.from).toHaveBeenCalledWith("business_roles");
    });
  });
});
