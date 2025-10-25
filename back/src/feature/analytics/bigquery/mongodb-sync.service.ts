import { bigqueryClient } from './bigquery-client';
import { TABLE_SCHEMAS } from './table-schemas';
import db from 'models';
import { log } from '../../../utils/logger/logger';
import { cacheProvider } from '../../../cache';

export class MongodbSyncService {
  private readonly BATCH_SIZE = 1000;

  private readonly DATASET_ID = process.env.GA4_DATASET_FOUNDATION_ID!;

  /**
   * 테이블 자동 생성 함수
   */
  private async ensureTableExists(tableName: string) {
    try {
      console.log(`🔍 Checking table ${this.DATASET_ID}.${tableName}...`);

      const dataset = bigqueryClient.dataset(this.DATASET_ID, {
        location: 'asia-northeast3',
      });

      const table = dataset.table(tableName);
      const [exists] = await table.exists();

      if (!exists) {
        const schema = TABLE_SCHEMAS[tableName];
        if (!schema) {
          throw new Error(`Schema not found for table: ${tableName}`);
        }

        console.log(`🏗️ Creating table ${this.DATASET_ID}.${tableName} with schema...`);
        await table.create({
          schema: schema,
          location: 'asia-northeast3',
        });
        console.log(`✅ Table ${this.DATASET_ID}.${tableName} created successfully`);
      } else {
        console.log(`✅ Table ${this.DATASET_ID}.${tableName} already exists`);
      }
    } catch (error) {
      console.error(`❌ Failed to create table ${this.DATASET_ID}.${tableName}:`, error);
      throw error;
    }
  }

  /**
   * 테이블 데이터만 삭제하는 함수
   */
  private async clearTableData(tableName: string) {
    try {
      console.log(`🗑️ Clearing data from table ${this.DATASET_ID}.${tableName}...`);

      const dataset = bigqueryClient.dataset(this.DATASET_ID, {
        location: 'asia-northeast3',
      });
      const table = dataset.table(tableName);

      // 테이블 존재 확인
      const [exists] = await table.exists();

      if (exists) {
        // 데이터만 삭제 (테이블 구조는 유지)
        const query = `DELETE FROM \`${this.DATASET_ID}.${tableName}\` WHERE TRUE`;
        const [job] = await bigqueryClient.createQueryJob({
          query: query,
          location: 'asia-northeast3',
        });

        await job.getQueryResults();
        console.log(`✅ Cleared data from table ${this.DATASET_ID}.${tableName}`);
      } else {
        // 테이블이 없으면 새로 생성
        const schema = TABLE_SCHEMAS[tableName];
        if (!schema) {
          throw new Error(`Schema not found for table: ${tableName}`);
        }

        await table.create({
          schema: schema,
          location: 'asia-northeast3',
        });
        console.log(`✅ Created table ${this.DATASET_ID}.${tableName}`);
      }
    } catch (error) {
      console.error(`❌ Failed to clear table ${tableName}:`, error);
      throw error;
    }
  }

  /**
   * 모든 데이터를 증분 동기화
   */
  async syncAllData() {
    try {
      log.info('MongoDB 동기화 시작', 'SCHEDULER', 'LOW');

      // jobs.ts에서 정의된 MongoDB 동기화 작업들만 실행
      const { mongodbSyncJobs } = await import('../scheduler/jobs');

      const lastSync = await this.getLastSyncTime();
      const isFullSync = !lastSync; // 마지막 동기화 시간이 없으면 전체 동기화

      if (isFullSync) {
        log.info('전체 동기화 모드: 모든 데이터를 새로 동기화합니다', 'SCHEDULER', 'LOW');
      } else {
        log.info(
          `증분 동기화 모드: ${lastSync.toISOString()} 이후 데이터만 동기화합니다`,
          'SCHEDULER',
          'LOW'
        );
      }

      // 각 작업을 순차적으로 실행
      for (const job of mongodbSyncJobs) {
        if (job.type === 'mongodb_sync') {
          console.log(`🔄 Processing ${job.name}...`);

          // 테이블 존재 확인
          await this.ensureTableExists(job.destinationTable);

          if (isFullSync) {
            // 전체 동기화: 기존 데이터 삭제 후 전체 데이터 동기화
            await this.clearTableData(job.destinationTable);
            await this.syncCollection(job.collection!, job.destinationTable);
          } else {
            // 증분 동기화: 마지막 동기화 시간 이후 데이터만 동기화
            await this.syncCollection(job.collection!, job.destinationTable, lastSync);
          }

          console.log(`✅ ${job.name} 완료`);
        }
      }

      await this.updateLastSyncTime(new Date());

      log.info('MongoDB 동기화 완료', 'SCHEDULER', 'LOW');
    } catch (error) {
      void log.error('MongoDB 동기화 실패', 'SCHEDULER', 'HIGH', { error });
      throw error;
    }
  }

