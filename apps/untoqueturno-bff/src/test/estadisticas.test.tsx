import { render, screen } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { Route } from '@/routes/$businessSlug/admin/estadisticas';

vi.mock('@/lib/queries', () => ({
  useBusiness: () => ({ data: { id: 'b1', name: 'Test Business' } }),
  useServices: () => ({ data: [
    { id: 's1', name: 'Corte', price: 1000 }
  ]}),
  useAppointments: () => ({ data: [
    {
      id: 'a1',
      date: new Date().toISOString().split('T')[0],
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
      date: new Date().toISOString().split('T')[0],
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
    const Component = Route.options.component as React.ElementType;
    render(<Component />);
    
    expect(screen.getAllByText('2').length).toBe(2);
    expect(screen.getAllByText(/\$\s*1\.000/).length).toBeGreaterThan(0);
  });

  it('debería mostrar el desglose en la tabla', () => {
    const Component = Route.options.component as React.ElementType;
    render(<Component />);
    
    expect(screen.getByText('Juan Perez')).toBeInTheDocument();
    expect(screen.getByText('Mixto (MP + Efectivo)')).toBeInTheDocument();
    expect(screen.getByText('Maria Gomez')).toBeInTheDocument();
    expect(screen.getByText('Pendiente')).toBeInTheDocument(); 
  });
});
