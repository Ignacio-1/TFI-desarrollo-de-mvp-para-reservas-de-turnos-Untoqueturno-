-- Permitir a usuarios autenticados (como el dueño probando la app) crear turnos
-- sin necesidad de que el client_id coincida con su auth.uid()
CREATE POLICY "appointments: auth crea sin id" ON public.appointments
  FOR INSERT TO authenticated WITH CHECK (true);

-- También asegurarnos de que el staff pueda ver e insertar si es necesario
CREATE POLICY "appointments: staff inserta" ON public.appointments
  FOR INSERT TO authenticated WITH CHECK (public.has_business_role(business_id, array['owner','admin']::public.business_role[]));
