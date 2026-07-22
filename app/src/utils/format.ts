export function fmtCOP(n: number | null | undefined): string {
  return '$' + Number(n || 0).toLocaleString('es-CO');
}

export function fmtFecha(iso: string): string {
  const d = new Date(iso);
  return (
    d.toLocaleDateString('es-CO') +
    ' ' +
    d.toLocaleTimeString('es-CO', { hour: '2-digit', minute: '2-digit' })
  );
}

/** "AAAA-MM-DD" en hora local, listo para un <input type="date">. */
export function dateInputValue(d: Date): string {
  const yyyy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, '0');
  const dd = String(d.getDate()).padStart(2, '0');
  return `${yyyy}-${mm}-${dd}`;
}

/** Convierte un timestamp ISO a "AAAA-MM-DD" en hora local, para comparar contra un filtro de fecha. */
export function isoToDateInputValue(iso: string): string {
  return dateInputValue(new Date(iso));
}
