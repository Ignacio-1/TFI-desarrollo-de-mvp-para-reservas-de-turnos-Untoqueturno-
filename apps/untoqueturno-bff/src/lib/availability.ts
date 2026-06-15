export async function buildAvailableSlots(
  proId: string,
  dateISO: string,
  serviceId: string
): Promise<{ time: string; availableSpots: number }[]> {
  try {
    const url = `http://availability-service:3000/api/v1/availability?proId=${proId}&date=${dateISO}&serviceId=${serviceId}`;
    const response = await fetch(url, {
      headers: {
        'Accept': 'application/json'
      }
    });

    if (!response.ok) {
      return [];
    }

    const payload = await response.json();

    if (!payload || !Array.isArray(payload.data)) {
      return [];
    }

    return payload.data.map((slot: any) => ({
      time: String(slot.time),
      availableSpots: Number(slot.availableSpots || 0)
    }));

  } catch (error) {
    return [];
  }
}