  /**
   * 동적으로 컬렉션 동기화
   */
  private async syncCollection(collectionName: string, tableName: string, lastSyncTime?: Date) {
    const query = lastSyncTime ? { updatedAt: { $gt: lastSyncTime } } : {};

    // 증분 동기화인 경우 로그 출력
    if (lastSyncTime) {
      log.info(
        `${collectionName} 증분 동기화 시작: ${lastSyncTime.toISOString()} 이후 데이터`,
        'SCHEDULER',
        'LOW'
      );
    } else {
      log.info(`${collectionName} 전체 동기화 시작`, 'SCHEDULER', 'LOW');
    }

    let skip = 0;
    let hasMore = true;
    let totalProcessed = 0;

    while (hasMore) {
      let data: any[];

      // 컬렉션별로 다른 모델 사용
      switch (collectionName) {
        case 'users':
          data = await db.User.find(query).skip(skip).limit(this.BATCH_SIZE).lean();
          break;
        case 'purchases':
          data = await db.Purchase.find(query).skip(skip).limit(this.BATCH_SIZE).lean();
          break;
        case 'purchase_failures':
          data = await db.PurchaseFailure.find(query).skip(skip).limit(this.BATCH_SIZE).lean();
          break;
        case 'requests':
          data = await db.Request.find(query).skip(skip).limit(this.BATCH_SIZE).lean();
          break;
        default:
          throw new Error(`Unknown collection: ${collectionName}`);
      }

      if (data.length === 0) {
        hasMore = false;
        break;
      }

      // 컬렉션별로 다른 변환 로직 적용
      const transformedData = this.transformData(collectionName, data);

      await this.insertBatchToBigQuery(tableName, transformedData, !!lastSyncTime);

      totalProcessed += data.length;
      skip += this.BATCH_SIZE;

      // 진행 상황 로그
      if (totalProcessed % (this.BATCH_SIZE * 5) === 0) {
        log.info(
          `${collectionName} 동기화 진행: ${totalProcessed}개 레코드 처리됨`,
          'SCHEDULER',
          'LOW'
        );
      }
    }

    log.info(
      `${collectionName} 데이터 동기화 완료 (총 ${totalProcessed}개 레코드)`,
      'SCHEDULER',
      'LOW'
    );
  }

  /**
   * 컬렉션별 데이터 변환
   */
  private transformData(collectionName: string, data: any[]): any[] {
    switch (collectionName) {
      case 'users':
        return data.map((user) => ({
          _id: user._id.toString(),
          email: user.email,
          point: Number(user.point) || 0,
          aiPoint: Number(user.aiPoint) || 0,
          level: Number(user.level) || 1,
          lastLoginAt: user.lastLoginAt?.toISOString() || null,
          MembershipAt: user.MembershipAt?.toISOString() || null,
          lastMembershipAt: user.lastMembershipAt?.toISOString() || null,
          event: user.event || null,
          createdAt: user.createdAt?.toISOString() || null,
          updatedAt: user.updatedAt?.toISOString() || null,
        }));

      case 'purchases':
        return data.map((purchase) => ({
          _id: purchase._id.toString(),
          userId: purchase.userId.toString(),
          productId: purchase.product?.productId || null,
          platform: purchase.product?.platform || null,
          type: purchase.product?.type || null,
          isExpired: purchase.isExpired || false,
          createdAt: purchase.createdAt.toISOString(),
          updatedAt: purchase.updatedAt.toISOString(),
        }));

      case 'purchase_failures':
        return data.map((failure) => ({
          _id: failure._id.toString(),
          userId: failure.userId?.toString() || null,
          productId: failure.productId?.toString() || null,
          status: failure.status || null,
          platform: failure.platform || null,
          createdAt: failure.createdAt.toISOString(),
          updatedAt: failure.updatedAt.toISOString(),
        }));

      case 'requests':
        return data.map((request) => ({
          _id: request._id.toString(),
          userId: request.userId?.toString() || null,
          status: request.status || null,
          type: request.type || null,
          name: request.name || null,
          text: request.text || null,
          product: request.product ? JSON.stringify(request.product) : null,
          review: request.review ? JSON.stringify(request.review) : null,
          answer: request.answer ? JSON.stringify(request.answer) : null,
          createdAt: request.createdAt?.toISOString() || null,
          updatedAt: request.updatedAt?.toISOString() || null,
        }));

      default:
        throw new Error(`Unknown collection: ${collectionName}`);
    }
  }

