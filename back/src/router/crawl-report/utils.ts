// utils.ts for crawl-report

/**
 * 타임존 유효성 검사
 */
export function isValidTimeZone(tz: string): boolean {
  try {
    new Intl.DateTimeFormat('en-US', { timeZone: tz }).format(new Date());
    return true;
  } catch {
    return false;
  }
}

/**
 * YYYY-MM-DD → 해당 타임존의 UTC 경계로 변환
 */
export function toZonedRange(tz: string, from?: string, to?: string) {
  const now = new Date();

  // 기본: 오늘 하루
  const baseFrom =
    from ?? new Intl.DateTimeFormat('en-CA', { timeZone: tz, dateStyle: 'short' }).format(now); // yyyy-mm-dd
  const baseTo = to ?? baseFrom;

  // 로컬 시작/끝(Date string → 현지 자정)
  const startLocal = new Date(`${baseFrom}T00:00:00`);
  const endLocal = new Date(`${baseTo}T23:59:59.999`);

  // 현지 시간을 해당 tz로 포맷 후, 그 순간의 UTC 시간을 역산하는 방식은 JS 단독으로 까다로워
  // MongoDB에서 타임존을 다룰 거라 여기선 '문자' 경계만 관리하고, 실제 필터는 $dateToString 로컬날짜와 비교함.
  // → createdAt 자체는 아래 파이프라인에서 tz 기준 로컬 날짜로 변환 후 필터되지 않고,
  //   여기서는 대략적 범위를 위한 넉넉한 UTC 가드만 둡니다.
  // 안전하게 과도 필터링을 피하기 위해 3일 버퍼(앞/뒤)를 둡니다.
  const guardStart = new Date(startLocal.getTime() - 3 * 86400000);
  const guardEnd = new Date(endLocal.getTime() + 3 * 86400000);

  return { baseFrom, baseTo, guardStart, guardEnd };
}

/**
 * 탭별 성공 판정 로직
 */
export function checkRequiredData(tab: string, product: Record<string, any>): boolean {
  switch (tab) {
    case 'CAPTION':
      return !!(product.name && product.thumbnail);
    case 'REPORT':
      return !!(product.name && product.detail_images);
    case 'REVIEW':
      return !!(product.name && product.reviews);
    default:
      return false;
  }
}
