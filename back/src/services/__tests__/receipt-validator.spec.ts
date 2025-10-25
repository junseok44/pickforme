import { google } from 'googleapis';
import { IProduct, Platform, ProductType } from 'models/product';
import { receiptValidatorService } from 'services/receipt-validator.service';
import iapValidator from 'utils/iap';

let mockValidate: jest.Mock;
let mockGetSubscription: jest.Mock;

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

const RealDate = Date;
const testDate = '2023-02-01T00:00:00+09:00';

describe('receipt-validator.spec.ts', () => {
  beforeEach(async () => {
    jest.clearAllMocks();

    mockValidate = iapValidator.validate as jest.Mock;
    mockGetSubscription = google.androidpublisher({
      version: 'v3',
    }).purchases.subscriptionsv2.get as jest.Mock;

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
  });

  describe('IOS', () => {
    const iosTestReceipt =
      'MIIUUAYJKoZIhvcNAQcCoIIUQTCCFD0CAQExDzANBglghkgBZQMEAgEFADCCA4YGCSqGSIb3DQEHAaCCA3cEggNzMYIDbzAKAgEIAgEBBAIWADAKAgEUAgEBBAIMADALAgEBAgEBBAMCAQAwCwIBAwIBAQQDDAExMAsCAQsCAQEEAwIBADALAgEPAgEBBAMCAQAwCwIBEAIBAQQDAgEAMAsCARkCAQEEAwIBAzAMAgEKAgEBBAQWAjQrMAwCAQ4CAQEEBAICARcwDQIBDQIBAQQFAgMCmT0wDQIBEwIBAQQFDAMxLjAwDgIBCQIBAQQGAgRQMzAyMBgCAQQCAQI';

    it('정상적인 영수증을 정상적으로 검증해야 함.', async () => {
      mockValidate.mockResolvedValueOnce(true);

      const product: IProduct = {
        productId: 'pickforme_member_ios',
        type: ProductType.SUBSCRIPTION,
        displayName: '테스트 구독',
        point: 100,
        aiPoint: 1000,
        platform: Platform.ANDROID,
        eventId: 3,
      };

      const result = await receiptValidatorService.verifyReceipt('', product);
      expect(result.status).toBe('valid');
    });

    it('구독 영수증이 만료된 경우 영수증 검증 실패', async () => {
      mockValidate.mockResolvedValueOnce(null);

      const product: IProduct = {
        productId: 'pickforme_member_ios',
        type: ProductType.SUBSCRIPTION,
        displayName: '테스트 구독',
        point: 100,
        aiPoint: 1000,
        platform: Platform.ANDROID,
        eventId: 3,
      };

      const result = await receiptValidatorService.verifyReceipt('', product);
      expect(result.status).toBe('expired');
    });

    it('구독 영수증이 유효하지 않은 경우 영수증 검증 실패', async () => {
      mockValidate.mockRejectedValueOnce(new Error('Invalid receipt'));

      const product: IProduct = {
        productId: 'pickforme_member_ios',
        type: ProductType.SUBSCRIPTION,
        displayName: '테스트 구독',
        point: 100,
        aiPoint: 1000,
        platform: Platform.ANDROID,
        eventId: 3,
      };

      const result = await receiptValidatorService.verifyReceipt('', product);
      expect(result.status).toBe('invalid');
    });
  });

  describe('Android', () => {
    const androidTestReceipt = {
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
            offerDetails: [{}],
            latestSuccessfulOrderId: 'GPA.3395-8216-6259-15171',
          },
        ],
      },
    };

    const androidExpiredResponse = {
      data: {
        kind: 'androidpublisher#subscriptionPurchaseV2',
        startTime: '2025-06-13T11:07:49.668Z',
        regionCode: 'KR',
        subscriptionState: 'SUBSCRIPTION_STATE_EXPIRED',
        latestOrderId: 'GPA.3395-8216-6259-15171',
        testPurchase: {},
        acknowledgementState: 'ACKNOWLEDGEMENT_STATE_ACKNOWLEDGED',
        lineItems: [
          {
            productId: 'pickforme_member',
            expiryTime: '2025-06-13T11:12:49.198Z',
            prepaidPlan: {},
            offerDetails: [{}],
            latestSuccessfulOrderId: 'GPA.3395-8216-6259-15171',
          },
        ],
      },
    };

    it('정상적인 영수증을 정상적으로 검증해야 함.', async () => {
      mockGetSubscription.mockResolvedValueOnce(androidSuccessResponse);

      const product: IProduct = {
        productId: 'pickforme_member',
        type: ProductType.SUBSCRIPTION,
        displayName: '테스트 구독',
        point: 100,
        aiPoint: 1000,
        platform: Platform.ANDROID,
        eventId: 3,
      };

      const result = await receiptValidatorService.verifyReceipt(androidTestReceipt, product);
      expect(result.status).toBe('valid');
    });

    it('구독 영수증이 만료된 경우 영수증 검증 실패', async () => {
      mockGetSubscription.mockResolvedValueOnce(androidExpiredResponse);

      const product: IProduct = {
        productId: 'pickforme_member',
        type: ProductType.SUBSCRIPTION,
        displayName: '테스트 구독',
        point: 100,
        aiPoint: 1000,
        platform: Platform.ANDROID,
        eventId: 3,
      };

      const result = await receiptValidatorService.verifyReceipt(androidTestReceipt, product);
      expect(result.status).toBe('expired');
    });

    it('구독 영수증이 유효하지 않은 경우 영수증 검증 실패', async () => {
      mockGetSubscription.mockRejectedValueOnce(new Error('Invalid receipt'));

      const product: IProduct = {
        productId: 'pickforme_member',
        type: ProductType.SUBSCRIPTION,
        displayName: '테스트 구독',
        point: 100,
        aiPoint: 1000,
        platform: Platform.ANDROID,
        eventId: 3,
      };

      const result = await receiptValidatorService.verifyReceipt(androidTestReceipt, product);
      expect(result.status).toBe('invalid');
    });
  });
});
