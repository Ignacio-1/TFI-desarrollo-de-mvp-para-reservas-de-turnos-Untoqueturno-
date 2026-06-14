/**
 * Capa Perimetral BFF (Backend For Frontend)
 * Patrón: Tolerant Reader
 * 
 * Intermediario que actúa como fachada para el cliente de React. Invoca al
 * microservicio de disponibilidad mediante REST y filtra el payload.
 */
export async function buildAvailableSlots(
  proId: string,
  dateISO: string,
  serviceId: string
): Promise<{ time: string; availableSpots: number }[]> {
  try {
    // 1. Enrutamiento Síncrono: Solicitud explícita HTTP/REST al Microservicio
    const url = `http://availability-service:3000/api/v1/availability?proId=${proId}&date=${dateISO}&serviceId=${serviceId}`;
    const response = await fetch(url, {
      headers: {
        'Accept': 'application/json'
      }
    });

    if (!response.ok) {
      console.warn(`[BFF] El microservicio respondió con error HTTP ${response.status}`);
      return [];
    }

    const payload = await response.json();

    // 2. Patrón Tolerant Reader: Extraemos ÚNICAMENTE las propiedades requeridas por la UI.
    // Ignoramos metadatos como 'generated_at', 'server_id', '_links', etc., para minimizar 
    // el acoplamiento y hacer que la capa web no se rompa ante la evolución de la API.
    if (!payload || !Array.isArray(payload.data)) {
      return [];
    }

    return payload.data.map((slot: any) => ({
      time: String(slot.time),
      availableSpots: Number(slot.availableSpots || 0)
    }));

  } catch (error) {
    console.error("[BFF] Falla crítica de comunicación con Infraestructura (Microservicio caído):", error);
    return [];
  }
}
