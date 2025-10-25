// src/__tests__/dateMockUtils.ts
const RealDate = Date;

export function setupDateMock(testDate: string) {
  global.Date = class extends RealDate {
    constructor(date?: string | number | Date) {
      super();
      if (date === undefined) {
        return new RealDate(testDate);
      }
      return new RealDate(date);
    }
  } as unknown as DateConstructor;
}

export function restoreDateMock() {
  global.Date = RealDate;
}
