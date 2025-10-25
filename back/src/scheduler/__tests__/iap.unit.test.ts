// src/scheduler/__tests__/iap.test.ts
jest.mock('models', () => {
  const mockUser = {
    findById: jest.fn(),
    findOneAndUpdate: jest.fn(),
  };
  const mockPurchase = {
    find: jest.fn(),
  };
  const mockProduct = {
    findOne: jest.fn(),
  };
  const mockSession = {
    findOne: jest.fn(),
  };
  return {
    __esModule: true,
    default: {
      User: mockUser,
      Purchase: mockPurchase,
      Product: mockProduct,
      Session: mockSession,
    },
    User: mockUser,
    Purchase: mockPurchase,
    Product: mockProduct,
    Session: mockSession,
  };
});

jest.mock('utils/iap', () => ({
  __esModule: true,
  default: {
    validate: jest.fn(),
  },
}));

jest.mock('utils/logger/logger', () => ({
  log: {
    info: jest.fn(),
    error: jest.fn(),
  },
}));

jest.mock('node-cron', () => ({
  schedule: jest.fn(),
}));

jest.mock('socket', () => ({
  emit: jest.fn(),
}));

jest.mock('utils/push', () => ({
  __esModule: true,
  default: jest.fn(),
}));

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

import db from 'models';
import iapValidator from 'utils/iap';
import { handleIAPScheduler } from '../iap';
import { google } from 'googleapis';

describe('IAP Scheduler (unit)', () => {
  const RealDate = Date;
  const mockDate = new RealDate('2023-02-02T15:00:00.000Z');

  beforeEach(() => {
    jest.clearAllMocks();
    jest.spyOn(global, 'Date').mockImplementation((...args: [string | number | Date] | []) => {
      if (args.length === 0) {
        return new RealDate(mockDate);
      }
      return new RealDate(...args);
    });
  });

  afterAll(() => {
    global.Date = RealDate;
  });

  it('IOS에서 해당 영수증에 대한 활성화된 구독이 없다면 픽포미 구독을 구독을 만료 처리하고 유저 포인트를 초기화한다.', async () => {
    const mockPurchase = {
      _id: 'purchase1',
      userId: 'user1',
      receipt: 'receipt1', // ios의 영수증
      product: { productId: 'product1' },
      purchase: { transactionId: 'old' },
      isExpired: false,
      updateExpiration: jest.fn(),
    };

    (db.Purchase.find as jest.Mock).mockResolvedValue([mockPurchase]);
    (iapValidator.validate as jest.Mock).mockResolvedValue(null);
    (db.User.findOneAndUpdate as jest.Mock).mockResolvedValue(undefined);

    await handleIAPScheduler();

    expect(mockPurchase.updateExpiration).toHaveBeenCalled();
  });

  it('Android에서 해당 영수증에 대한 활성화된 구독이 없다면 픽포미 구독을 구독을 만료 처리하고 유저 포인트를 초기화한다.', async () => {
    const mockPurchase = {
      _id: 'purchase1',
      userId: 'user1',
      receipt: {},
      product: { productId: 'product1' },
      purchase: { transactionId: 'old' },
      isExpired: false,
      updateExpiration: jest.fn(),
    };

    (db.Purchase.find as jest.Mock).mockResolvedValue([mockPurchase]);
    (
      google.androidpublisher({
        version: 'v3',
      }).purchases.subscriptionsv2.get as jest.Mock
    ).mockResolvedValue({
      data: {
        subscriptionState: 'SUBSCRIPTION_STATE_EXPIRED',
      },
    });
    (db.User.findOneAndUpdate as jest.Mock).mockResolvedValue(undefined);

    await handleIAPScheduler();

    expect(mockPurchase.updateExpiration).toHaveBeenCalled();
  });
});
