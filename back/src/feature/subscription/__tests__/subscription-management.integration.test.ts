import db from 'models';
import { ProductType } from 'models/product';
import mongoose from 'mongoose';
import iapValidator from 'utils/iap';
import { setupTestDB, teardownTestDB } from '../../../__tests__/setupDButils';
import { subscriptionManagementService } from '../service/subscription-management.service';
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

describe('SubscriptionManagementService Integration Tests', () => {
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

  describe('expireSubscription', () => {
    it('구독을 성공적으로 만료 처리한다', async () => {
      // Given
      const user = await db.User.create({
        email: 'test@example.com',
        point: 100,
        aiPoint: 1000,
      });
      const product = await db.Product.create({
        productId: 'test_subscription',
        type: ProductType.SUBSCRIPTION,
        displayName: '테스트 구독',
        point: 100,
        aiPoint: 1000,
        platform: 'ios',
      });

      const purchase = await db.Purchase.create({
        userId: user._id,
        productId: product._id,
        isExpired: false,
        createdAt: new Date(),
        product: { ...product.toObject() },
      });

      // When
      const result = await subscriptionManagementService.expireSubscription(purchase);

      // Then
      expect(result.isExpired).toBe(true);

      // 유저 포인트가 초기화되었는지 확인
      const updatedUser = await db.User.findById(user._id);
      expect(updatedUser?.point).toBe(POINTS.DEFAULT_POINT);
      expect(updatedUser?.aiPoint).toBe(POINTS.DEFAULT_AI_POINT);
    });

    it('트랜잭션 내에서 구독 만료 처리가 성공한다', async () => {
      // Given
      const user = await db.User.create({
        email: 'test@example.com',
        point: 100,
        aiPoint: 1000,
      });
      const product = await db.Product.create({
        productId: 'test_subscription',
        type: ProductType.SUBSCRIPTION,
        displayName: '테스트 구독',
        point: 100,
        aiPoint: 1000,
        platform: 'ios',
      });

      const purchase = await db.Purchase.create({
        userId: user._id,
        productId: product._id,
        isExpired: false,
        createdAt: new Date(),
        product: { ...product.toObject() },
      });

      const session = await mongoose.startSession();
      session.startTransaction();

      try {
        // When
        const result = await subscriptionManagementService.expireSubscription(purchase, session);
        await session.commitTransaction();

        // Then
        expect(result.isExpired).toBe(true);

        // 유저 포인트가 초기화되었는지 확인
        const updatedUser = await db.User.findById(user._id);
        expect(updatedUser?.point).toBe(POINTS.DEFAULT_POINT);
        expect(updatedUser?.aiPoint).toBe(POINTS.DEFAULT_AI_POINT);
      } finally {
        void session.endSession();
      }
    });

    it('트랜잭션 내에서 에러 발생 시 롤백된다', async () => {
      // Given
      const user = await db.User.create({
        email: 'test@example.com',
        point: 100,
        aiPoint: 1000,
      });
      const product = await db.Product.create({
        productId: 'test_subscription',
        type: ProductType.SUBSCRIPTION,
        displayName: '테스트 구독',
        point: 100,
        aiPoint: 1000,
        platform: 'ios',
      });

      const purchase = await db.Purchase.create({
        userId: user._id,
        productId: product._id,
        isExpired: false,
        createdAt: new Date(),
        product: { ...product.toObject() },
      });

      const session = await mongoose.startSession();
      session.startTransaction();

      try {
        // When
        await subscriptionManagementService.expireSubscription(purchase, session);
        throw new Error('테스트 에러');
      } catch (error) {
        await session.abortTransaction();

        // Then
        const updatedPurchase = await db.Purchase.findById(purchase._id);
        expect(updatedPurchase?.isExpired).toBe(false);

        const updatedUser = await db.User.findById(user._id);
        expect(updatedUser?.point).toBe(100);
        expect(updatedUser?.aiPoint).toBe(1000);
      } finally {
        void session.endSession();
      }
    });

    it('이미 만료된 구독을 만료 처리해도 에러가 발생하지 않는다', async () => {
      // Given
      const user = await db.User.create({
        email: 'test@example.com',
        point: 100,
        aiPoint: 1000,
      });
      const product = await db.Product.create({
        productId: 'test_subscription',
        type: ProductType.SUBSCRIPTION,
        displayName: '테스트 구독',
        point: 100,
        aiPoint: 1000,
        platform: 'ios',
      });

      const purchase = await db.Purchase.create({
        userId: user._id,
        productId: product._id,
        isExpired: true,
        createdAt: new Date(),
        product: { ...product.toObject() },
      });

      // When
      const result = await subscriptionManagementService.expireSubscription(purchase);

      // Then
      expect(result.isExpired).toBe(true);

      // 유저 포인트가 초기화되었는지 확인
      const updatedUser = await db.User.findById(user._id);
      expect(updatedUser?.point).toBe(POINTS.DEFAULT_POINT);
      expect(updatedUser?.aiPoint).toBe(POINTS.DEFAULT_AI_POINT);
    });
  });

  describe('checkRefundEligibility', () => {
    it('유저가 없는 경우 환불 불가능하다', async () => {
      // When
      const result = await subscriptionManagementService.checkRefundEligibility(
        new mongoose.Types.ObjectId().toString()
      );

      // Then
      expect(result.isRefundable).toBe(false);
      expect(result.msg).toBe('유저 정보가 없습니다.');
    });

    it('활성화된 구독이 없는 경우 환불 불가능하다', async () => {
      // Given
      const user = await db.User.create({ email: 'test@example.com' });

      // When
      const result = await subscriptionManagementService.checkRefundEligibility(
        user._id.toString()
      );

      // Then
      expect(result.isRefundable).toBe(false);
      expect(result.msg).toBe('환불 가능한 구독 정보가 없습니다.');
    });

    it('서비스를 이용한 경우 환불 불가능하다', async () => {
      // Given
      const user = await db.User.create({
        email: 'test@example.com',
        point: 0,
        aiPoint: 0,
      });
      const product = await db.Product.create({
        productId: 'test_subscription',
        type: ProductType.SUBSCRIPTION,
        displayName: '테스트 구독',
        point: 100,
        aiPoint: 1000,
        platform: 'ios',
      });

      await db.Purchase.create({
        userId: user._id,
        productId: product._id,
        isExpired: false,
        createdAt: new Date(),
        product: { ...product.toObject() },
      });

      // When
      const result = await subscriptionManagementService.checkRefundEligibility(
        user._id.toString()
      );

      // Then
      expect(result.isRefundable).toBe(false);
      expect(result.msg).toBe('구독 후 서비스 이용 고객으로 구독 환불 불가 대상입니다.');
    });

    it('서비스를 이용하지 않은 경우 환불 가능하다', async () => {
      // Given
      const user = await db.User.create({
        email: 'test@example.com',
        point: POINTS.DEFAULT_POINT,
        aiPoint: POINTS.DEFAULT_AI_POINT,
      });

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

      // 구독을 생성한다.
      await subscriptionCreationService.createSubscription(
        user._id.toString(),
        product._id.toString(),
        mockIosReceipt
      );

      // When
      const result = await subscriptionManagementService.checkRefundEligibility(
        user._id.toString()
      );

      // Then
      expect(result.isRefundable).toBe(true);
    });
  });

  describe('processRefund', () => {
    it('환불 가능한 구독을 성공적으로 환불 처리한다 (IOS)', async () => {
      // Given
      const user = await db.User.create({
        email: 'test@example.com',
        point: POINTS.DEFAULT_POINT,
        aiPoint: POINTS.DEFAULT_AI_POINT,
      });

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

      // 구독을 생성한다.
      const subscription = await subscriptionCreationService.createSubscription(
        user._id.toString(),
        product._id.toString(),
        mockIosReceipt
      );

      // When
      const result = await subscriptionManagementService.processRefund(
        user._id.toString(),
        subscription._id.toString()
      );

      // Then
      expect(result.refundSuccess).toBe(true);
      expect(result.msg).toBe('구독 환불을 완료하였습니다.');

      // 구독이 만료되었는지 확인
      const updatedSubscription = await db.Purchase.findById(subscription._id);
      expect(updatedSubscription?.isExpired).toBe(true);

      // 유저 포인트가 초기화되었는지 확인
      const updatedUser = await db.User.findById(user._id);
      expect(updatedUser?.point).toBe(POINTS.DEFAULT_POINT);
      expect(updatedUser?.aiPoint).toBe(POINTS.DEFAULT_AI_POINT);
    });

    it('유저가 구독 후에 ai 포인트를 일정 이상 사용했다면 환불 처리할 수 없다 (IOS)', async () => {
      // Given
      let user;
      user = await db.User.create({
        email: 'test@example.com',
        point: 0,
        aiPoint: 0,
      });

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

      // 구독을 생성한다.
      const subscription = await subscriptionCreationService.createSubscription(
        user._id.toString(),
        product._id.toString(),
        mockIosReceipt
      );

      user = await db.User.findById(user._id);

      if (!user) {
        throw new Error('유저 정보가 없습니다.');
      }

      // 그 유저가 기본지급 포인트 이상의 포인트를 사용했다면,
      await user.useAiPoint(20);

      // When & Then
      await expect(
        subscriptionManagementService.processRefund(
          user._id.toString(),
          subscription._id.toString()
        )
      ).rejects.toThrow();

      //
      const updatedSubscription = await db.Purchase.findById(subscription._id);
      expect(updatedSubscription?.isExpired).toBe(false);
    });

    it('유저가 구독 후에 포인트를 일정 이상 사용했다면 환불 처리할 수 없다 (IOS)', async () => {
      // Given
      let user;
      user = await db.User.create({
        email: 'test@example.com',
        point: 0,
        aiPoint: 0,
      });

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

      // 구독을 생성한다.
      const subscription = await subscriptionCreationService.createSubscription(
        user._id.toString(),
        product._id.toString(),
        mockIosReceipt
      );

      user = await db.User.findById(user._id);

      if (!user) {
        throw new Error('유저 정보가 없습니다.');
      }

      // 그 유저가 기본지급 포인트 이상의 포인트를 사용했다면,
      await user.usePoint(20);

      // When & Then
      await expect(
        subscriptionManagementService.processRefund(
          user._id.toString(),
          subscription._id.toString()
        )
      ).rejects.toThrow();

      // 구독이 만료되지 않았는지 확인
      const updatedSubscription = await db.Purchase.findById(subscription._id);
      expect(updatedSubscription?.isExpired).toBe(false);
    });

    it('존재하지 않는 구독은 환불 처리할 수 없다 (IOS)', async () => {
      // Given
      const user = await db.User.create({
        email: 'test@example.com',
        point: POINTS.DEFAULT_POINT,
        aiPoint: POINTS.DEFAULT_AI_POINT,
      });

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

      // 구독을 생성하지 않는다.
      // const subscription = await subscriptionService.createSubscription(user._id.toString(), product._id.toString(), {
      //   transactionDate: new Date(),
      //   transactionId: 'test_transaction_id',
      //   productId: product._id.toString(),
      //   price: 100,
      //   currency: 'USD',
      // });

      // When & Then
      await expect(
        subscriptionManagementService.processRefund(
          user._id.toString(),
          new mongoose.Types.ObjectId().toString()
        )
      ).rejects.toThrow();
    });
  });
});