  /**
   * BigQuery에 배치 데이터 삽입 (증분 동기화 시 UPSERT 사용)
   */
  private async insertBatchToBigQuery(tableName: string, data: any[], isIncremental = false) {
    if (data.length === 0) return;

    try {
      console.log(
        `📊 ${isIncremental ? 'Upserting' : 'Inserting'} data to ${this.DATASET_ID}.${tableName}...`
      );

      const dataset = bigqueryClient.dataset(this.DATASET_ID, {
        location: 'asia-northeast3',
      });
      const table = dataset.table(tableName);

      if (isIncremental) {
        // 증분 동기화: UPSERT 사용 (MERGE 쿼리)
        await this.upsertData(tableName, data);
      } else {
        // 전체 동기화: 일반 INSERT
        await table.insert(data);
      }

      console.log(
        `✅ ${isIncremental ? 'Upserted' : 'Inserted'} ${data.length} records to ${this.DATASET_ID}.${tableName}`
      );
    } catch (error) {
      console.error(
        `❌ Failed to ${isIncremental ? 'upsert' : 'insert'} data to ${this.DATASET_ID}.${tableName}:`,
        error
      );
      throw error;
    }
  }

  /**
   * UPSERT를 위한 MERGE 쿼리 실행
   */
  private async upsertData(tableName: string, data: any[]) {
    if (data.length === 0) return;

    // 임시 테이블에 데이터 삽입 후 MERGE 실행
    const tempTableName = `${tableName}_temp_${Date.now()}`;
    const dataset = bigqueryClient.dataset(this.DATASET_ID, {
      location: 'asia-northeast3',
    });

    try {
      // 1. 임시 테이블 생성 및 데이터 삽입
      const tempTable = dataset.table(tempTableName);
      await tempTable.create({
        schema: TABLE_SCHEMAS[tableName],
      });

      await tempTable.insert(data);

      // 2. MERGE 쿼리 실행
      const columns = Object.keys(data[0]);
      const updateColumns = columns.filter((key) => key !== '_id');

      const mergeQuery = `
        MERGE \`${this.DATASET_ID}.${tableName}\` AS target
        USING \`${this.DATASET_ID}.${tempTableName}\` AS source
        ON target._id = source._id
        WHEN MATCHED THEN
          UPDATE SET
            ${updateColumns.map((key) => `${key} = source.${key}`).join(',\n            ')}
        WHEN NOT MATCHED THEN
          INSERT (${columns.join(', ')})
          VALUES (${columns.map((key) => `source.${key}`).join(', ')})
      `;

      const [job] = await bigqueryClient.createQueryJob({
        query: mergeQuery,
        location: 'asia-northeast3',
      });

      await job.getQueryResults();

      // 3. 임시 테이블 삭제
      await tempTable.delete();
    } catch (error) {
      // 임시 테이블 정리
      try {
        const tempTable = dataset.table(tempTableName);
        await tempTable.delete();
      } catch (cleanupError) {
        console.warn('임시 테이블 정리 실패:', cleanupError);
      }
      throw error;
    }
  }

  /**
   * 마지막 동기화 시간 조회
   */
  private async getLastSyncTime(): Promise<Date | undefined> {
    const lastSync = cacheProvider.get<string>('mongodb_last_sync_time');
    console.log('🔍 MongodbSyncService.getLastSyncTime:', {
      lastSync,
      isUndefined: lastSync === undefined,
      cacheProvider: cacheProvider.constructor.name,
    });
    return lastSync ? new Date(lastSync) : undefined;
  }

  /**
   * 마지막 동기화 시간 업데이트
   */
  private async updateLastSyncTime(time: Date) {
    // 캐시에 마지막 동기화 시간 저장 (TTL 없이 영구 저장)
    cacheProvider.set('mongodb_last_sync_time', time.toISOString(), 0);
    void log.info(`마지막 동기화 시간 업데이트: ${time.toISOString()}`, 'SCHEDULER', 'LOW');
  }
}

export const mongodbSyncService = new MongodbSyncService();
