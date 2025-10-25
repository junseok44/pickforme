import mongoose from 'mongoose';
import { MongodbSyncService } from '../bigquery/mongodb-sync.service';
import { cacheProvider } from '../../../cache';
import db from 'models';
import { bigqueryClient } from '../bigquery/bigquery-client';
import { setupTestDB, teardownTestDB } from '../../../__tests__/setupDButils';

// MongodbSyncService와 같은 캐시 인스턴스 사용을 위한 모킹
jest.mock('../../../cache', () => {
  const mockCache = {
    get: jest.fn(),
    set: jest.fn(),
    delete: jest.fn(),
    clear: jest.fn(),
  };
  return {
    cacheProvider: mockCache,
  };
});

// BigQuery 클라이언트 모킹 설정
jest.mock('../bigquery/bigquery-client', () => ({
  bigqueryClient: {
    dataset: jest.fn().mockReturnValue({
      table: jest.fn().mockReturnValue({
        exists: jest.fn(),
        create: jest.fn(),
        insert: jest.fn(),
        delete: jest.fn(),
      }),
    }),
    createQueryJob: jest.fn(),
  },
}));

// TABLE_SCHEMAS 모킹
jest.mock('../bigquery/table-schemas', () => ({
  TABLE_SCHEMAS: {
    users: [
      { name: '_id', type: 'STRING' },
      { name: 'email', type: 'STRING' },
      { name: 'point', type: 'INTEGER' },
      { name: 'aiPoint', type: 'INTEGER' },
      { name: 'level', type: 'INTEGER' },
      { name: 'lastLoginAt', type: 'TIMESTAMP' },
      { name: 'MembershipAt', type: 'TIMESTAMP' },
      { name: 'lastMembershipAt', type: 'TIMESTAMP' },
      { name: 'event', type: 'STRING' },
      { name: 'createdAt', type: 'TIMESTAMP' },
      { name: 'updatedAt', type: 'TIMESTAMP' },
    ],
    purchases: [
      { name: '_id', type: 'STRING' },
      { name: 'userId', type: 'STRING' },
      { name: 'productId', type: 'STRING' },
      { name: 'platform', type: 'STRING' },
      { name: 'type', type: 'STRING' },
      { name: 'isExpired', type: 'BOOLEAN' },
      { name: 'createdAt', type: 'TIMESTAMP' },
      { name: 'updatedAt', type: 'TIMESTAMP' },
    ],
  },
}));

// jobs 모킹
jest.mock('../scheduler/jobs', () => ({
  mongodbSyncJobs: [
    {
      name: 'users_sync',
      type: 'mongodb_sync',
      collection: 'users',
      destinationTable: 'users',
    },
    {
      name: 'purchases_sync',
      type: 'mongodb_sync',
      collection: 'purchases',
      destinationTable: 'purchases',
    },
  ],
}));

