// Value Object: Inmutable, sin identidad propia, representa un rango horario
export class TimeRange {
  constructor(
    public readonly start: string, 
    public readonly end: string
  ) {
    if (start >= end) {
      throw new Error("Invariante violada: El horario de inicio debe ser anterior al de fin.");
    }
  }
}

// Aggregate Root: Entidad principal rica en dominio que protege invariantes y encapsula mutaciones
export class AgendaAggregate {
  private reservedSlots: Set<string>;

  constructor(
    public readonly businessId: string,
    public readonly professionalId: string,
    public readonly workingHours: TimeRange[],
    initialReservations: string[] = []
  ) {
    this.reservedSlots = new Set(initialReservations);
  }

  // Mutación de estado controlada por la Raíz de Agregado
  public reservarSlot(fechaHora: string): void {
    if (this.reservedSlots.has(fechaHora)) {
      throw new Error("Regla de Negocio violada: El slot ya se encuentra reservado o no está disponible.");
    }
    
    // Aquí el Guardián de la consistencia evalúa contra `workingHours` (TimeRange)
    // omitimos la lógica compleja de fechas para mantener la síntesis del MVP
    
    this.reservedSlots.add(fechaHora);
  }

  public getReservedSlots(): readonly string[] {
    return Array.from(this.reservedSlots);
  }
}
