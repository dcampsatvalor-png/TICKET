export type PeriodPreset = "today" | "7d" | "30d" | "month" | "custom";
export type BucketGranularity = "day" | "week" | "month";

export type DateRange = {
  from: Date;
  to: Date;
  preset: PeriodPreset;
};

const MADRID = "Europe/Madrid";

/** YYYY-MM-DD in Europe/Madrid */
export function madridDateKey(date: Date | string): string {
  const d = typeof date === "string" ? new Date(date) : date;
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: MADRID,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(d);
}

export function parseDateInput(value: string | undefined): Date | null {
  if (!value || !/^\d{4}-\d{2}-\d{2}$/.test(value)) return null;
  const [y, m, d] = value.split("-").map(Number);
  // Noon UTC avoids DST edge flips when converting to Madrid calendar day
  return new Date(Date.UTC(y, m - 1, d, 12, 0, 0));
}

function startOfMadridDay(date: Date): Date {
  const key = madridDateKey(date);
  const [y, m, d] = key.split("-").map(Number);
  // Approximate start of Madrid day as 00:00 Madrid ≈ previous evening UTC in winter;
  // for filtering we use inclusive ISO bounds built from local calendar keys.
  return new Date(Date.UTC(y, m - 1, d, 0, 0, 0));
}

function endOfMadridDay(date: Date): Date {
  const key = madridDateKey(date);
  const [y, m, d] = key.split("-").map(Number);
  return new Date(Date.UTC(y, m - 1, d, 23, 59, 59, 999));
}

export function resolveDateRange(input: {
  preset?: string;
  from?: string;
  to?: string;
}): DateRange {
  const now = new Date();
  const todayKey = madridDateKey(now);
  const today = parseDateInput(todayKey)!;

  const preset = (["today", "7d", "30d", "month", "custom"] as PeriodPreset[]).includes(
    input.preset as PeriodPreset
  )
    ? (input.preset as PeriodPreset)
    : "30d";

  if (preset === "custom") {
    const from = parseDateInput(input.from) ?? startOfMadridDay(new Date(now.getTime() - 29 * 86400000));
    const to = parseDateInput(input.to) ?? today;
    const a = from <= to ? from : to;
    const b = from <= to ? to : from;
    return { from: startOfMadridDay(a), to: endOfMadridDay(b), preset };
  }

  if (preset === "today") {
    return { from: startOfMadridDay(today), to: endOfMadridDay(today), preset };
  }

  if (preset === "7d") {
    const from = new Date(today.getTime() - 6 * 86400000);
    return { from: startOfMadridDay(from), to: endOfMadridDay(today), preset };
  }

  if (preset === "month") {
    const [y, m] = todayKey.split("-").map(Number);
    const from = parseDateInput(`${y}-${String(m).padStart(2, "0")}-01`)!;
    return { from: startOfMadridDay(from), to: endOfMadridDay(today), preset };
  }

  // 30d default
  const from = new Date(today.getTime() - 29 * 86400000);
  return { from: startOfMadridDay(from), to: endOfMadridDay(today), preset };
}

export function parseGranularity(value: string | undefined): BucketGranularity {
  if (value === "week" || value === "month" || value === "day") return value;
  return "day";
}

/** ISO week key YYYY-Www (Madrid calendar day of the timestamp). */
export function weekBucketKey(date: Date | string): string {
  const key = madridDateKey(date);
  const [y, m, d] = key.split("-").map(Number);
  const utc = new Date(Date.UTC(y, m - 1, d));
  const day = utc.getUTCDay() || 7;
  utc.setUTCDate(utc.getUTCDate() + 4 - day);
  const yearStart = new Date(Date.UTC(utc.getUTCFullYear(), 0, 1));
  const week = Math.ceil(((utc.getTime() - yearStart.getTime()) / 86400000 + 1) / 7);
  return `${utc.getUTCFullYear()}-W${String(week).padStart(2, "0")}`;
}

export function monthBucketKey(date: Date | string): string {
  return madridDateKey(date).slice(0, 7);
}

export function bucketKey(
  date: Date | string,
  granularity: BucketGranularity
): string {
  if (granularity === "week") return weekBucketKey(date);
  if (granularity === "month") return monthBucketKey(date);
  return madridDateKey(date);
}

export function enumerateBuckets(
  from: Date,
  to: Date,
  granularity: BucketGranularity
): string[] {
  const keys: string[] = [];
  const seen = new Set<string>();
  const cursor = new Date(from);
  while (cursor.getTime() <= to.getTime()) {
    const key = bucketKey(cursor, granularity);
    if (!seen.has(key)) {
      seen.add(key);
      keys.push(key);
    }
    cursor.setUTCDate(cursor.getUTCDate() + 1);
  }
  return keys;
}

export function formatBucketLabel(key: string, granularity: BucketGranularity): string {
  if (granularity === "month") {
    const [y, m] = key.split("-").map(Number);
    return new Intl.DateTimeFormat("es-ES", {
      month: "short",
      year: "numeric",
      timeZone: MADRID,
    }).format(new Date(Date.UTC(y, m - 1, 15)));
  }
  if (granularity === "week") {
    return key.replace("-W", " · S");
  }
  const [y, m, d] = key.split("-").map(Number);
  return new Intl.DateTimeFormat("es-ES", {
    day: "numeric",
    month: "short",
    timeZone: MADRID,
  }).format(new Date(Date.UTC(y, m - 1, d, 12)));
}

export function formatRangeLabel(from: Date, to: Date): string {
  const fmt = new Intl.DateTimeFormat("es-ES", {
    day: "numeric",
    month: "short",
    year: "numeric",
    timeZone: MADRID,
  });
  return `${fmt.format(from)} – ${fmt.format(to)}`;
}
