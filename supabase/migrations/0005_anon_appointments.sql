-- Dar permisos a usuarios anónimos (sin iniciar sesión)
GRANT SELECT, INSERT, UPDATE ON public.appointments TO anon;

-- Política para que anónimos puedan crear turnos
CREATE POLICY "appointments: anon crea" ON public.appointments
  FOR INSERT TO anon WITH CHECK (true);

-- Política para que anónimos puedan ver sus turnos
CREATE POLICY "appointments: anon ver" ON public.appointments
  FOR SELECT TO anon USING (true);

-- Política para que anónimos puedan cancelar sus turnos
CREATE POLICY "appointments: anon cancela" ON public.appointments
  FOR UPDATE TO anon USING (true);
