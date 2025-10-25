import { setupTestDB, teardownTestDB } from '../../../__tests__/setupDButils';
import { setupDateMock, restoreDateMock } from '../../../__tests__/dateMockUtils';
import db from 'models';
import MembershipMigrationService from '../membership-migration';
import { ProductType } from 'models/product';
import { EVENT_IDS } from '../../../constants/events';
import {
  createTestUser,
  createTestProduct,
  createTestPurchase,
} from '../../../__tests__/testUtils';

const testDate = '2023-02-01T00:00:00+09:00';

describe('Membership Migration Tests', () => {
  beforeEach(async () => {
    await db.User.deleteMany({});
    await db.Purchase.deleteMany({});
    await db.Product.deleteMany({});
  });

  beforeAll(async () => {
    setupDateMock(testDate);
    await setupTestDB();
  });

  afterAll(async () => {
    restoreDateMock();
    await teardownTestDB();
  });

  describe('일반 멤버십 마이그레이션', () => {
    beforeEach(async () => {
      // 일반 멤버십 상품 생성
      await createTestProduct({
        productId: 'regular_membership',
        type: ProductType.SUBSCRIPTION,
        displayName: '일반 멤버십',
        point: 30,
        aiPoint: 100,
        platform: 'ios',
        periodDate: 30,
        renewalPeriodDate: 30,
        eventId: null,
      });
    });

    it('구독이 없는 일반 유저는 처리되지 않는다', async () => {
      const user = await createTestUser({
        email: 'no_subscription@example.com',
        point: 100,
        aiPoint: 1000,
        MembershipAt: null,
        lastMembershipAt: null,
        MembershipExpiresAt: null,
        currentMembershipProductId: null,
      });

      const migrationService = new MembershipMigrationService(true);
      await migrationService.migrate();

      const updatedUser = await db.User.findById(user._id);
      expect(updatedUser?.MembershipAt).toBeNull();
      expect(updatedUser?.lastMembershipAt).toBeNull();
      expect(updatedUser?.MembershipExpiresAt).toBeNull();
      expect(updatedUser?.currentMembershipProductId).toBeNull();
    });

    // 구독 createdAt과 membershipAt이 다른 경우, 이거는 여러개일수도 있고, 아니면 그냥 오류일수도 있다.
    it('구독이 있는 멤버십 유저는 MembershipExpiresAt이 한달 뒤로 설정되고, currentMembershipProductId가 설정된다', async () => {
      const user = await createTestUser({
        email: 'with_subscription@example.com',
        point: 100,
        aiPoint: 1000,
        MembershipAt: new Date('2023-01-01T00:00:00.000Z'),
        lastMembershipAt: new Date('2023-01-01T00:00:00.000Z'),
        MembershipExpiresAt: null,
        currentMembershipProductId: null,
      });

      // 구독 생성 (createdAt: 2023-01-15)
      const product = await db.Product.findOne({ productId: 'regular_membership' });
      const purchase = await createTestPurchase({
        userId: user._id,
        productId: 'regular_membership',
        product,
        createdAt: new Date('2023-01-15T00:00:00.000Z'),
        isExpired: false,
      });

      const migrationService = new MembershipMigrationService(false); // 실제 실행
      await migrationService.migrate();

      const updatedUser = await db.User.findById(user._id);

      // MembershipExpiresAt은 createdAt + 1개월 = 2023-02-15
      const expectedExpiresAt = new Date('2023-02-15T00:00:00.000Z');
      expect(updatedUser?.MembershipExpiresAt?.getTime()).toBe(expectedExpiresAt.getTime());
      expect(updatedUser?.currentMembershipProductId).toBe('regular_membership');
    });

    it('이미 MembershipExpiresAt이 설정된 유저는 변경되지 않는다', async () => {
      const user = await createTestUser({
        email: 'already_set@example.com',
        point: 100,
        aiPoint: 1000,
        MembershipAt: new Date('2023-01-01T00:00:00.000Z'),
        lastMembershipAt: new Date('2023-01-01T00:00:00.000Z'),
        MembershipExpiresAt: new Date('2023-03-01T00:00:00.000Z'),
        currentMembershipProductId: 'regular_membership',
      });

      const migrationService = new MembershipMigrationService(false);
      await migrationService.migrate();

      const updatedUser = await db.User.findById(user._id);
      expect(updatedUser?.MembershipExpiresAt?.getTime()).toBe(
        new Date('2023-03-01T00:00:00.000Z').getTime()
      );
      expect(updatedUser?.currentMembershipProductId).toBe('regular_membership');
    });

    it('한 유저에 만료되지 않은 여러 멤버쉽 상품이 있는 경우, 처리를 건너뛴다.', async () => {
      const user = await createTestUser({
        email: 'multiple_memberships@example.com',
        point: 100,
        aiPoint: 1000,
        MembershipAt: new Date('2023-01-01T00:00:00.000Z'),
      });

      const product = await db.Product.findOne({ productId: 'regular_membership' });

      await createTestPurchase({
        userId: user._id,
        productId: 'regular_membership',
        product,
        createdAt: new Date('2023-01-15T00:00:00.000Z'),
        isExpired: false,
      });

      await createTestPurchase({
        userId: user._id,
        productId: 'regular_membership',
        product,
        createdAt: new Date('2023-01-15T00:00:00.000Z'),
        isExpired: false,
      });

      const migrationService = new MembershipMigrationService(false);
      await migrationService.migrate();

      const updatedUser = await db.User.findById(user._id);
      expect(updatedUser?.MembershipExpiresAt).toBeNull();
      expect(updatedUser?.currentMembershipProductId).toBeNull();
    });
  });

  describe('한시련 이벤트 멤버십 마이그레이션', () => {
    beforeEach(async () => {
      // 한시련 이벤트 상품 생성
      await createTestProduct({
        productId: 'hansiryun_event',
        type: ProductType.SUBSCRIPTION,
        displayName: '한시련 이벤트 멤버십',
        point: 50,
        aiPoint: 200,
        platform: 'ios',
        periodDate: 180,
        renewalPeriodDate: 180,
        eventId: EVENT_IDS.HANSIRYUN,
      });
    });

    it('2025년 9월 이전 신청자는 6개월 만료일이 설정된다', async () => {
      const user = await createTestUser({
        email: 'hansiryun_early@example.com',
        event: EVENT_IDS.HANSIRYUN,
        point: 100,
        aiPoint: 1000,
        MembershipAt: new Date('2025-08-01T00:00:00.000Z'), // 2025년 8월
        lastMembershipAt: new Date('2025-08-01T00:00:00.000Z'),
        MembershipExpiresAt: null,
        currentMembershipProductId: null,
      });

      const migrationService = new MembershipMigrationService(false); // 실제 실행
      await migrationService.migrate();

      const updatedUser = await db.User.findById(user._id);

      // 6개월 후 = 2026-02-01
      const expectedExpiresAt = new Date('2026-02-01T00:00:00.000Z');
      expect(updatedUser?.MembershipExpiresAt?.getTime()).toBe(expectedExpiresAt.getTime());
      expect(updatedUser?.currentMembershipProductId).toBe('hansiryun_event');
    });

    it('2025년 9월 이후 신청자는 1개월 만료일이 설정된다', async () => {
      const user = await createTestUser({
        email: 'hansiryun_late@example.com',
        event: EVENT_IDS.HANSIRYUN,
        point: 100,
        aiPoint: 1000,
        MembershipAt: new Date('2025-09-15T00:00:00.000Z'), // 2025년 9월
        lastMembershipAt: new Date('2025-09-15T00:00:00.000Z'),
        MembershipExpiresAt: null,
        currentMembershipProductId: null,
      });

      const migrationService = new MembershipMigrationService(false); // 실제 실행
      await migrationService.migrate();

      const updatedUser = await db.User.findById(user._id);

      // 1개월 후 = 2025-10-15
      const expectedExpiresAt = new Date('2025-10-15T00:00:00.000Z');
      expect(updatedUser?.MembershipExpiresAt?.getTime()).toBe(expectedExpiresAt.getTime());
      expect(updatedUser?.currentMembershipProductId).toBe('hansiryun_event');
    });

    it('한시련 이벤트가 아닌 유저는 처리되지 않는다', async () => {
      const user = await createTestUser({
        email: 'not_hansiryun@example.com',
        event: null,
        point: 100,
        aiPoint: 1000,
        MembershipAt: new Date('2025-08-01T00:00:00.000Z'),
        lastMembershipAt: new Date('2025-08-01T00:00:00.000Z'),
        MembershipExpiresAt: null,
        currentMembershipProductId: null,
      });

      const migrationService = new MembershipMigrationService(false);
      await migrationService.migrate();

      const updatedUser = await db.User.findById(user._id);
      expect(updatedUser?.MembershipExpiresAt).toBeNull();
      expect(updatedUser?.currentMembershipProductId).toBeNull();
    });
  });

  describe('픽포미 체험단 이벤트 멤버십 마이그레이션', () => {
    beforeEach(async () => {
      // 픽포미 체험단 이벤트 상품 생성
      await createTestProduct({
        productId: 'pickforme_test_event',
        type: ProductType.SUBSCRIPTION,
        displayName: '픽포미 체험단 이벤트 멤버십',
        point: 40,
        aiPoint: 150,
        platform: 'ios',
        periodDate: 90,
        renewalPeriodDate: 90,
        eventId: EVENT_IDS.PICKFORME_TEST,
      });
    });

    it('픽포미 체험단 이벤트 유저는 3개월 만료일이 설정된다', async () => {
      const user = await createTestUser({
        email: 'pickforme_test@example.com',
        event: EVENT_IDS.PICKFORME_TEST,
        point: 100,
        aiPoint: 1000,
        MembershipAt: new Date('2023-01-01T00:00:00.000Z'),
        lastMembershipAt: new Date('2023-01-01T00:00:00.000Z'),
        MembershipExpiresAt: null,
        currentMembershipProductId: null,
      });

      const migrationService = new MembershipMigrationService(false); // 실제 실행
      await migrationService.migrate();

      const updatedUser = await db.User.findById(user._id);

      // 3개월 후 = 2023-04-01
      const expectedExpiresAt = new Date('2023-04-01T00:00:00.000Z');
      expect(updatedUser?.MembershipExpiresAt?.getTime()).toBe(expectedExpiresAt.getTime());
      expect(updatedUser?.currentMembershipProductId).toBe('pickforme_test_event');
    });

    it('픽포미 체험단 이벤트가 아닌 유저는 처리되지 않는다', async () => {
      const user = await createTestUser({
        email: 'not_pickforme_test@example.com',
        event: null,
        point: 100,
        aiPoint: 1000,
        MembershipAt: new Date('2023-01-01T00:00:00.000Z'),
        lastMembershipAt: new Date('2023-01-01T00:00:00.000Z'),
        MembershipExpiresAt: null,
        currentMembershipProductId: null,
      });

      const migrationService = new MembershipMigrationService(false);
      await migrationService.migrate();

      const updatedUser = await db.User.findById(user._id);
      expect(updatedUser?.MembershipExpiresAt).toBeNull();
      expect(updatedUser?.currentMembershipProductId).toBeNull();
    });
  });
});
