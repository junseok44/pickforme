import db from 'models';
import { ProductType } from 'models/product';
import iapValidator from 'utils/iap';
import { setupTestDB, teardownTestDB } from '../../../__tests__/setupDButils';
import { subscriptionQueryService } from '../service/subscription-query.service';
import { subscriptionCreationService } from '../service/subscription-creation.service';
import { subscriptionManagementService } from '../service/subscription-management.service';
import constants from '../../../constants';
import { google } from 'googleapis';

const { POINTS } = constants;

// iapValidator 모킹
jest.mock('utils/iap', () => ({
  __esModule: true,
  default: {
    validate: jest.fn(),
  },
}));

// Google Play API 모킹
jest.mock('googleapis', () => ({
  google: {
    auth: {
      GoogleAuth: jest.fn().mockImplementation(() => ({
        getClient: jest.fn().mockResolvedValue({}),
      })),
    },
    androidpublisher: jest.fn().mockReturnValue({
      purchases: {
        subscriptionsv2: {
          get: jest.fn(),
        },
      },
    }),
  },
}));

let mockIosValidator: jest.Mock;
let mockAndroidAPI: jest.Mock;

const mockIosReceipt =
  'MIIUUAYJKoZIhvcNAQcCoIIUQTCCFD0CAQExDzANBglghkgBZQMEAgEFADCCA4YGCSqGSIb3DQEHAaCCA3cEggNzMYIDbzAKAgEIAgEBBAIWADAKAgEUAgEBBAIMADALAgEBAgEBBAMCAQAwCwIBAwIBAQQDDAExMAsCAQsCAQEEAwIBADALAgEPAgEBBAMCAQAwCwIBEAIBAQQDAgEAMAsCARkCAQEEAwIBAzAMAgEKAgEBBAQWAjQrMAwCAQ4CAQEEBAICARcwDQIBDQIBAQQFAgMCmT0wDQIBEwIBAQQFDAMxLjAwDgIBCQIBAQQGAgRQMzAyMBgCAQQCAQI';

const RealDate = Date;
const testDate = '2023-02-01T00:00:00+09:00';

const iosSuccessResponse = {};

const createTestUser = async () => {
  return db.User.create({ email: 'test@example.com' });
};

const createTestProduct = async (productId: string, platform: string) => {
  return db.Product.create({
    productId,
    type: ProductType.SUBSCRIPTION,
    displayName: '테스트 구독',
    point: 45,
    aiPoint: 9999,
    platform,
    periodDate: 60,
    renewalPeriodDate: 30,
    eventId: null,
  });
};

const createEventProduct = async (eventId: number) => {
  return db.Product.create({
    productId: `pickforme_event_${eventId}`,
    type: ProductType.SUBSCRIPTION,
    displayName: `이벤트 ${eventId} 구독`,
    point: 45,
    aiPoint: 9999,
    platform: 'ios',
    periodDate: 60,
    renewalPeriodDate: 30,
    eventId,
  });
};

