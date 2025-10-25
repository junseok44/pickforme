import { setupTestDB, teardownTestDB } from '../../../__tests__/setupDButils';
import db from 'models';
import { EVENT_IDS } from '../../../constants/events';
import { processUser, membershipChangedUsers } from '../pickforme_test_user';
import { restoreDateMock, setupDateMock } from '../../../__tests__/dateMockUtils';

interface FormResponse {
  timestamp: string;
  name: string;
  phoneNumber: string;
  email: string;
  membershipProcessed: string;
  rowIndex: number;
  activityStarted: string;
}

// Mock Google Sheets API
const mockSheets = {
  spreadsheets: {
    values: {
      update: jest.fn().mockResolvedValue({}),
    },
  },
};

const testDate = '2023-02-01T00:00:00+09:00';

describe('Pickforme Test User Script Tests', () => {
  beforeAll(async () => {
    setupDateMock(testDate);
    await setupTestDB();
  });

  afterAll(async () => {
    restoreDateMock();

    await teardownTestDB();
  });

  beforeEach(async () => {
    await db.User.deleteMany({});
    await db.Product.deleteMany({});
    jest.clearAllMocks();
    // membershipChangedUsers 배열 초기화
    membershipChangedUsers.length = 0;
  });

  describe('멤버십이 아예 없는 유저', () => {
    it('멤버십이 없는 유저에게 이벤트 멤버십을 적용한다', async () => {
      // 테스트용 이벤트 상품 생성
      const eventProduct = await db.Product.create({
        productId: 'pickforme_test_event',
        type: 1, // SUBSCRIPTION
        displayName: '픽포미 체험단 이벤트',
        point: 50,
        aiPoint: 200,
        platform: 'ios',
        periodDate: 90, // 3개월
        eventId: EVENT_IDS.PICKFORME_TEST,
      });

      const eventRewards = eventProduct.getEventRewards();

      // 멤버십이 없는 유저 생성
      const user = await db.User.create({
        email: 'no_membership@example.com',
        phone: '01012345678',
        point: 10,
        aiPoint: 10,
      });

      const formResponse: FormResponse = {
        timestamp: '2023-01-01',
        name: '테스트유저1',
        phoneNumber: '010-1234-5678',
        email: 'no_membership@example.com',
        membershipProcessed: '',
        rowIndex: 0,
        activityStarted: 'o',
      };

      await processUser(formResponse, eventRewards, mockSheets, 'test-spreadsheet-id', false);

      // 유저 상태 검증
      const updatedUser = await db.User.findById(user._id);
      expect(updatedUser?.event).toBe(EVENT_IDS.PICKFORME_TEST);
      expect(updatedUser?.point).toBe(50); // 이벤트 상품의 포인트로 교체
      expect(updatedUser?.aiPoint).toBe(200); // 이벤트 상품의 AI 포인트로 교체
      expect(updatedUser?.MembershipAt).toBeDefined();
      expect(updatedUser?.MembershipExpiresAt).toBeDefined();
      expect(updatedUser?.currentMembershipProductId).toBe('pickforme_test_event');

      // 스프레드시트 업데이트 확인
      expect(mockSheets.spreadsheets.values.update).toHaveBeenCalledWith({
        spreadsheetId: 'test-spreadsheet-id',
        range: '설문지 응답 시트1!K2',
        valueInputOption: 'RAW',
        requestBody: {
          values: [['o']],
        },
      });

      // 멤버십 변경 추적 확인 (멤버십이 없던 유저는 변경 추적에 포함되지 않음)
      expect(membershipChangedUsers).toHaveLength(0);
    });
  });

  describe('일반 멤버십 적용 중인 유저', () => {
    it('일반 멤버십 중인 유저에게 이벤트 멤버십을 적용한다', async () => {
      // 테스트용 이벤트 상품 생성
      const eventProduct = await db.Product.create({
        productId: 'pickforme_test_event',
        type: 1,
        displayName: '픽포미 체험단 이벤트',
        point: 50,
        aiPoint: 200,
        platform: 'ios',
        periodDate: 90,
        eventId: EVENT_IDS.PICKFORME_TEST,
      });

      // 일반 멤버십 상품 생성
      const regularProduct = await db.Product.create({
        productId: 'regular_membership',
        type: 1,
        displayName: '일반 멤버십',
        point: 30,
        aiPoint: 100,
        platform: 'ios',
        periodDate: 30,
        renewalPeriodDate: 30,
      });

      const eventRewards = eventProduct.getEventRewards();

      // 일반 멤버십을 가진 유저 생성 (event 필드가 없음)
      const user = await db.User.create({
        email: 'regular_membership@example.com',
        phone: '01012345679',
        point: 30,
        aiPoint: 100,
        MembershipAt: new Date('2023-01-01'),
        MembershipExpiresAt: new Date('2023-01-31'),
        currentMembershipProductId: 'regular_membership',
      });

      const formResponse: FormResponse = {
        timestamp: '2023-01-15',
        name: '테스트유저2',
        phoneNumber: '010-1234-5679',
        email: 'regular_membership@example.com',
        membershipProcessed: '',
        rowIndex: 1,
        activityStarted: 'o',
      };

      await processUser(formResponse, eventRewards, mockSheets, 'test-spreadsheet-id', false);

      // 유저 상태 검증
      const updatedUser = await db.User.findById(user._id);
      expect(updatedUser?.event).toBe(EVENT_IDS.PICKFORME_TEST);
      expect(updatedUser?.point).toBe(50); // 이벤트 상품의 포인트로 교체
      expect(updatedUser?.aiPoint).toBe(200); // 이벤트 상품의 AI 포인트로 교체
      expect(updatedUser?.MembershipAt).toBeDefined();
      expect(updatedUser?.MembershipExpiresAt).toBeDefined();
      expect(updatedUser?.currentMembershipProductId).toBe('pickforme_test_event');

      // 멤버십 변경 추적 확인
      expect(membershipChangedUsers).toHaveLength(1);
      expect(membershipChangedUsers[0]).toMatchObject({
        userId: user._id.toString(),
        email: 'regular_membership@example.com',
        username: '테스트유저2',
        action: '일반 멤버십 중 - 바로 적용',
      });
      expect(membershipChangedUsers[0].previousEventId).toBeUndefined();
      expect(membershipChangedUsers[0].previousMembershipAt).toBeDefined();
      expect(membershipChangedUsers[0].previousExpiresAt).toBeDefined();
      expect(membershipChangedUsers[0].newExpiresAt).toBeDefined();
    });
  });

  describe('이벤트 멤버십 적용 중인데 더 긴 경우', () => {
    it('기존 이벤트 멤버십보다 긴 기간의 이벤트 멤버십을 적용한다', async () => {
      // 기존 이벤트 상품 생성 (짧은 기간)
      const oldEventProduct = await db.Product.create({
        productId: 'old_event',
        type: 1,
        displayName: '기존 이벤트',
        point: 20,
        aiPoint: 50,
        platform: 'ios',
        periodDate: 30,
        eventId: 999, // 다른 이벤트 ID
      });

      // 새로운 이벤트 상품 생성 (긴 기간)
      const newEventProduct = await db.Product.create({
        productId: 'pickforme_test_event',
        type: 1,
        displayName: '픽포미 체험단 이벤트',
        point: 50,
        aiPoint: 200,
        platform: 'ios',
        periodDate: 90,
        eventId: EVENT_IDS.PICKFORME_TEST,
      });

      const eventRewards = newEventProduct.getEventRewards();

      // 기존 이벤트 멤버십을 가진 유저 생성
      const user = await db.User.create({
        email: 'existing_event@example.com',
        phone: '01012345680',
        point: 20,
        aiPoint: 50,
        event: 999,
        MembershipAt: new Date('2023-01-01'),
        MembershipExpiresAt: new Date('2023-01-31'), // 1개월 후 만료
        currentMembershipProductId: 'old_event',
      });

      const formResponse: FormResponse = {
        timestamp: '2023-01-15',
        name: '테스트유저3',
        phoneNumber: '010-1234-5680',
        email: 'existing_event@example.com',
        membershipProcessed: '',
        rowIndex: 2,
        activityStarted: 'o',
      };

      await processUser(formResponse, eventRewards, mockSheets, 'test-spreadsheet-id', false);

      // 유저 상태 검증
      const updatedUser = await db.User.findById(user._id);
      expect(updatedUser?.event).toBe(EVENT_IDS.PICKFORME_TEST);
      expect(updatedUser?.point).toBe(50); // 새로운 이벤트 상품의 포인트로 교체
      expect(updatedUser?.aiPoint).toBe(200); // 새로운 이벤트 상품의 AI 포인트로 교체
      expect(updatedUser?.MembershipAt).toBeDefined();
      expect(updatedUser?.MembershipExpiresAt).toBeDefined();
      expect(updatedUser?.currentMembershipProductId).toBe('pickforme_test_event');

      // 멤버십 변경 추적 확인
      expect(membershipChangedUsers).toHaveLength(1);
      expect(membershipChangedUsers[0]).toMatchObject({
        userId: user._id.toString(),
        email: 'existing_event@example.com',
        username: '테스트유저3',
        action: expect.stringContaining('이벤트 멤버십 중 - 기존 만료일'),
      });
      expect(membershipChangedUsers[0].previousEventId).toBe(999);
      expect(membershipChangedUsers[0].previousMembershipAt).toBeDefined();
      expect(membershipChangedUsers[0].previousExpiresAt).toBeDefined();
      expect(membershipChangedUsers[0].newExpiresAt).toBeDefined();
    });
  });

  describe('이벤트 멤버십 적용 중인데 더 짧은 경우', () => {
    it('기존 이벤트 멤버십보다 짧은 기간의 이벤트 멤버십은 적용하지 않는다', async () => {
      // 기존 이벤트 상품 생성 (긴 기간)
      const oldEventProduct = await db.Product.create({
        productId: 'old_event_long',
        type: 1,
        displayName: '기존 이벤트 (긴 기간)',
        point: 20,
        aiPoint: 50,
        platform: 'ios',
        periodDate: 180, // 6개월
        eventId: 999,
      });

      // 새로운 이벤트 상품 생성 (짧은 기간)
      const newEventProduct = await db.Product.create({
        productId: 'pickforme_test_event',
        type: 1,
        displayName: '픽포미 체험단 이벤트',
        point: 50,
        aiPoint: 200,
        platform: 'ios',
        periodDate: 30, // 1개월
        eventId: EVENT_IDS.PICKFORME_TEST,
      });
      const eventRewards = newEventProduct.getEventRewards();

      // 기존 이벤트 멤버십을 가진 유저 생성 (긴 기간)
      const user = await db.User.create({
        email: 'existing_event_long@example.com',
        phone: '01012345681',
        point: 20,
        aiPoint: 50,
        event: 999,
        MembershipAt: new Date('2023-01-01'),
        MembershipExpiresAt: new Date('2023-07-01'), // 6개월 후 만료
        currentMembershipProductId: 'old_event_long',
      });

      const formResponse: FormResponse = {
        timestamp: '2023-01-15',
        name: '테스트유저4',
        phoneNumber: '010-1234-5681',
        email: 'existing_event_long@example.com',
        membershipProcessed: '',
        rowIndex: 3,
        activityStarted: 'o',
      };

      await processUser(formResponse, eventRewards, mockSheets, 'test-spreadsheet-id', false);

      // 유저 상태 검증 (변경되지 않아야 함)
      const updatedUser = await db.User.findById(user._id);
      expect(updatedUser?.event).toBe(999); // 기존 이벤트 ID 유지
      expect(updatedUser?.point).toBe(20); // 기존 포인트 유지
      expect(updatedUser?.aiPoint).toBe(50); // 기존 AI 포인트 유지
      expect(updatedUser?.MembershipAt?.getTime()).toBe(user.MembershipAt?.getTime());
      expect(updatedUser?.MembershipExpiresAt?.getTime()).toBe(user.MembershipExpiresAt?.getTime());
      expect(updatedUser?.currentMembershipProductId).toBe('old_event_long');

      // 스프레드시트 업데이트가 호출되지 않아야 함
      expect(mockSheets.spreadsheets.values.update).not.toHaveBeenCalled();

      // 멤버십 변경 추적 확인 (변경되지 않았으므로 비어있어야 함)
      expect(membershipChangedUsers).toHaveLength(0);
    });
  });

  describe('이미 처리된 유저', () => {
    it('이미 처리된 유저는 다시 처리하지 않는다', async () => {
      const eventProduct = await db.Product.create({
        productId: 'pickforme_test_event',
        type: 1,
        displayName: '픽포미 체험단 이벤트',
        point: 50,
        aiPoint: 200,
        platform: 'ios',
        periodDate: 90,
        eventId: EVENT_IDS.PICKFORME_TEST,
      });

      const eventRewards = eventProduct.getEventRewards();

      // 이미 픽포미 테스트 이벤트를 받은 유저 생성
      const user = await db.User.create({
        email: 'already_processed@example.com',
        phone: '01012345682',
        point: 50,
        aiPoint: 200,
        event: EVENT_IDS.PICKFORME_TEST,
        MembershipAt: new Date('2023-01-01'),
        MembershipExpiresAt: new Date('2023-04-01'),
        currentMembershipProductId: 'pickforme_test_event',
      });

      const formResponse: FormResponse = {
        timestamp: '2023-01-15',
        name: '테스트유저5',
        phoneNumber: '010-1234-5682',
        email: 'already_processed@example.com',
        membershipProcessed: '',
        rowIndex: 4,
        activityStarted: 'o',
      };

      await processUser(formResponse, eventRewards, mockSheets, 'test-spreadsheet-id', false);

      // 유저 상태 검증 (변경되지 않아야 함)
      const updatedUser = await db.User.findById(user._id);
      expect(updatedUser?.event).toBe(EVENT_IDS.PICKFORME_TEST);
      expect(updatedUser?.point).toBe(50);
      expect(updatedUser?.aiPoint).toBe(200);

      // 스프레드시트 업데이트가 호출되지 않아야 함
      expect(mockSheets.spreadsheets.values.update).not.toHaveBeenCalled();

      // 멤버십 변경 추적 확인 (이미 처리되었으므로 비어있어야 함)
      expect(membershipChangedUsers).toHaveLength(0);
    });

    it('스프레드시트에서 이미 처리된 것으로 표시된 유저는 처리하지 않는다', async () => {
      const eventProduct = await db.Product.create({
        productId: 'pickforme_test_event',
        type: 1,
        displayName: '픽포미 체험단 이벤트',
        point: 50,
        aiPoint: 200,
        platform: 'ios',
        periodDate: 90,
        eventId: EVENT_IDS.PICKFORME_TEST,
      });

      const eventRewards = eventProduct.getEventRewards();

      const user = await db.User.create({
        email: 'spreadsheet_processed@example.com',
        phone: '01012345683',
        point: 10,
        aiPoint: 10,
      });

      const formResponse: FormResponse = {
        timestamp: '2023-01-15',
        name: '테스트유저6',
        phoneNumber: '010-1234-5683',
        email: 'spreadsheet_processed@example.com',
        membershipProcessed: 'o', // 이미 처리됨으로 표시
        rowIndex: 5,
        activityStarted: 'o',
      };

      await processUser(formResponse, eventRewards, mockSheets, 'test-spreadsheet-id', false);

      // 유저 상태 검증 (변경되지 않아야 함)
      const updatedUser = await db.User.findById(user._id);
      expect(updatedUser?.event).toBe(null);
      expect(updatedUser?.point).toBe(10);
      expect(updatedUser?.aiPoint).toBe(10);

      // 스프레드시트 업데이트가 호출되지 않아야 함
      expect(mockSheets.spreadsheets.values.update).not.toHaveBeenCalled();

      // 멤버십 변경 추적 확인 (이미 처리되었으므로 비어있어야 함)
      expect(membershipChangedUsers).toHaveLength(0);
    });
  });

  describe('DRY RUN 모드', () => {
    it('DRY RUN 모드에서는 실제 변경 없이 로직만 테스트한다', async () => {
      const eventProduct = await db.Product.create({
        productId: 'pickforme_test_event',
        type: 1,
        displayName: '픽포미 체험단 이벤트',
        point: 50,
        aiPoint: 200,
        platform: 'ios',
        periodDate: 90,
        eventId: EVENT_IDS.PICKFORME_TEST,
      });

      const eventRewards = eventProduct.getEventRewards();

      const user = await db.User.create({
        email: 'dry_run_test@example.com',
        phone: '01012345684',
        point: 10,
        aiPoint: 10,
      });

      const formResponse: FormResponse = {
        timestamp: '2023-01-15',
        name: '테스트유저7',
        phoneNumber: '010-1234-5684',
        email: 'dry_run_test@example.com',
        membershipProcessed: '',
        rowIndex: 6,
        activityStarted: 'o',
      };

      await processUser(formResponse, eventRewards, mockSheets, 'test-spreadsheet-id', true); // DRY RUN

      // 유저 상태 검증 (DRY RUN이므로 변경되지 않아야 함)
      const updatedUser = await db.User.findById(user._id);
      expect(updatedUser?.event).toBe(null);
      expect(updatedUser?.point).toBe(10);
      expect(updatedUser?.aiPoint).toBe(10);
      expect(updatedUser?.MembershipAt).toBe(null);
      expect(updatedUser?.MembershipExpiresAt).toBe(null);

      // 스프레드시트 업데이트가 호출되지 않아야 함
      expect(mockSheets.spreadsheets.values.update).not.toHaveBeenCalled();

      // 멤버십 변경 추적 확인 (DRY RUN이므로 비어있어야 함)
      expect(membershipChangedUsers).toHaveLength(0);
    });
  });
});
