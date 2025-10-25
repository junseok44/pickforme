import { PopupService } from '../popup.service';
import db from 'models';
import mongoose from 'mongoose';
import { setupTestDB, teardownTestDB } from '../../__tests__/setupDButils';

const RealDate = Date;
const testDate = '2024-01-15T12:00:00+09:00';

describe('PopupService Integration Tests', () => {
  beforeEach(async () => {
    await db.Popup.deleteMany({});
    await db.User.deleteMany({});
  });

  beforeAll(async () => {
    global.Date = class extends RealDate {
      constructor(date?: string | number | Date) {
        super();
        if (date === undefined) {
          return new RealDate(testDate);
        }
        return new RealDate(date);
      }
    } as unknown as DateConstructor;

    jest.spyOn(Date, 'now').mockImplementation(() => new RealDate(testDate).getTime());

    await setupTestDB();
  });

  afterAll(async () => {
    global.Date = RealDate;
    await teardownTestDB();
  });

  describe('getActivePopups', () => {
    it('무제한 팝업, 기간 내 팝업, 기간 외 팝업이 있을 때 올바른 활성 팝업만 반환해야 합니다', async () => {
      // Given
      const today = new Date();
      const yesterday = new Date(today.getTime() - 24 * 60 * 60 * 1000);
      const tomorrow = new Date(today.getTime() + 24 * 60 * 60 * 1000);
      const dayAfterTomorrow = new Date(today.getTime() + 2 * 24 * 60 * 60 * 1000);

      // 무제한 팝업 (기간 없음)
      const unlimitedPopup = await db.Popup.create({
        popup_id: 'unlimited_popup',
        title: '무제한 팝업',
        description: '기간이 없는 팝업',
        startDate: null,
        endDate: null,
      });

      // 기간 내 팝업 (오늘 날짜 포함)
      const activePopup = await db.Popup.create({
        popup_id: 'active_popup',
        title: '활성 팝업',
        description: '오늘 날짜가 포함된 팝업',
        startDate: yesterday,
        endDate: tomorrow,
      });

      // 기간 외 팝업 (오늘 날짜 미포함 - 이미 종료)
      const expiredPopup = await db.Popup.create({
        popup_id: 'expired_popup',
        title: '만료된 팝업',
        description: '이미 종료된 팝업',
        startDate: new Date(yesterday.getTime() - 24 * 60 * 60 * 1000),
        endDate: yesterday,
      });

      // 기간 외 팝업 (오늘 날짜 미포함 - 아직 시작 안됨)
      const futurePopup = await db.Popup.create({
        popup_id: 'future_popup',
        title: '미래 팝업',
        description: '아직 시작되지 않은 팝업',
        startDate: dayAfterTomorrow,
        endDate: new Date(dayAfterTomorrow.getTime() + 24 * 60 * 60 * 1000),
      });

      // When
      const result = await PopupService.getActivePopups();

      // Then
      expect(result).toHaveLength(2);

      const popupIds = result.map((popup) => popup.popup_id);
      expect(popupIds).toContain('unlimited_popup');
      expect(popupIds).toContain('active_popup');
      expect(popupIds).not.toContain('expired_popup');
      expect(popupIds).not.toContain('future_popup');
    });

    it('KST 시간대를 올바르게 처리해야 합니다', async () => {
      // Given
      // 현재 시간이 2024-01-15 12:00:00 UTC (2024-01-15 21:00:00 KST)로 설정됨
      // KST 기준으로 정확히 오늘에 해당하는 팝업
      const kstStart = new Date('2024-01-15T12:00:00.000Z'); // 2024-01-15 21:00:00 KST
      const kstEnd = new Date('2024-01-15T15:00:00.000Z'); // 2024-01-16 00:00:00 KST

      const kstPopup = await db.Popup.create({
        popup_id: 'kst_popup',
        title: 'KST 팝업',
        description: 'KST 시간대 테스트 팝업',
        startDate: kstStart,
        endDate: kstEnd,
      });

      // When
      const result = await PopupService.getActivePopups();

      // Then
      expect(result).toHaveLength(1);
      expect(result[0].popup_id).toBe('kst_popup');
    });

    it('startDate와 endDate가 모두 null인 무제한 팝업을 반환해야 합니다', async () => {
      // Given
      const unlimitedPopup1 = await db.Popup.create({
        popup_id: 'unlimited1',
        title: '무제한 팝업 1',
        description: 'startDate와 endDate가 null',
        startDate: null,
        endDate: null,
      });

      const unlimitedPopup2 = await db.Popup.create({
        popup_id: 'unlimited2',
        title: '무제한 팝업 2',
        description: 'startDate와 endDate가 undefined',
        // startDate와 endDate를 아예 설정하지 않음
      });

      // When
      const result = await PopupService.getActivePopups();

      // Then
      expect(result).toHaveLength(2);
      const popupIds = result.map((popup) => popup.popup_id);
      expect(popupIds).toContain('unlimited1');
      expect(popupIds).toContain('unlimited2');
    });

    it('시작 날짜만 있는 팝업을 반환해야 합니다', async () => {
      // Given
      const today = new Date();
      const yesterday = new Date(today.getTime() - 24 * 60 * 60 * 1000);

      const startOnlyPopup = await db.Popup.create({
        popup_id: 'start_only_popup',
        title: '시작 날짜만 있는 팝업',
        description: '시작 날짜만 지정된 팝업',
        startDate: yesterday,
        endDate: null,
      });

      // When
      const result = await PopupService.getActivePopups();

      // Then
      expect(result).toHaveLength(1);
      expect(result[0].popup_id).toBe('start_only_popup');
    });

    it('종료 날짜만 있는 팝업을 반환해야 합니다', async () => {
      // Given
      const today = new Date();
      const tomorrow = new Date(today.getTime() + 24 * 60 * 60 * 1000);

      const endOnlyPopup = await db.Popup.create({
        popup_id: 'end_only_popup',
        title: '종료 날짜만 있는 팝업',
        description: '종료 날짜만 지정된 팝업',
        startDate: null,
        endDate: tomorrow,
      });

      // When
      const result = await PopupService.getActivePopups();

      // Then
      expect(result).toHaveLength(1);
      expect(result[0].popup_id).toBe('end_only_popup');
    });

    it('시작 날짜가 미래인 팝업은 반환하지 않아야 합니다', async () => {
      // Given
      const today = new Date();
      const tomorrow = new Date(today.getTime() + 24 * 60 * 60 * 1000);

      const futureStartPopup = await db.Popup.create({
        popup_id: 'future_start_popup',
        title: '미래 시작 팝업',
        description: '시작 날짜가 미래인 팝업',
        startDate: tomorrow,
        endDate: null,
      });

      // When
      const result = await PopupService.getActivePopups();

      // Then
      expect(result).toHaveLength(0);
    });

    it('종료 날짜가 과거인 팝업은 반환하지 않아야 합니다', async () => {
      // Given
      const today = new Date();
      const yesterday = new Date(today.getTime() - 24 * 60 * 60 * 1000);

      const pastEndPopup = await db.Popup.create({
        popup_id: 'past_end_popup',
        title: '과거 종료 팝업',
        description: '종료 날짜가 과거인 팝업',
        startDate: null,
        endDate: yesterday,
      });

      // When
      const result = await PopupService.getActivePopups();

      // Then
      expect(result).toHaveLength(0);
    });
  });

  describe('getActivePopupsForUser', () => {
    it('사용자가 숨기지 않은 활성 팝업만 반환해야 합니다', async () => {
      // Given
      const today = new Date();
      const yesterday = new Date(today.getTime() - 24 * 60 * 60 * 1000);
      const tomorrow = new Date(today.getTime() + 24 * 60 * 60 * 1000);

      // 팝업 생성
      const unlimitedPopup = await db.Popup.create({
        popup_id: 'unlimited_popup',
        title: '무제한 팝업',
        description: '기간이 없는 팝업',
        startDate: null,
        endDate: null,
      });

      const activePopup = await db.Popup.create({
        popup_id: 'active_popup',
        title: '활성 팝업',
        description: '오늘 날짜가 포함된 팝업',
        startDate: yesterday,
        endDate: tomorrow,
      });

      const hiddenPopup = await db.Popup.create({
        popup_id: 'hidden_popup',
        title: '숨겨진 팝업',
        description: '사용자가 숨긴 팝업',
        startDate: null,
        endDate: null,
      });

      // 사용자 생성 (hidden_popup을 숨김)
      const user = await db.User.create({
        email: 'test@example.com',
        hide: ['hidden_popup'],
      });

      // When
      const result = await PopupService.getActivePopupsForUser(user._id.toString());

      // Then
      expect(result).toHaveLength(2);
      const popupIds = result.map((popup) => popup.popup_id);
      expect(popupIds).toContain('unlimited_popup');
      expect(popupIds).toContain('active_popup');
      expect(popupIds).not.toContain('hidden_popup');
    });

    it('사용자가 존재하지 않으면 에러를 던져야 합니다', async () => {
      // Given
      const nonExistentUserId = new mongoose.Types.ObjectId().toString();

      // When & Then
      await expect(PopupService.getActivePopupsForUser(nonExistentUserId)).rejects.toThrow(
        '사용자를 찾을 수 없습니다.'
      );
    });

    it('사용자의 hide 배열이 없으면 모든 활성 팝업을 반환해야 합니다', async () => {
      // Given
      const unlimitedPopup = await db.Popup.create({
        popup_id: 'unlimited_popup',
        title: '무제한 팝업',
        description: '기간이 없는 팝업',
        startDate: null,
        endDate: null,
      });

      const activePopup = await db.Popup.create({
        popup_id: 'active_popup',
        title: '활성 팝업',
        description: '오늘 날짜가 포함된 팝업',
        startDate: new Date(Date.now() - 24 * 60 * 60 * 1000),
        endDate: new Date(Date.now() + 24 * 60 * 60 * 1000),
      });

      // hide 배열이 없는 사용자 생성
      const user = await db.User.create({
        email: 'test@example.com',
        // hide 필드를 설정하지 않음
      });

      // When
      const result = await PopupService.getActivePopupsForUser(user._id.toString());

      // Then
      expect(result).toHaveLength(2);
      const popupIds = result.map((popup) => popup.popup_id);
      expect(popupIds).toContain('unlimited_popup');
      expect(popupIds).toContain('active_popup');
    });
  });

  describe('createPopup', () => {
    it('시작 날짜만 있는 팝업을 생성할 수 있어야 합니다', async () => {
      // Given
      const today = new Date();
      const tomorrow = new Date(today.getTime() + 24 * 60 * 60 * 1000);

      const popupData = {
        popup_id: 'start_only_test',
        title: '시작 날짜만 있는 테스트 팝업',
        description: '시작 날짜만 지정된 팝업',
        startDate: tomorrow.toISOString(),
      };

      // When
      const result = await PopupService.createPopup(popupData);

      // Then
      expect(result.popup_id).toBe('start_only_test');
      expect(result.startDate).toBeDefined();
      expect(result.endDate).toBeUndefined();
    });

    it('종료 날짜만 있는 팝업을 생성할 수 있어야 합니다', async () => {
      // Given
      const today = new Date();
      const tomorrow = new Date(today.getTime() + 24 * 60 * 60 * 1000);

      const popupData = {
        popup_id: 'end_only_test',
        title: '종료 날짜만 있는 테스트 팝업',
        description: '종료 날짜만 지정된 팝업',
        endDate: tomorrow.toISOString(),
      };

      // When
      const result = await PopupService.createPopup(popupData);

      // Then
      expect(result.popup_id).toBe('end_only_test');
      expect(result.startDate).toBeUndefined();
      expect(result.endDate).toBeDefined();
    });

    it('시작 날짜와 종료 날짜가 모두 있는 팝업을 생성할 수 있어야 합니다', async () => {
      // Given
      const today = new Date();
      const tomorrow = new Date(today.getTime() + 24 * 60 * 60 * 1000);
      const dayAfterTomorrow = new Date(today.getTime() + 2 * 24 * 60 * 60 * 1000);

      const popupData = {
        popup_id: 'both_dates_test',
        title: '시작과 종료 날짜가 모두 있는 테스트 팝업',
        description: '시작과 종료 날짜가 모두 지정된 팝업',
        startDate: tomorrow.toISOString(),
        endDate: dayAfterTomorrow.toISOString(),
      };

      // When
      const result = await PopupService.createPopup(popupData);

      // Then
      expect(result.popup_id).toBe('both_dates_test');
      expect(result.startDate).toBeDefined();
      expect(result.endDate).toBeDefined();
    });

    it('날짜가 없는 무제한 팝업을 생성할 수 있어야 합니다', async () => {
      // Given
      const popupData = {
        popup_id: 'no_dates_test',
        title: '날짜가 없는 테스트 팝업',
        description: '날짜가 지정되지 않은 무제한 팝업',
      };

      // When
      const result = await PopupService.createPopup(popupData);

      // Then
      expect(result.popup_id).toBe('no_dates_test');
      expect(result.startDate).toBeUndefined();
      expect(result.endDate).toBeUndefined();
    });

    it('시작 날짜가 종료 날짜보다 늦으면 에러를 던져야 합니다', async () => {
      // Given
      const today = new Date();
      const tomorrow = new Date(today.getTime() + 24 * 60 * 60 * 1000);
      const yesterday = new Date(today.getTime() - 24 * 60 * 60 * 1000);

      const popupData = {
        popup_id: 'invalid_dates_test',
        title: '잘못된 날짜 순서 팝업',
        description: '시작 날짜가 종료 날짜보다 늦은 팝업',
        startDate: tomorrow.toISOString(),
        endDate: yesterday.toISOString(),
      };

      // When & Then
      await expect(PopupService.createPopup(popupData)).rejects.toThrow(
        '시작 날짜는 종료 날짜보다 이전이어야 합니다.'
      );
    });
  });
});