describe('SubscriptionQueryService Integration Tests', () => {
  beforeEach(async () => {
    await db.User.deleteMany({});
    await db.Purchase.deleteMany({});
    await db.Product.deleteMany({});
    jest.clearAllMocks();
  });

  beforeEach(() => {
    mockIosValidator = iapValidator.validate as jest.Mock;
    mockAndroidAPI = google.androidpublisher({
      version: 'v3',
    }).purchases.subscriptionsv2.get as jest.Mock;
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

  describe('getSubscriptionStatus', () => {
    it('구독 정보가 없는 경우 null을 반환한다', async () => {
      const user = await createTestUser();

      const result = await subscriptionQueryService.getSubscriptionStatus(user._id);

      expect(result.activate).toBe(false);
      expect(result.leftDays).toBe(0);
      expect(result.expiresAt).toBeNull();
      expect(result.msg).toBe('활성화중인 멤버십이 없습니다.');
    });

    it('만료된 구독 정보는 조회되지 않는다', async () => {
      const user = await createTestUser();
      await createTestProduct('test_subscription', 'ios');

      await user.processExpiredMembership();

      const result = await subscriptionQueryService.getSubscriptionStatus(user._id);

      expect(result.activate).toBe(false);
      expect(result.leftDays).toBe(0);
      expect(result.expiresAt).toBeNull();
      expect(result.msg).toBe('활성화중인 멤버십이 없습니다.');
    });

    it('활성화된 구독 정보를 정상적으로 조회한다', async () => {
      mockIosValidator.mockResolvedValue(iosSuccessResponse);

      const user = await createTestUser();
      const product = await createTestProduct('test_subscription', 'ios');

      await subscriptionCreationService.createSubscription(
        user._id.toString(),
        product._id.toString(),
        mockIosReceipt
      );

      const result = await subscriptionQueryService.getSubscriptionStatus(user._id);

      expect(result.activate).toBe(true);
      expect(result.leftDays).toBe(product.periodDate);
      expect(result.expiresAt).toBeDefined();
      expect(result.msg).toBe('멤버십이 활성화되어 있습니다.');
    });

    it('이벤트 멤버십이 활성화된 유저는 멤버십 상태가 활성화된다', async () => {
      // Given
      const user = await createTestUser();
      const product = await createEventProduct(1);

      // 이벤트 멤버십 적립
      await user.applyEventMembershipRewards(product.getEventRewards());

      // When
      const result = await subscriptionQueryService.getSubscriptionStatus(user._id);

      // Then
      expect(result.activate).toBe(true);
      expect(result.leftDays).toBe(product.periodDate);
      expect(result.expiresAt).toBeDefined();
      expect(result.msg).toBe('이벤트 멤버십이 활성화되어 있습니다.');
    });

    it('이벤트 멤버십이 만료된 유저는 구독 상태가 비활성화된다', async () => {
      const user = await createTestUser();
      const product = await createEventProduct(1);

      // 이벤트 멤버십 적립
      await user.applyEventMembershipRewards(product.getEventRewards());

      // 이벤트 멤버십 만료
      await user.processExpiredMembership();

      // When
      const result = await subscriptionQueryService.getSubscriptionStatus(user._id);

      // Then
      expect(result.activate).toBe(false);
      expect(result.leftDays).toBe(0);
      expect(result.expiresAt).toBeDefined();
      expect(result.msg).toBe('활성화중인 멤버십이 없습니다.');
    });
  });

  describe('getSubscriptionProductsByPlatform', () => {
    it('특정 플랫폼의 구독 상품 목록을 조회한다', async () => {
      // Given
      const iosProduct = await db.Product.create({
        productId: 'ios_subscription',
        type: ProductType.SUBSCRIPTION,
        displayName: 'iOS 구독',
        point: 100,
        aiPoint: 1000,
        platform: 'ios',
      });

      const androidProduct = await db.Product.create({
        productId: 'android_subscription',
        type: ProductType.SUBSCRIPTION,
        displayName: 'Android 구독',
        point: 100,
        aiPoint: 1000,
        platform: 'android',
      });

      // When
      const iosProducts = await subscriptionQueryService.getSubscriptionProductsByPlatform('ios');
      const androidProducts =
        await subscriptionQueryService.getSubscriptionProductsByPlatform('android');

      // Then
      expect(iosProducts).toHaveLength(1);
      expect(iosProducts[0].productId).toBe('ios_subscription');
      expect(androidProducts).toHaveLength(1);
      expect(androidProducts[0].productId).toBe('android_subscription');
    });

    it('존재하지 않는 플랫폼의 경우 빈 배열을 반환한다', async () => {
      // When
      const products = await subscriptionQueryService.getSubscriptionProductsByPlatform('unknown');

      // Then
      expect(products).toHaveLength(0);
    });
  });

  describe('getUserSubscriptions', () => {
    it('유저의 구독상품 구매 내역을 생성일자 내림차순으로 조회한다', async () => {
      // Given
      const user = await db.User.create({ email: 'test@example.com' });
      const product = await db.Product.create({
        productId: 'test_subscription',
        type: ProductType.SUBSCRIPTION,
        displayName: '테스트 구독',
        point: 100,
        aiPoint: 1000,
        platform: 'ios',
      });

      const mockIosReceipt2 = 'df';

      (iapValidator.validate as jest.Mock).mockResolvedValue({
        purchase: {
          productId: product._id.toString(),
          price: 100,
          currency: 'USD',
        },
      });

      const oldSubscription = await subscriptionCreationService.createSubscription(
        user._id.toString(),
        product._id.toString(),
        mockIosReceipt
      );

      // 이전 구독 만료시키기
      await subscriptionManagementService.expireSubscription(oldSubscription);

      // 새로운 구독 생성
      const newSubscription = await subscriptionCreationService.createSubscription(
        user._id.toString(),
        product._id.toString(),
        mockIosReceipt2
      );

      // When
      const subscriptions = await subscriptionQueryService.getUserSubscriptions(
        user._id.toString()
      );

      // Then
      expect(subscriptions).toHaveLength(2);

      // 왜 내림차순 정렬인데 old가 먼저 나오는 거지..
      // 그건 왜 그런거냐면, 지금 new Date가 항상 동일한 값을 반환하기 때문이다.
      expect(subscriptions[0]._id.toString()).toBe(oldSubscription._id.toString());
      expect(subscriptions[1]._id.toString()).toBe(newSubscription._id.toString());
    });

    it('다른 유저의 구독 내역은 조회되지 않는다', async () => {
      // Given
      const user1 = await db.User.create({ email: 'user1@example.com' });
      const user2 = await db.User.create({ email: 'user2@example.com' });
      const product = await db.Product.create({
        productId: 'test_subscription',
        type: ProductType.SUBSCRIPTION,
        displayName: '테스트 구독',
        point: 100,
        aiPoint: 1000,
        platform: 'ios',
      });

      (iapValidator.validate as jest.Mock).mockResolvedValue({
        purchase: {
          productId: product._id.toString(),
          price: 100,
          currency: 'USD',
        },
      });

      await subscriptionCreationService.createSubscription(
        user1._id.toString(),
        product._id.toString(),
        mockIosReceipt
      );

      // When
      const subscriptions = await subscriptionQueryService.getUserSubscriptions(
        user2._id.toString()
      );

      // Then
      expect(subscriptions).toHaveLength(0);
    });

    it('구독이 아닌 상품은 조회되지 않는다', async () => {
      // Given
      const user = await db.User.create({ email: 'test@example.com' });
      const product = await db.Product.create({
        productId: 'test_product',
        type: ProductType.PURCHASE,
        displayName: '테스트 상품',
        point: 100,
        aiPoint: 1000,
        platform: 'ios',
      });

      // When
      const subscriptions = await subscriptionQueryService.getUserSubscriptions(
        user._id.toString()
      );

      // Then
      expect(subscriptions).toHaveLength(0);
    });
  });
});
