const sar = new Intl.NumberFormat("ar-SA", { style: "currency", currency: "SAR", maximumFractionDigits: 2 });
const TZ = "Asia/Riyadh";
const dateFmt = new Intl.DateTimeFormat("ar-SA-u-ca-gregory", { dateStyle: "medium", timeZone: TZ });
const dateTimeFmt = new Intl.DateTimeFormat("ar-SA-u-ca-gregory", { dateStyle: "medium", timeStyle: "short", timeZone: TZ });

export const VAT_RATE = 0.15;

/** End of the current day in Riyadh (UTC+3, no DST), regardless of the server's zone. */
export function endOfTodayRiyadh() {
  const riyadh = new Date(Date.now() + 3 * 3600_000);
  riyadh.setUTCHours(23, 59, 59, 999);
  return new Date(riyadh.getTime() - 3 * 3600_000);
}

export const formatSAR = (n: number | string | null) => sar.format(Number(n ?? 0));
export const formatDate = (d: string | null) => (d ? dateFmt.format(new Date(d)) : "—");
export const formatDateTime = (d: string | null) => (d ? dateTimeFmt.format(new Date(d)) : "—");

/** Normalizes Saudi numbers to 9665XXXXXXXX; leaves other international numbers as digits. */
export function normalizePhone(raw: string | null | undefined): string | null {
  if (!raw) return null;
  const ar = "٠١٢٣٤٥٦٧٨٩";
  let d = raw.replace(/[٠-٩]/g, (c) => String(ar.indexOf(c))).replace(/\D/g, "");
  if (!d) return null;
  if (d.startsWith("00")) d = d.slice(2);
  if (d.startsWith("05") && d.length === 10) d = "966" + d.slice(1);
  else if (d.startsWith("5") && d.length === 9) d = "966" + d;
  return d;
}

export function waLink(phone: string | null, text: string) {
  const p = normalizePhone(phone);
  return `https://wa.me/${p ?? ""}?text=${encodeURIComponent(text)}`;
}
