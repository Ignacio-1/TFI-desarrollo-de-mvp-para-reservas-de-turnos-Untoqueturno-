import { render, screen } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
// Importamos el componente (tenemos que hacer un hack para exportarlo para tests o usar la ruta completa si es exported)
import { Route } from '@/routes/$businessSlug/admin/estadisticas';

// Mock de las dependencias
vi.mock('@/lib/queries', () => ({
  useBusiness: () => ({ data: { id: 'b1', name: 'Test Business' } }),
  useServices: () => ({ data: [
    { id: 's1', name: 'Corte', price: 1000 }
  ]}),
  useAppointments: () => ({ data: [
    {
      id: 'a1',
      date: new Date().toISOString().split('T')[0], // Hoy
      time: '10:00:00',
      service_id: 's1',
      client_name: 'Juan Perez',
      client_phone: '12345678',
      status: 'confirmed',
      is_paid: true,
      payments: [
        { method: 'mercadopago', status: 'approved', amount: 500 }
      ]
    },
    {
      id: 'a2',
      date: new Date().toISOString().split('T')[0], // Hoy
      time: '11:00:00',
      service_id: 's1',
      client_name: 'Maria Gomez',
      client_phone: '87654321',
      status: 'confirmed',
      is_paid: false,
      payments: [
        { method: 'cash', status: 'pending', amount: 1000 }
      ]
    }
  ]})
}));

describe('Panel de Estadisticas', () => {
  it('debería calcular correctamente los ingresos mixtos y totales', () => {
    // Si Juan pagó 500 por MP pero el servicio sale 1000 y está is_paid=true, debería sumar 1000.
    // Si Maria no está is_paid y pagará en local, sumó 0 por ahora a ingresos del día.
    // En total ingresosDelDia = 1000.
    // Turnos totales = 2.
    // Clientes nuevos = 2.
    
    // Renderizamos el componente
    const Component = Route.options.component as React.ElementType;
    render(<Component />);
    
    // Verifica métricas
    expect(screen.getAllByText('2').length).toBe(2); // Turnos Totales y Clientes Nuevos
    // Dependiendo de la locale, Intl.NumberFormat puede devolver $ 1.000 o $ 1.000,00
    // Usamos una regex flexible
    expect(screen.getAllByText(/\$\s*1\.000/).length).toBeGreaterThan(0); // Ingresos del día
  });

  it('debería mostrar el desglose en la tabla', () => {
    const Component = Route.options.component as React.ElementType;
    render(<Component />);
    
    // Verificamos tabla
    expect(screen.getByText('Juan Perez')).toBeInTheDocument();
    expect(screen.getByText('Mixto (MP + Efectivo)')).toBeInTheDocument();
    expect(screen.getByText('Maria Gomez')).toBeInTheDocument();
    expect(screen.getByText('Pendiente')).toBeInTheDocument(); 
  });
});
