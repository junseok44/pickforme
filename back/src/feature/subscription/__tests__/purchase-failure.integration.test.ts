import db from 'models';
import { ProductType } from 'models/product';
import iapValidator from 'utils/iap';
import { setupTestDB, teardownTestDB } from '../../../__tests__/setupDButils';
import { purchaseFailureService } from '../service/purchase-failure.service';
import { subscriptionCreationService } from '../service/subscription-creation.service';
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

const iosSuccessResponse = {};

const mockIosReceipt =
  'MIIUUAYJKoZIhvcNAQcCoIIUQTCCFD0CAQExDzANBglghkgBZQMEAgEFADCCA4YGCSqGSIb3DQEHAaCCA3cEggNzMYIDbzAKAgEIAgEBBAIWADAKAgEUAgEBBAIMADALAgEBAgEBBAMCAQAwCwIBAwIBAQQDDAExMAsCAQsCAQEEAwIBADALAgEPAgEBBAMCAQAwCwIBEAIBAQQDAgEAMAsCARkCAQEEAwIBAzAMAgEKAgEBBAQWAjQrMAwCAQ4CAQEEBAICARcwDQIBDQIBAQQFAgMCmT0wDQIBEwIBAQQFDAMxLjAwDgIBCQIBAQQGAgRQMzAyMBgCAQQCAQI';

const RealDate = Date;
const testDate = '2023-02-01T00:00:00+09:00';

describe('PurchaseFailureService Integration Tests', () => {
  beforeEach(async () => {
    await db.User.deleteMany({});
    await db.Purchase.deleteMany({});
    await db.Product.deleteMany({});
    await db.PurchaseFailure.deleteMany({});
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

  describe('checkPurchaseFailure', () => {
    it('실패한 구매가 없는 경우 false를 반환한다', async () => {
      // Given
      const user = await db.User.create({ email: 'test@example.com' });

      // When
      const result = await purchaseFailureService.checkPurchaseFailure(user._id.toString());

      // Then
      expect(result.hasFailedPurchase).toBe(false);
    });

    it('실패한 구매가 있는 경우 true를 반환한다', async () => {
      // Given
      const user = await db.User.create({ email: 'test@example.com' });

      await db.PurchaseFailure.create({
        userId: user._id,
        receipt: 'test_receipt',
        status: 'FAILED',
        errorMessage: 'Test error',
      });

      // When
      const result = await purchaseFailureService.checkPurchaseFailure(user._id.toString());

      // Then
      expect(result.hasFailedPurchase).toBe(true);
    });

    it('해결된 구매 실패는 false를 반환한다', async () => {
      // Given
      const user = await db.User.create({ email: 'test@example.com' });

      await db.PurchaseFailure.create({
        userId: user._id,
        receipt: 'test_receipt',
        status: 'RESOLVED',
        errorMessage: 'Test error',
      });

      // When
      const result = await purchaseFailureService.checkPurchaseFailure(user._id.toString());

      // Then
      expect(result.hasFailedPurchase).toBe(false);
    });
  });

  describe('resolvePurchaseFailures - 구독 생성 시 자동 해결', () => {
    it('iOS 구독 생성 시 해당 영수증과 관련된 실패 내역이 해결된다', async () => {
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

      // 실패한 구매 기록 생성
      await db.PurchaseFailure.create({
        userId: user._id,
        receipt: mockIosReceipt,
        status: 'FAILED',
        errorMessage: 'Previous failure',
      });

      mockIosValidator.mockResolvedValue(iosSuccessResponse);

      // When
      await subscriptionCreationService.createSubscription(
        user._id.toString(),
        product._id.toString(),
        mockIosReceipt
      );

      // Then
      const resolvedFailures = await db.PurchaseFailure.find({
        userId: user._id,
        receipt: mockIosReceipt,
        status: 'RESOLVED',
      });
      expect(resolvedFailures).toHaveLength(1);
    });

    it('Android 구독 생성 시 해당 영수증과 관련된 실패 내역이 해결된다', async () => {
      // Given
      const user = await db.User.create({ email: 'test@example.com' });
      const product = await db.Product.create({
        productId: 'pickforme_member',
        type: ProductType.SUBSCRIPTION,
        displayName: '픽포미 플러스',
        point: 30,
        aiPoint: 99999,
        platform: 'android',
      });

      const mockAndroidReceipt = {
        subscription: true,
        orderId: 'GPA.3395-8216-6259-15171',
        packageName: 'com.sigonggan.pickforme',
        productId: 'pickforme_member',
        purchaseTime: 1749812869198,
        purchaseState: 0,
        purchaseToken: 'test_token',
        quantity: 1,
        autoRenewing: false,
        acknowledged: false,
      };

      // 실패한 구매 기록 생성
      await db.PurchaseFailure.create({
        userId: user._id,
        receipt: mockAndroidReceipt,
        status: 'FAILED',
        errorMessage: 'Previous failure',
      });

      mockAndroidAPI.mockResolvedValue(androidSuccessResponse);

      // When
      await subscriptionCreationService.createSubscription(
        user._id.toString(),
        product._id.toString(),
        mockAndroidReceipt
      );

      // Then
      const resolvedFailures = await db.PurchaseFailure.find({
        userId: user._id,
        receipt: mockAndroidReceipt,
        status: 'RESOLVED',
      });
      expect(resolvedFailures).toHaveLength(1);
    });

    it('영수증 없이 구독을 생성해도 (어드민 권한) 해당 유저의 모든 실패 내역이 해결된다', async () => {
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

      // 여러 실패한 구매 기록 생성
      await db.PurchaseFailure.create({
        userId: user._id,
        receipt: 'receipt1',
        status: 'FAILED',
        errorMessage: 'Failure 1',
      });

      await db.PurchaseFailure.create({
        userId: user._id,
        receipt: 'receipt2',
        status: 'FAILED',
        errorMessage: 'Failure 2',
      });

      // When - 영수증 없이 구독 생성
      await subscriptionCreationService.createSubscriptionWithoutValidation(
        user._id.toString(),
        product._id.toString(),
        undefined
      );

      // Then
      const resolvedFailures = await db.PurchaseFailure.find({
        userId: user._id,
        status: 'RESOLVED',
      });

      expect(resolvedFailures).toHaveLength(2);
    });

    it('다른 유저의 실패 내역은 해결되지 않는다', async () => {
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

      // user2의 실패한 구매 기록 생성
      await db.PurchaseFailure.create({
        userId: user2._id,
        receipt: 'other_user_receipt',
        status: 'FAILED',
        errorMessage: 'Other user failure',
      });

      mockIosValidator.mockResolvedValue(iosSuccessResponse);

      // When - user1의 구독 생성
      await subscriptionCreationService.createSubscription(
        user1._id.toString(),
        product._id.toString(),
        mockIosReceipt
      );

      // Then - user2의 실패 내역은 해결되지 않음
      const user2Failures = await db.PurchaseFailure.find({
        userId: user2._id,
        status: 'FAILED',
      });
      expect(user2Failures).toHaveLength(1);

      const user2ResolvedFailures = await db.PurchaseFailure.find({
        userId: user2._id,
        status: 'RESOLVED',
      });
      expect(user2ResolvedFailures).toHaveLength(0);
    });
  });
});
