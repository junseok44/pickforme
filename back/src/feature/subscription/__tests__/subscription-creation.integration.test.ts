import db from 'models';
import { ProductType } from 'models/product';
import mongoose from 'mongoose';
import iapValidator from 'utils/iap';
import { setupTestDB, teardownTestDB } from '../../../__tests__/setupDButils';
import { subscriptionCreationService } from '../service/subscription-creation.service';
import constants from '../../../constants';
import { google } from 'googleapis';
import { subscriptionQueryService } from '../service/subscription-query.service';

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

const androidSuccessResponse = {
  data: {
    kind: 'androidpublisher#subscriptionPurchaseV2',
    startTime: '2025-06-13T11:07:49.668Z',
    regionCode: 'KR',
    subscriptionState: 'SUBSCRIPTION_STATE_ACTIVE',
    latestOrderId: 'GPA.3395-8216-6259-15171',
    testPurchase: {},
    acknowledgementState: 'ACKNOWLEDGEMENT_STATE_ACKNOWLEDGED',
    lineItems: [
      {
        productId: 'pickforme_member',
        expiryTime: '2025-06-13T11:12:49.198Z',
        prepaidPlan: {},
        offerDetails: [Object],
        latestSuccessfulOrderId: 'GPA.3395-8216-6259-15171',
      },
    ],
  },
};

const androidExpiredResponse = {
  data: {
    kind: 'androidpublisher#subscriptionPurchaseV2',
    subscriptionState: 'SUBSCRIPTION_STATE_EXPIRED',
    lineItems: [
      {
        productId: 'pickforme_member',
        expiryTime: '2025-06-13T11:12:49.198Z',
        prepaidPlan: {},
        offerDetails: [Object],
        latestSuccessfulOrderId: 'GPA.3395-8216-6259-15171',
      },
    ],
  },
};

const mockIosReceipt =
  'MIIUUAYJKoZIhvcNAQcCoIIUQTCCFD0CAQExDzANBglghkgBZQMEAgEFADCCA4YGCSqGSIb3DQEHAaCCA3cEggNzMYIDbzAKAgEIAgEBBAIWADAKAgEUAgEBBAIMADALAgEBAgEBBAMCAQAwCwIBAwIBAQQDDAExMAsCAQsCAQEEAwIBADALAgEPAgEBBAMCAQAwCwIBEAIBAQQDAgEAMAsCARkCAQEEAwIBAzAMAgEKAgEBBAQWAjQrMAwCAQ4CAQEEBAICARcwDQIBDQIBAQQFAgMCmT0wDQIBEwIBAQQFDAMxLjAwDgIBCQIBAQQGAgRQMzAyMBgCAQQCAQI';

