/** 간단 타임존 유효성 */
export function isValidTimeZone(tz: string) {
  try {
    Intl.DateTimeFormat(undefined, { timeZone: tz });
    return true;
  } catch {
    return false;
  }
}

/** YYYY-MM-DD 문자열 */
export function fmtYMD(d: Date, tz: string) {
  return new Intl.DateTimeFormat('en-CA', {
    timeZone: tz,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(d);
}

/** tz, from, to로 안전한 범위 계산 (최대 30일, 양끝 포함) */
export function toZonedRange(tz: string, from?: string, to?: string) {
  const now = new Date();
  const todayYMD = fmtYMD(now, tz);

  const baseFrom = from || todayYMD;
  const baseTo = to || todayYMD;

  // 30일 가드
  const fromDate = new Date(`${baseFrom}T00:00:00.000Z`);
  const toDate = new Date(`${baseTo}T00:00:00.000Z`);
  const diffMs = toDate.getTime() - fromDate.getTime();
  const max = 30 * 24 * 3600 * 1000;
  if (diffMs > max) {
    throw new Error('Range too large (max 30 days)');
  }

  // guardStart/End: UTC 기준으로 넉넉히 잡고, 이후 localDate로 재거름
  const guardStart = new Date(fromDate);
  const guardEnd = new Date(toDate.getTime() + (24 * 3600 * 1000 - 1)); // to 23:59:59.999

  return { baseFrom, baseTo, guardStart, guardEnd };
}
