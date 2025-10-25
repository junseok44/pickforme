// __tests__/scheduler/coupang.test.ts
import { preloadCoupangAPI } from '../api.service';
import { handleCoupangPreload } from '../scheduler';
import { COUPANG_CATEGORIES } from '../categories';
import { cacheProvider } from 'cache';
import { cacheKey } from '../../../constants/cacheKey';
import axios from 'axios';

jest.mock('axios', () => ({
  __esModule: true,
  default: {
    get: jest.fn(),
    post: jest.fn(),
    create: jest.fn(),
  },
}));

jest.mock('cache', () => {
  const store = new Map();
  return {
    cacheProvider: {
      get: jest.fn(() => null),
      set: jest.fn((key, value) => store.set(key, value)),
    },
  };
});

const mockedAxios = axios as jest.Mocked<typeof axios>;

describe('Coupang Preload Scheduler', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('preloadCoupangAPI는 모든 카테고리를 강제로 fetch하고 캐시에 저장한다', async () => {
    (mockedAxios.get as jest.Mock).mockImplementation((url: string) => {
      if (url.includes('/goldbox')) {
        return Promise.resolve({
          data: {
            data: [
              {
                productId: 'goldbox-123',
                productName: 'Goldbox Product',
                productPrice: 10000,
                productImage: 'image.jpg',
                productUrl: 'https://example.com',
              },
            ],
          },
        });
      }
      return Promise.resolve({
        data: {
          data: [
            {
              productId: 'test-123',
              productName: 'Test Product',
              productPrice: 5000,
              productImage: 'test.jpg',
              productUrl: 'https://test.com',
            },
          ],
        },
      });
    });

    (mockedAxios.post as jest.Mock).mockImplementation((url: string) => {
      return Promise.resolve({
        data: {
          data: [{ originalUrl: 'https://example.com', shortUrl: 'https://short.com' }],
        },
      });
    });

    await preloadCoupangAPI();

    const categoryIds = Object.keys(COUPANG_CATEGORIES);

    // 1. 골드박스 호출 확인 (첫 번째 호출)
    expect(mockedAxios.get).toHaveBeenNthCalledWith(
      1,
      expect.stringContaining('/products/goldbox'),
      expect.any(Object)
    );

    // 2. 각 카테고리 호출 확인 (순서는 중요하지 않음)
    for (const categoryId of categoryIds) {
      expect(mockedAxios.get).toHaveBeenCalledWith(
        expect.stringContaining(`/products/bestcategories/${categoryId}`),
        expect.any(Object)
      );
    }

    // 3. 캐시 저장 확인
    expect(cacheProvider.set).toHaveBeenCalledWith(
      cacheKey.coupang.goldbox,
      expect.arrayContaining([
        expect.objectContaining({
          id: 'goldbox-123',
          name: 'Goldbox Product',
          platform: 'coupang',
        }),
      ])
    );

    // 각 카테고리 캐시 저장 확인
    for (const categoryId of categoryIds) {
      const key = cacheKey.coupang.bestCategories(categoryId);
      expect(cacheProvider.set).toHaveBeenCalledWith(
        key,
        expect.arrayContaining([
          expect.objectContaining({
            id: 'test-123',
            name: 'Test Product',
            platform: 'coupang',
          }),
        ])
      );
    }

    // 4. 전체 호출 수 확인
    expect(mockedAxios.get).toHaveBeenCalledTimes(categoryIds.length + 1);
  });

  it('handleCoupangPreload는 preloadCoupangAPI를 호출한다', async () => {
    const preloadSpy = jest.spyOn(require('../api.service'), 'preloadCoupangAPI');
    await handleCoupangPreload();
    expect(preloadSpy).toHaveBeenCalled();
  });
});
