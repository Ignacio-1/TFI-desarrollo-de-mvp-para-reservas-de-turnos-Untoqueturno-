export const formatMoney = (n: number | null | undefined) => {
  const safeNumber = Number(n) || 0;
  return new Intl.NumberFormat("es-AR", {
    style: "currency",
    currency: "ARS",
    maximumFractionDigits: 0,
  }).format(safeNumber);
};

export const todayISO = () => new Date().toISOString().slice(0, 10);

export function formatDateLong(iso: string) {
  return new Date(iso + "T00:00:00").toLocaleDateString("es-AR", {
    weekday: "long",
    day: "numeric",
    month: "long",
  });
}

export function formatDateShort(iso: string) {
  const d = new Date(iso + "T00:00:00");
  return `${String(d.getDate()).padStart(2, '0')}/${String(d.getMonth() + 1).padStart(2, '0')}/${d.getFullYear()}`;
}
