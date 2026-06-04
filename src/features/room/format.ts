const pad = (n: number) => ('0' + n).slice(-2)

export function fmtTime(ts: number): string {
  const d = new Date(ts)
  return `${pad(d.getHours())}:${pad(d.getMinutes())}`
}

/** Clave de día (YYYY-MM-DD local) para agrupar el hilo por jornada. */
export function dayKey(ts: number): string {
  const d = new Date(ts)
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`
}

export function isToday(ts: number): boolean {
  return dayKey(ts) === dayKey(Date.now())
}
