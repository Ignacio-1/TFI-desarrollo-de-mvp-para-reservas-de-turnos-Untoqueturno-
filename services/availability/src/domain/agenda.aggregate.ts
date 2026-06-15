export class TimeRange {
  constructor(
    public readonly start: string, 
    public readonly end: string
  ) {
    if (start >= end) {
      throw new Error("El horario de inicio debe ser anterior al de fin.");
    }
  }
}

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

  public reservarSlot(fechaHora: string): void {
    if (this.reservedSlots.has(fechaHora)) {
      throw new Error("El slot ya se encuentra reservado o no está disponible.");
    }
    
    this.reservedSlots.add(fechaHora);
  }

  public getReservedSlots(): readonly string[] {
    return Array.from(this.reservedSlots);
  }
}