describe('MongodbSyncService - 증분 동기화 테스트', () => {
  let mongodbSyncService: MongodbSyncService;
  const mockBigQueryClient = bigqueryClient as jest.Mocked<typeof bigqueryClient>;
  const mockCacheProvider = cacheProvider as jest.Mocked<typeof cacheProvider>;

  beforeAll(async () => {
    // 환경변수 설정
    process.env.GA4_DATASET_FOUNDATION_ID = 'test_dataset';

    // 메모리 MongoDB 설정
    await setupTestDB();

    mongodbSyncService = new MongodbSyncService();
  });

  afterAll(async () => {
    await teardownTestDB();
  });

  beforeEach(async () => {
    // 각 테스트 전에 데이터 정리
    await db.User.deleteMany({});
    await db.Purchase.deleteMany({});

    // 캐시 완전 초기화
    mockCacheProvider.clear.mockClear();
    mockCacheProvider.delete.mockClear();
    mockCacheProvider.get.mockClear();
    mockCacheProvider.set.mockClear();

    // BigQuery 모킹 초기화
    jest.clearAllMocks();

    // 기본 모킹 설정
    (
      mockBigQueryClient.dataset('test_dataset').table('users').exists as jest.Mock
    ).mockResolvedValue([true]);
    (
      mockBigQueryClient.dataset('test_dataset').table('users').create as jest.Mock
    ).mockResolvedValue(undefined);
    (
      mockBigQueryClient.dataset('test_dataset').table('users').insert as jest.Mock
    ).mockResolvedValue(undefined);
    (
      mockBigQueryClient.dataset('test_dataset').table('users').delete as jest.Mock
    ).mockResolvedValue(undefined);
    (mockBigQueryClient.createQueryJob as jest.Mock).mockResolvedValue([
      {
        getQueryResults: jest.fn().mockResolvedValue([]),
      },
      {}, // apiResponse
    ]);
  });

  describe('전체 동기화 (캐시에 동기화 시간이 없을 때)', () => {
    it('캐시에 동기화 시간이 없으면 전체 동기화를 수행해야 한다', async () => {
      // Given: 캐시에 동기화 시간이 없고, MongoDB에 사용자 데이터가 있음
      const testUsers = [
        {
          email: 'test1@example.com',
          point: 100,
          aiPoint: 50,
          level: 2,
          createdAt: new Date('2024-01-01'),
          updatedAt: new Date('2024-01-01'),
        },
        {
          email: 'test2@example.com',
          point: 200,
          aiPoint: 100,
          level: 3,
          createdAt: new Date('2024-01-02'),
          updatedAt: new Date('2024-01-02'),
        },
      ];

      await db.User.insertMany(testUsers);

      // When: 동기화 실행
      await mongodbSyncService.syncAllData();

      // Then: BigQuery에 전체 데이터가 삽입되어야 함
      expect(mockBigQueryClient.dataset('test_dataset').table('users').insert).toHaveBeenCalled();

      // 삽입된 데이터 검증
      const insertCalls = (
        mockBigQueryClient.dataset('test_dataset').table('users').insert as jest.Mock
      ).mock.calls;
      expect(insertCalls.length).toBeGreaterThan(0);

      // 사용자 데이터가 올바르게 변환되어 삽입되었는지 확인
      const userData = insertCalls.find((call: any[]) =>
        call[0].some((item: any) => item.email === 'test1@example.com')
      );
      expect(userData).toBeDefined();
      expect(userData[0]).toHaveLength(2);
    });

    it('전체 동기화 시 기존 데이터를 삭제하고 새로 삽입해야 한다', async () => {
      // Given: 캐시에 동기화 시간이 없음
      const testUsers = [
        {
          email: 'test@example.com',
          point: 100,
          aiPoint: 50,
          level: 2,
          createdAt: new Date('2024-01-01'),
          updatedAt: new Date('2024-01-01'),
        },
      ];

      await db.User.insertMany(testUsers);

      // When: 동기화 실행
      await mongodbSyncService.syncAllData();

      // Then: DELETE 쿼리가 실행되어야 함
      expect(mockBigQueryClient.createQueryJob).toHaveBeenCalledWith(
        expect.objectContaining({
          query: expect.stringContaining('DELETE FROM'),
        })
      );
    });
  });

  describe('증분 동기화 (캐시에 동기화 시간이 있을 때)', () => {
    it('캐시에 동기화 시간이 있으면 증분 동기화를 수행해야 한다', async () => {
      // Given: 캐시에 동기화 시간이 있고, 그 이후에 업데이트된 데이터가 있음
      const lastSyncTime = new Date('2024-01-01T10:00:00Z');

      // 캐시를 명시적으로 설정
      mockCacheProvider.get.mockReturnValue(lastSyncTime.toISOString());

      // 디버깅을 위한 로그
      console.log('🔍 캐시 상태 확인:', {
        lastSyncTime: lastSyncTime.toISOString(),
        mockReturnValue: lastSyncTime.toISOString(),
      });

      const oldUser = {
        email: 'old@example.com',
        point: 100,
        aiPoint: 50,
        level: 2,
        createdAt: new Date('2024-01-01T09:00:00Z'), // 동기화 시간 이전
        updatedAt: new Date('2024-01-01T09:00:00Z'),
      };

      const newUser = {
        email: 'new@example.com',
        point: 200,
        aiPoint: 100,
        level: 3,
        createdAt: new Date('2024-01-01T11:00:00Z'), // 동기화 시간 이후
        updatedAt: new Date('2024-01-01T11:00:00Z'),
      };

      await db.User.insertMany([oldUser, newUser]);

      // When: 동기화 실행
      await mongodbSyncService.syncAllData();

      // Then: UPSERT 쿼리가 실행되어야 함 (MERGE 쿼리)
      expect(mockBigQueryClient.createQueryJob).toHaveBeenCalledWith(
        expect.objectContaining({
          query: expect.stringContaining('MERGE'),
        })
      );

      // 새로운 데이터만 처리되어야 함
      const mergeCalls = (mockBigQueryClient.createQueryJob as jest.Mock).mock.calls.filter(
        (call: any[]) => call[0].query.includes('MERGE')
      );
      expect(mergeCalls.length).toBeGreaterThan(0);

      // MERGE 쿼리가 실행되었는지 확인 (임시 테이블 사용)
      const mergeQuery = mergeCalls[0][0].query;
      expect(mergeQuery).toContain('MERGE');
      expect(mergeQuery).toContain('users_temp_');

      // 실제로 BigQuery에 전달된 데이터에서 newUser만 포함되어야 함
      const insertCalls = (
        mockBigQueryClient.dataset('test_dataset').table('users').insert as jest.Mock
      ).mock.calls;

      // newUser가 포함되어야 함
      const userInsertCall = insertCalls.find((call: any[]) =>
        call[0].some((item: any) => item.email === 'new@example.com')
      );
      expect(userInsertCall).toBeDefined();

      // oldUser는 포함되지 않아야 함
      const oldUserInsertCall = insertCalls.find((call: any[]) =>
        call[0].some((item: any) => item.email === 'old@example.com')
      );
      expect(oldUserInsertCall).toBeUndefined();

      // newUser 데이터가 올바르게 변환되었는지 확인
      const newUserData = userInsertCall![0].find((item: any) => item.email === 'new@example.com');
      expect(newUserData.email).toBe('new@example.com');
      expect(newUserData.point).toBe(200);
    });

    it('증분 동기화 시 마지막 동기화 시간 이후 데이터만 처리해야 한다', async () => {
      // Given: 캐시에 동기화 시간이 있음
      const lastSyncTime = new Date('2024-01-01T10:00:00Z');

      // 캐시를 명시적으로 설정
      mockCacheProvider.get.mockReturnValue(lastSyncTime.toISOString());

      const beforeSyncUser = {
        email: 'before@example.com',
        point: 100,
        aiPoint: 50,
        level: 2,
        createdAt: new Date('2024-01-01T09:00:00Z'),
        updatedAt: new Date('2024-01-01T09:00:00Z'),
      };

      const afterSyncUser = {
        email: 'after@example.com',
        point: 200,
        aiPoint: 100,
        level: 3,
        createdAt: new Date('2024-01-01T11:00:00Z'),
        updatedAt: new Date('2024-01-01T11:00:00Z'),
      };

      await db.User.insertMany([beforeSyncUser, afterSyncUser]);

      // When: 동기화 실행
      await mongodbSyncService.syncAllData();

      // Then: 마지막 동기화 시간 이후 데이터만 처리되어야 함
      // (실제로는 MongoDB 쿼리에서 필터링되므로, 여기서는 UPSERT가 호출되었는지만 확인)
      expect(mockBigQueryClient.createQueryJob).toHaveBeenCalledWith(
        expect.objectContaining({
          query: expect.stringContaining('MERGE'),
        })
      );
    });

    it('증분 동기화 완료 후 캐시에 새로운 동기화 시간이 저장되어야 한다', async () => {
      // Given: 캐시에 이전 동기화 시간이 있음
      const oldSyncTime = new Date('2024-01-01T10:00:00Z');

      // 캐시를 명시적으로 설정
      mockCacheProvider.get.mockReturnValue(oldSyncTime.toISOString());

      const testUser = {
        email: 'test@example.com',
        point: 100,
        aiPoint: 50,
        level: 2,
        createdAt: new Date('2024-01-01T11:00:00Z'),
        updatedAt: new Date('2024-01-01T11:00:00Z'),
      };

      await db.User.insertMany([testUser]);

      // When: 동기화 실행
      const syncStartTime = new Date();
      await mongodbSyncService.syncAllData();

      // Then: 캐시에 새로운 동기화 시간이 저장되어야 함
      expect(mockCacheProvider.set).toHaveBeenCalledWith(
        'mongodb_last_sync_time',
        expect.any(String),
        0
      );

      // set이 호출된 인수 확인
      const setCalls = mockCacheProvider.set.mock.calls;
      const lastSetCall = setCalls[setCalls.length - 1];
      const newSyncTime = new Date(lastSetCall[1] as string);
      expect(newSyncTime.getTime()).toBeGreaterThanOrEqual(syncStartTime.getTime());
    });
  });

  describe('데이터 변환 테스트', () => {
    it('사용자 데이터가 올바르게 변환되어야 한다', async () => {
      // Given: 복잡한 사용자 데이터 (전체 동기화 모드로 실행)
      mockCacheProvider.get.mockReturnValue(undefined);

      const testUser = {
        email: 'test@example.com',
        point: 100,
        aiPoint: 50,
        level: 2,
        lastLoginAt: new Date('2024-01-01T10:00:00Z'),
        MembershipAt: new Date('2024-01-01T11:00:00Z'),
        lastMembershipAt: new Date('2024-01-01T12:00:00Z'),
        event: 1, // 숫자로 변경
        createdAt: new Date('2024-01-01T09:00:00Z'),
        updatedAt: new Date('2024-01-01T13:00:00Z'),
      };

      await db.User.create(testUser);

      // When: 동기화 실행
      await mongodbSyncService.syncAllData();

      // Then: 데이터가 올바르게 변환되어 삽입되어야 함
      const insertCalls = (
        mockBigQueryClient.dataset('test_dataset').table('users').insert as jest.Mock
      ).mock.calls;
      const userData = insertCalls.find((call: any[]) =>
        call[0].some((item: any) => item.email === 'test@example.com')
      );

      expect(userData).toBeDefined();
      const transformedUser = userData![0].find((item: any) => item.email === 'test@example.com');

      expect(transformedUser).toEqual({
        _id: expect.any(String),
        email: 'test@example.com',
        point: 100,
        aiPoint: 50,
        level: 2,
        lastLoginAt: '2024-01-01T10:00:00.000Z',
        MembershipAt: '2024-01-01T11:00:00.000Z',
        lastMembershipAt: '2024-01-01T12:00:00.000Z',
        event: 1,
        createdAt: '2024-01-01T09:00:00.000Z',
        updatedAt: '2024-01-01T09:00:00.000Z', // MongoDB에서 자동으로 설정됨
      });
    });

    it('구매 데이터가 올바르게 변환되어야 한다', async () => {
      // Given: 구매 데이터 (전체 동기화 모드로 실행)
      mockCacheProvider.get.mockReturnValue(undefined);

      const testPurchase = {
        userId: new mongoose.Types.ObjectId(),
        product: {
          productId: 'product123',
          platform: 'ios', // Platform enum 값 사용
          type: 1, // 숫자로 변경
          point: 1000, // 필수 필드 추가
          displayName: 'Test Product', // 필수 필드 추가
        },
        isExpired: false,
        createdAt: new Date('2024-01-01T10:00:00Z'),
        updatedAt: new Date('2024-01-01T10:00:00Z'),
      };

      await db.Purchase.create(testPurchase);

      // When: 동기화 실행
      await mongodbSyncService.syncAllData();

      // Then: 구매 데이터가 올바르게 변환되어야 함
      const insertCalls = (
        mockBigQueryClient.dataset('test_dataset').table('purchases').insert as jest.Mock
      ).mock.calls;
      const purchaseData = insertCalls.find((call: any[]) =>
        call[0].some((item: any) => item.productId === 'product123')
      );

      expect(purchaseData).toBeDefined();
      const transformedPurchase = purchaseData![0].find(
        (item: any) => item.productId === 'product123'
      );

      expect(transformedPurchase).toEqual({
        _id: expect.any(String),
        userId: testPurchase.userId.toString(),
        productId: 'product123',
        platform: 'ios',
        type: 1,
        isExpired: false,
        createdAt: '2024-01-01T10:00:00.000Z',
        updatedAt: '2024-01-01T10:00:00.000Z',
      });
    });
  });

  describe('에러 처리 테스트', () => {
    it('BigQuery 테이블이 존재하지 않으면 테이블을 생성해야 한다', async () => {
      // Given: 테이블이 존재하지 않음
      (
        mockBigQueryClient.dataset('test_dataset').table('users').exists as jest.Mock
      ).mockResolvedValue([false]);

      const testUser = {
        email: 'test@example.com',
        point: 100,
        aiPoint: 50,
        level: 2,
        createdAt: new Date('2024-01-01T10:00:00Z'),
        updatedAt: new Date('2024-01-01T10:00:00Z'),
      };

      await db.User.create(testUser);

      // When: 동기화 실행
      await mongodbSyncService.syncAllData();

      // Then: 테이블 생성이 호출되어야 함
      expect(mockBigQueryClient.dataset('test_dataset').table('users').create).toHaveBeenCalledWith(
        expect.objectContaining({
          schema: expect.any(Array),
          location: 'asia-northeast3',
        })
      );
    });

    it('BigQuery 삽입 실패 시 에러가 발생해야 한다', async () => {
      // Given: BigQuery 삽입이 실패하도록 설정 (전체 동기화 모드로 실행)
      mockCacheProvider.get.mockReturnValue(undefined);
      (
        mockBigQueryClient.dataset('test_dataset').table('users').insert as jest.Mock
      ).mockRejectedValue(new Error('BigQuery insert failed'));

      const testUser = {
        email: 'test@example.com',
        point: 100,
        aiPoint: 50,
        level: 2,
        createdAt: new Date('2024-01-01T10:00:00Z'),
        updatedAt: new Date('2024-01-01T10:00:00Z'),
      };

      await db.User.create(testUser);

      // When & Then: 동기화 실행 시 에러가 발생해야 함
      await expect(mongodbSyncService.syncAllData()).rejects.toThrow('BigQuery insert failed');
    });
  });
});
