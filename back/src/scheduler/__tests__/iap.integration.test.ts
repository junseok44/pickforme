// scheduler.test.ts
import { setupTestDB, teardownTestDB } from '../../__tests__/setupDButils';
import db from 'models';
import iapValidator from 'utils/iap';
import { handleIAPScheduler } from '../iap';
import { POINTS } from '../../constants/points';
import { subscriptionCreationService } from 'feature/subscription/service/subscription-creation.service';

jest.mock('utils/iap', () => {
  const mockValidate = jest.fn();
  return {
    __esModule: true,
    default: {
      validate: mockValidate,
    },
  };
});

jest.mock('node-cron', () => ({
  schedule: jest.fn((cronTime, callback, options) => {
    console.log(`[Mocked cron] ${cronTime} with tz: ${options?.timezone}`);
  }),
}));

const RealDate = Date;
const testDate = '2023-02-01T00:00:00+09:00';

describe('Scheduler Integration Tests', () => {
  beforeEach(async () => {
    jest.clearAllMocks();
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

  describe('IAP Scheduler Integration', () => {
    it('영수증을 검증해서 유효하지 않은 구독은 만료 처리한다.', async () => {
      const user = await db.User.create({ email: 'test@example.com', point: 100, aiPoint: 1000 });
      const product = await db.Product.create({
        productId: 'test_subscription',
        type: 1,
        displayName: '테스트 구독',
        point: 100,
        aiPoint: 1000,
        platform: 'ios',
        rewards: { point: 100, aiPoint: 1000 },
      });

      const purchase = await db.Purchase.create({
        userId: user._id,
        productId: product._id,
        receipt: 'test_receipt',
        isExpired: false,
        createdAt: new Date('2022-12-31T15:00:00.000Z'),
        product: { ...product.toObject() },
        purchase: { transactionId: 'other_transaction_id' },
      });

      (iapValidator.validate as jest.Mock).mockResolvedValue(null);

      await handleIAPScheduler();

      const updated = await db.User.findById(user._id);
      const updatedPurchase = await db.Purchase.findById(purchase._id);

      expect(updated?.point).toBe(POINTS.DEFAULT_POINT);
      expect(updated?.aiPoint).toBe(POINTS.DEFAULT_AI_POINT);
      expect(updatedPurchase?.isExpired).toBe(true);
    });

    it('어드민 권한으로 생성된 구독은 영수증을 검증하지 않고 넘어간다. (오류가 나거나, 만료처리되지 않는다.)', async () => {
      const user = await db.User.create({ email: 'test@example.com', point: 0, aiPoint: 0 });

      const product = await db.Product.create({
        productId: 'test_subscription',
        type: 1,
        displayName: '테스트 구독',
        point: 100,
        aiPoint: 1000,
        platform: 'ios',
        rewards: { point: 100, aiPoint: 1000 },
      });

      const purchase = await subscriptionCreationService.createSubscriptionWithoutValidation(
        user._id,
        product._id,
        undefined
      );

      (iapValidator.validate as jest.Mock).mockResolvedValue(null);

      await handleIAPScheduler();

      const updated = await db.User.findById(user._id);
      const updatedPurchase = await db.Purchase.findById(purchase._id);

      expect(updated?.point).toBe(product.point);
      expect(updated?.aiPoint).toBe(product.aiPoint);
      expect(updatedPurchase?.isExpired).toBe(false);
    });
  });
});