const mockAndroidReceipt = {
  subscription: true,
  orderId: 'GPA.3395-8216-6259-15171',
  packageName: 'com.sigonggan.pickforme',
  productId: 'pickforme_member',
  purchaseTime: 1749812869198,
  purchaseState: 0,
  purchaseToken:
    'eghpddpfamghbkhjdpamindo.AO-J1OydX_KhpD0rR67CfI2A6DHmLXXCpM9eE9m4J3En29vvvmGjGmZdmoX-ThjrWH9g3U4xXbkgUh_qu7GBykAdxVWRnTspCgjgpcmX20V30W8Nc2G39fg',
  quantity: 1,
  autoRenewing: false,
  acknowledged: false,
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

const createTestUser = async () => {
  return db.User.create({ email: 'test@example.com' });
};

const RealDate = Date;
const testDate = '2023-02-01T00:00:00+09:00';

const iosSuccessResponse = {
  purchaseDateMs: new Date(testDate).getTime(),
  expirationDate: new Date(testDate).getTime() + 30 * 24 * 60 * 60 * 1000,
};

describe('SubscriptionCreationService Integration Tests', () => {
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

  describe('createSubscription', () => {
    it('iOS 구독을 성공적으로 생성한다', async () => {
      mockIosValidator.mockResolvedValue(iosSuccessResponse);

      // Given
      const user = await createTestUser();
      const product = await createTestProduct('test_subscription', 'ios');

      // When
      const result = await subscriptionCreationService.createSubscription(
        user._id.toString(),
        product._id.toString(),
        mockIosReceipt
      );

      expect(result).toBeDefined();
      expect(result.userId.toString()).toBe(user._id.toString());
      expect(result.product.productId).toBe(product.productId);
      expect(result.isExpired).toBe(false);

      // 포인트가 정상적으로 지급되었는지 확인
      const updatedUser = await db.User.findById(user._id);
      expect(updatedUser?.point).toBe(product.point);
      expect(updatedUser?.aiPoint).toBe(product.aiPoint);

      // 멤버십 상태 확인
      const membership = await subscriptionQueryService.getSubscriptionStatus(user._id.toString());
      expect(membership.activate).toBe(true);
      expect(membership.leftDays).toBe(product.periodDate);
      expect(membership.expiresAt).toBeDefined();
      expect(membership.msg).toBe('멤버십이 활성화되어 있습니다.');
    });

    it('IOS에서 이미 구독이 만료된 영수증을 제출하면 구독이 생성되지 않는다.', async () => {
      mockIosValidator.mockResolvedValue(null);

      // Given
      const user = await createTestUser();
      const product = await createTestProduct('test_subscription', 'ios');

      await expect(
        subscriptionCreationService.createSubscription(
          user._id.toString(),
          product._id.toString(),
          mockIosReceipt
        )
      ).rejects.toThrow('이미 만료되었거나 존재하지 않는 구독입니다.');
    });

    it('IOS에서 유효하지 않은 영수증을 제출하면 구독이 생성되지 않는다.', async () => {
      mockIosValidator.mockRejectedValue(new Error('유효하지 않은 영수증입니다.'));

      // Given
      const user = await createTestUser();
      const product = await createTestProduct('test_subscription', 'ios');
      await expect(
        subscriptionCreationService.createSubscription(
          user._id.toString(),
          product._id.toString(),
          mockIosReceipt
        )
      ).rejects.toThrow('유효하지 않은 영수증입니다.');
    });

    it('Android 구독을 성공적으로 생성한다', async () => {
      mockAndroidAPI.mockResolvedValue(androidSuccessResponse);

      // Given
      const user = await createTestUser();
      const product = await createTestProduct('test_subscription', 'android');

      // When
      const result = await subscriptionCreationService.createSubscription(
        user._id.toString(),
        product._id.toString(),
        mockAndroidReceipt
      );

      // Then
      expect(result).toBeDefined();
      expect(result.userId.toString()).toBe(user._id.toString());
      expect(result.product.productId).toBe(product.productId);
      expect(result.isExpired).toBe(false);
      expect(result.purchase.platform).toBe('android');
      expect(result.purchase.verifiedBy).toBe('google-api');

      // 포인트가 정상적으로 지급되었는지 확인
      const updatedUser = await db.User.findById(user._id);
      expect(updatedUser?.point).toBe(product.point);
      expect(updatedUser?.aiPoint).toBe(product.aiPoint);

      // 멤버십 상태 확인
      const membership = await subscriptionQueryService.getSubscriptionStatus(user._id.toString());
      expect(membership.activate).toBe(true);
      expect(membership.leftDays).toBe(product.periodDate);
      expect(membership.expiresAt).toBeDefined();
      expect(membership.msg).toBe('멤버십이 활성화되어 있습니다.');
    });

    it('Android에서 이미 구독이 만료된 영수증을 제출하면 구독이 생성되지 않는다.', async () => {
      mockAndroidAPI.mockResolvedValue(androidExpiredResponse);

      // Given
      const user = await createTestUser();
      const product = await createTestProduct('pickforme_member', 'android');

      await expect(
        subscriptionCreationService.createSubscription(
          user._id.toString(),
          product._id.toString(),
          mockAndroidReceipt
        )
      ).rejects.toThrow('이미 만료되었거나 존재하지 않는 구독입니다.');
    });

    it('Android에서 유효하지 않은 영수증을 제출하면 구독이 생성되지 않는다.', async () => {
      mockAndroidAPI.mockRejectedValue(new Error('유효하지 않은 영수증입니다.'));

      // Given
      const user = await createTestUser();
      const product = await createTestProduct('pickforme_member', 'android');

      await expect(
        subscriptionCreationService.createSubscription(
          user._id.toString(),
          product._id.toString(),
          mockAndroidReceipt
        )
      ).rejects.toThrow('유효하지 않은 영수증입니다.');
    });

    it('존재하지 않는 유저의 경우 에러를 발생시킨다', async () => {
      // Given
      const product = await createTestProduct('test_subscription', 'ios');

      // When & Then
      await expect(
        subscriptionCreationService.createSubscription(
          new mongoose.Types.ObjectId().toString(),
          product._id.toString(),
          mockIosReceipt
        )
      ).rejects.toThrow('유저정보가 없습니다.');
    });

    it('이미 구독중인 경우 에러를 발생시킨다', async () => {
      mockIosValidator.mockResolvedValue(iosSuccessResponse);

      // Given
      const user = await createTestUser();
      const product = await createTestProduct('test_subscription', 'ios');

      // 기존 구독 생성
      await subscriptionCreationService.createSubscription(
        user._id.toString(),
        product._id.toString(),
        mockIosReceipt
      );

      // When & Then
      await expect(
        subscriptionCreationService.createSubscription(
          user._id.toString(),
          product._id.toString(),
          mockIosReceipt
        )
      ).rejects.toThrow('이미 구독중입니다.');
    });

    it('존재하지 않는 상품의 경우 에러를 발생시킨다', async () => {
      // Given
      const user = await createTestUser();

      // When & Then
      await expect(
        subscriptionCreationService.createSubscription(
          user._id.toString(),
          new mongoose.Types.ObjectId().toString(),
          mockIosReceipt
        )
      ).rejects.toThrow('존재하지 않는 구독 상품입니다.');
    });

    it('결제 검증 실패시 에러를 발생시키고 트랜잭션이 롤백된다', async () => {
      // Given
      const user = await createTestUser();
      const product = await createTestProduct('test_subscription', 'ios');

      //
      (iapValidator.validate as jest.Mock).mockResolvedValue(null);

      // When & Then
      await expect(
        subscriptionCreationService.createSubscription(
          user._id.toString(),
          product._id.toString(),
          mockIosReceipt
        )
      ).rejects.toThrow();

      // 트랜잭션이 롤백되었는지 확인
      const purchase = await db.Purchase.findOne({ userId: user._id });
      expect(purchase).toBeNull();

      const updatedUser = await db.User.findById(user._id);
      expect(updatedUser?.point).toBe(0);
      expect(updatedUser?.aiPoint).toBe(0);
    });
  });

  describe('createSubscriptionWithoutValidation', () => {
    it('iOS receipt가 있는 경우 구독이 성공적으로 생성되고 iOS 플랫폼으로 설정된다', async () => {
      // Given
      const user = await createTestUser();
      const product = await createTestProduct('test_subscription', 'ios');

      const iosReceipt =
        'MIIUUAYJKoZIhvcNAQcCoIIUQTCCFD0CAQExDzANBglghkgBZQMEAgEFADCCA4YGCSqGSIb3DQEHAaCCA3cEggNzMYIDbzAKAgEIAgEBBAIWADAKAgEUAgEBBAIMADALAgEBAgEBBAMCAQAwCwIBAwIBAQQDDAExMAsCAQsCAQEEAwIBADALAgEPAgEBBAMCAQAwCwIBEAIBAQQDAgEAMAsCARkCAQEEAwIBAzAMAgEKAgEBBAQWAjQrMAwCAQ4CAQEEBAICARcwDQIBDQIBAQQFAgMCmT0wDQIBEwIBAQQFDAMxLjAwDgIBCQIBAQQGAgRQMzAyMBgCAQQCAQI';

      // When
      const result = await subscriptionCreationService.createSubscriptionWithoutValidation(
        user._id.toString(),
        product._id.toString(),
        iosReceipt
      );

      // Then
      expect(result.purchase.platform).toBe('ios');
    });

    it('Android receipt가 있는 경우 구독이 성공적으로 생성되고 Android 플랫폼으로 설정된다', async () => {
      // Given
      const user = await createTestUser();
      const product = await createTestProduct('test_subscription', 'android');

      // When
      const result = await subscriptionCreationService.createSubscriptionWithoutValidation(
        user._id.toString(),
        product._id.toString(),
        mockAndroidReceipt
      );

      // Then
      expect(result.purchase.platform).toBe('android');
    });

    it('영수증이 없는 경우 기본 플랫폼으로 설정되고 어드민 구독이 생성된다', async () => {
      // Given
      const user = await createTestUser();
      const product = await createTestProduct('test_subscription', 'ios');

      // When - receipt를 undefined로 명시적으로 전달
      const result = await subscriptionCreationService.createSubscriptionWithoutValidation(
        user._id.toString(),
        product._id.toString(),
        undefined
      );

      // Then
      expect(result).toBeDefined();
      expect(result.userId.toString()).toBe(user._id.toString());
      expect(result.product.productId).toBe(product.productId);
      expect(result.isExpired).toBe(false);
      expect(result.purchase.createdByAdmin).toBe(true);
      expect(result.purchase.verifiedBy).toBe('admin');

      // receipt가 undefined일 때는 'android'로 설정됨
      expect(result.purchase.platform).toBe('android');
      expect(result.purchase.transactionId).toMatch(/^admin_\d+$/);
      expect(result.purchase.verificationNote).toBe('어드민에서 멤버쉽 지급');
      expect(result.receipt).toBeNull(); // receipt 필드는 null로 저장됨

      // 포인트가 정상적으로 지급되었는지 확인
      const updatedUser = await db.User.findById(user._id);
      expect(updatedUser?.point).toBe(product.point);
      expect(updatedUser?.aiPoint).toBe(product.aiPoint);
    });

    it('존재하지 않는 유저의 경우 에러를 발생시킨다', async () => {
      // Given
      const product = await createTestProduct('test_subscription', 'ios');

      // When & Then
      await expect(
        subscriptionCreationService.createSubscriptionWithoutValidation(
          new mongoose.Types.ObjectId().toString(),
          product._id.toString()
        )
      ).rejects.toThrow('유저정보가 없습니다.');
    });

    it('이미 구독중인 경우 에러를 발생시킨다', async () => {
      mockAndroidAPI.mockResolvedValue(androidSuccessResponse);
      mockIosValidator.mockResolvedValue(iosSuccessResponse);

      // Given
      const user = await createTestUser();
      const product = await createTestProduct('test_subscription', 'ios');

      // 기존 구독 생성
      await subscriptionCreationService.createSubscription(
        user._id.toString(),
        product._id.toString(),
        mockIosReceipt
      );

      // 또 구독을 생성할때,
      await expect(
        subscriptionCreationService.createSubscriptionWithoutValidation(
          user._id.toString(),
          product._id.toString()
        )
      ).rejects.toThrow('이미 구독중입니다.');
    });

    it('존재하지 않는 상품의 경우 에러를 발생시킨다', async () => {
      // Given
      const user = await createTestUser();

      // When & Then
      await expect(
        subscriptionCreationService.createSubscriptionWithoutValidation(
          user._id.toString(),
          new mongoose.Types.ObjectId().toString()
        )
      ).rejects.toThrow('존재하지 않는 구독 상품입니다.');
    });
  });
});
