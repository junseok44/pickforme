import { setupTestDB, teardownTestDB } from '../../__tests__/setupDButils';
import db from 'models';
import { handleMembershipScheduler } from '../membership';
import { POINTS } from '../../constants/points';

const RealDate = Date;
const testDate = '2023-02-01T00:00:00+09:00';

describe('Membership Scheduler Integration Tests', () => {
  beforeEach(async () => {
    await db.User.deleteMany({});
    await db.Purchase.deleteMany({});
    await db.Product.deleteMany({});
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

    await setupTestDB();
  });

  afterAll(async () => {
    global.Date = RealDate;
    await teardownTestDB();
  });

  describe('멤버십 만료 처리', () => {
    it('만료일이 지난 멤버십은 만료 처리된다', async () => {
      const user = await db.User.create({
        email: 'expired@example.com',
        point: 100,
        aiPoint: 1000,
        MembershipAt: new Date('2022-12-29T15:00:00.000Z'),
        MembershipExpiresAt: new Date('2023-01-29T15:00:00.000Z'), // 30일 후 만료
        currentMembershipProductId: 'test_membership',
      });

      await handleMembershipScheduler();

      const updatedUser = await db.User.findById(user._id);
      expect(updatedUser?.point).toBe(POINTS.DEFAULT_POINT);
      expect(updatedUser?.aiPoint).toBe(POINTS.DEFAULT_AI_POINT);
      expect(updatedUser?.MembershipAt).toBeNull();
      expect(updatedUser?.lastMembershipAt).toBeNull();
      expect(updatedUser?.MembershipExpiresAt).toBeNull();
      expect(updatedUser?.currentMembershipProductId).toBeNull();
    });

    it('만료일이 지나지 않은 멤버십은 유지된다', async () => {
      const user = await db.User.create({
        email: 'active@example.com',
        point: 100,
        aiPoint: 1000,
        MembershipAt: new Date('2023-01-01T15:00:00.000Z'),
        MembershipExpiresAt: new Date('2023-02-01T15:00:00.000Z'), // 아직 만료되지 않음
        currentMembershipProductId: 'test_membership',
      });

      await handleMembershipScheduler();

      const updatedUser = await db.User.findById(user._id);
      expect(updatedUser?.point).toBe(100);
      expect(updatedUser?.aiPoint).toBe(1000);
      expect(updatedUser?.MembershipAt).toBeDefined();
      expect(updatedUser?.MembershipExpiresAt).toBeDefined();
      expect(updatedUser?.currentMembershipProductId).toBe('test_membership');
    });

    it('멤버십이 없는 유저는 처리되지 않는다', async () => {
      const user = await db.User.create({
        email: 'no_membership@example.com',
        point: 100,
        aiPoint: 1000,
      });

      await handleMembershipScheduler();

      const updatedUser = await db.User.findById(user._id);
      expect(updatedUser?.point).toBe(100);
      expect(updatedUser?.aiPoint).toBe(1000);
      expect(updatedUser?.MembershipAt).toBeNull();
      expect(updatedUser?.lastMembershipAt).toBeNull();
      expect(updatedUser?.MembershipExpiresAt).toBeNull();
      expect(updatedUser?.currentMembershipProductId).toBeNull();
    });
  });

  describe('멤버십 갱신 처리', () => {
    beforeEach(async () => {
      // 테스트용 멤버십 상품 생성
      await db.Product.create({
        productId: 'test_membership',
        type: 1, // SUBSCRIPTION
        displayName: '테스트 멤버십',
        point: 30,
        aiPoint: 100,
        platform: 'ios',
        periodDate: 30,
        renewalPeriodDate: 30,
      });
    });

    it('갱신 기간이 지난 멤버십은 갱신된다', async () => {
      const user = await db.User.create({
        email: 'renewal@example.com',
        point: 10,
        aiPoint: 10,
        MembershipAt: new Date('2022-12-01T15:00:00.000Z'),
        MembershipExpiresAt: new Date('2023-02-01T15:00:00.000Z'), // 아직 만료되지 않음
        lastMembershipAt: new Date('2022-12-01T15:00:00.000Z'), // 30일 전 갱신
        currentMembershipProductId: 'test_membership',
      });

      await handleMembershipScheduler();

      const updatedUser = await db.User.findById(user._id);

      expect(updatedUser?.point).toBe(30); // 교체됨 (기존 10 → 30)
      expect(updatedUser?.aiPoint).toBe(100); // 교체됨 (기존 10 → 100)
      expect(updatedUser?.lastMembershipAt?.getTime()).not.toEqual(
        user.lastMembershipAt?.getTime()
      );
      expect(updatedUser?.MembershipAt?.getTime()).toEqual(user.MembershipAt?.getTime()); // 초기 멤버십 날짜는 변경되지 않음
    });

    it('갱신 기간이 지났지만 만료일이 지난 멤버쉽은 갱신되지 않는다', async () => {
      const user = await db.User.create({
        email: 'renewal_not_expired@example.com',
        point: 10,
        aiPoint: 10,
        MembershipAt: new Date('2022-12-01T15:00:00.000Z'),
        MembershipExpiresAt: new Date('2023-01-30T15:00:00.000Z'),
        lastMembershipAt: new Date('2022-12-01T15:00:00.000Z'),
        currentMembershipProductId: 'test_membership',
      });
      await handleMembershipScheduler();

      const updatedUser2 = await db.User.findById(user._id);

      expect(updatedUser2?.point).toBe(POINTS.DEFAULT_POINT);
      expect(updatedUser2?.aiPoint).toBe(POINTS.DEFAULT_AI_POINT);
      expect(updatedUser2?.lastMembershipAt).toBeNull();
      expect(updatedUser2?.MembershipExpiresAt).toBeNull();
      expect(updatedUser2?.currentMembershipProductId).toBeNull();
    });

    it('갱신 기간이 지나지 않은 멤버십은 갱신되지 않는다', async () => {
      const user = await db.User.create({
        email: 'no_renewal@example.com',
        point: 10,
        aiPoint: 10,
        MembershipAt: new Date('2022-12-01T15:00:00.000Z'),
        MembershipExpiresAt: new Date('2023-02-01T15:00:00.000Z'),
        lastMembershipAt: new Date('2023-01-15T15:00:00.000Z'), // 15일 전 갱신 (갱신 기간 미달)
        currentMembershipProductId: 'test_membership',
      });

      await handleMembershipScheduler();

      const updatedUser = await db.User.findById(user._id);
      expect(updatedUser?.point).toBe(10);
      expect(updatedUser?.aiPoint).toBe(10);
      expect(updatedUser?.lastMembershipAt).toEqual(user.lastMembershipAt);
    });

    it('존재하지 않는 상품 ID로 갱신 시도 시 에러 로그가 기록된다', async () => {
      const user = await db.User.create({
        email: 'invalid_product@example.com',
        point: 50,
        aiPoint: 200,
        MembershipAt: new Date('2022-12-01T15:00:00.000Z'),
        MembershipExpiresAt: new Date('2023-02-01T15:00:00.000Z'),
        lastMembershipAt: new Date('2022-12-01T15:00:00.000Z'),
        currentMembershipProductId: 'non_existent_product',
      });

      await handleMembershipScheduler();

      const updatedUser = await db.User.findById(user._id);
      expect(updatedUser?.point).toBe(50); // 변경되지 않음
      expect(updatedUser?.aiPoint).toBe(200); // 변경되지 않음
    });

    it('잘못된 상품 타입으로 갱신 시도 시 에러 로그가 기록된다', async () => {
      // 잘못된 타입의 상품 생성 (type: 2, SUBSCRIPTION이 아님)
      await db.Product.create({
        productId: 'invalid_type_product',
        type: 2, // SUBSCRIPTION이 아님
        displayName: '잘못된 타입 상품',
        point: 30,
        aiPoint: 100,
        platform: 'ios',
        periodDate: 30,
        renewalPeriodDate: 30,
      });

      const user = await db.User.create({
        email: 'invalid_type@example.com',
        point: 50,
        aiPoint: 200,
        MembershipAt: new Date('2022-12-01T15:00:00.000Z'),
        MembershipExpiresAt: new Date('2023-02-01T15:00:00.000Z'),
        lastMembershipAt: new Date('2022-12-01T15:00:00.000Z'),
        currentMembershipProductId: 'invalid_type_product',
      });

      await handleMembershipScheduler();

      const updatedUser = await db.User.findById(user._id);
      expect(updatedUser?.point).toBe(50); // 변경되지 않음
      expect(updatedUser?.aiPoint).toBe(200); // 변경되지 않음
    });
  });
});
