// src/features/analytics/analytics.handlers.ts

import { foundationJobs, summaryJobs } from './scheduler/jobs';
import { checkDataAvailability, runEtlJob } from './analytics.service';
import { mongodbSyncService } from './bigquery/mongodb-sync.service';
import { log } from '../../utils/logger/logger';

// .env 파일에서 데이터셋 이름 가져오기
const FOUNDATION_DATASET = process.env.GA4_DATASET_FOUNDATION_ID!;
const SUMMARY_DATASET = process.env.GA4_DATASET_SUMMARY_ID!;
const MAX_RETRIES = 10;
const RETRY_DELAY = 60 * 60 * 1000; // 1시간

// 핸들러 1: 기초 공사(Foundation) ETL
export const handleFoundationEtlJobs = async (targetDate?: string) => {
  const SCHEDULER_NAME = 'bigquery-foundation-etl';

  for (let attempt = 1; attempt <= MAX_RETRIES; attempt++) {
    try {
      // 1. 데이터 가용성 체크 (실제 처리할 날짜로 체크)
      const isDataAvailable = await checkDataAvailability(targetDate);

      if (!isDataAvailable) {
        if (attempt < MAX_RETRIES) {
          console.log(`데이터 미준비, 1시간 후 재시도 (${attempt}/${MAX_RETRIES})`);
          void log.warn(
            `데이터 미준비, 1시간 후 재시도 (${attempt}/${MAX_RETRIES})`,
            'SCHEDULER',
            'MEDIUM',
            {
              scheduler: SCHEDULER_NAME,
              attempt,
              retryDelay: RETRY_DELAY,
            }
          );
          await new Promise((resolve) => setTimeout(resolve, RETRY_DELAY));
          continue;
        } else {
          throw new Error('최대 재시도 횟수 초과 - 데이터 미준비');
        }
      }

      // 2. ETL 작업 실행
      console.log('[START] Starting all FOUNDATION ETL jobs...');
      for (const job of foundationJobs) {
        await runEtlJob(job, FOUNDATION_DATASET, targetDate);
      }

      void log.info('✅ Foundation ETL 완료', 'SCHEDULER', 'LOW', {
        scheduler: SCHEDULER_NAME,
        attempt,
      });
      break; // 성공 시 루프 종료
    } catch (error) {
      if (attempt === MAX_RETRIES) {
        void log.error('Foundation ETL 최종 실패', 'SCHEDULER', 'HIGH', {
          scheduler: SCHEDULER_NAME,
          error: error instanceof Error ? error.message : 'Unknown error',
          totalAttempts: MAX_RETRIES,
        });
        throw error;
      } else {
        void log.warn(
          `Foundation ETL 실패, 1시간 후 재시도 (${attempt}/${MAX_RETRIES})`,
          'SCHEDULER',
          'MEDIUM',
          {
            scheduler: SCHEDULER_NAME,
            attempt,
            error: error instanceof Error ? error.message : 'Unknown error',
          }
        );
        await new Promise((resolve) => setTimeout(resolve, RETRY_DELAY));
      }
    }
  }
};

// 핸들러 2: 최종 요약(Summary) ETL
export const handleSummaryEtlJobs = async (targetDate?: string) => {
  const SCHEDULER_NAME = 'bigquery-summary-etl';

  for (let attempt = 1; attempt <= MAX_RETRIES; attempt++) {
    try {
      // 1. 데이터 가용성 체크 (실제 처리할 날짜로 체크)
      const isDataAvailable = await checkDataAvailability(targetDate);

      if (!isDataAvailable) {
        if (attempt < MAX_RETRIES) {
          console.log(`데이터 미준비, 1시간 후 재시도 (${attempt}/${MAX_RETRIES})`);
          void log.warn(
            `데이터 미준비, 1시간 후 재시도 (${attempt}/${MAX_RETRIES})`,
            'SCHEDULER',
            'MEDIUM',
            {
              scheduler: SCHEDULER_NAME,
              attempt,
              retryDelay: RETRY_DELAY,
            }
          );
          await new Promise((resolve) => setTimeout(resolve, RETRY_DELAY));
          continue;
        } else {
          throw new Error('최대 재시도 횟수 초과 - 데이터 미준비');
        }
      }

      // 2. ETL 작업 실행
      console.log('[START] Starting all SUMMARY ETL jobs...');
      for (const job of summaryJobs) {
        await runEtlJob(job, SUMMARY_DATASET, targetDate);
      }

      void log.info('✅ Summary ETL 완료', 'SCHEDULER', 'LOW', {
        scheduler: SCHEDULER_NAME,
        attempt,
      });
      break; // 성공 시 루프 종료
    } catch (error) {
      if (attempt === MAX_RETRIES) {
        void log.error('Summary ETL 최종 실패', 'SCHEDULER', 'HIGH', {
          scheduler: SCHEDULER_NAME,
          error: error instanceof Error ? error.message : 'Unknown error',
          totalAttempts: MAX_RETRIES,
        });
        throw error;
      } else {
        void log.warn(
          `Summary ETL 실패, 1시간 후 재시도 (${attempt}/${MAX_RETRIES})`,
          'SCHEDULER',
          'MEDIUM',
          {
            scheduler: SCHEDULER_NAME,
            attempt,
            error: error instanceof Error ? error.message : 'Unknown error',
          }
        );
        await new Promise((resolve) => setTimeout(resolve, RETRY_DELAY));
      }
    }
  }
};

// 핸들러 3: MongoDB 데이터 동기화
export const handleMongodbSyncJobs = async () => {
  const SCHEDULER_NAME = 'mongodb-sync-etl';
  try {
    console.log('[START] Starting MongoDB sync jobs...');

    // MongoDB 데이터 동기화
    await mongodbSyncService.syncAllData();

    log.info('✅ MongoDB 동기화 완료', 'SCHEDULER', 'LOW', { scheduler: SCHEDULER_NAME });
  } catch (error) {
    void log.error('❌ MongoDB 동기화 실패', 'SCHEDULER', 'HIGH', {
      scheduler: SCHEDULER_NAME,
      error: error instanceof Error ? error.message : 'Unknown error',
    });
  }
};

// 핸들러 5: 전체 ETL 파이프라인 실행
export const handleFullEtlPipeline = async () => {
  const SCHEDULER_NAME = 'full-etl-pipeline';
  try {
    console.log('[START] Starting full ETL pipeline...');

    // 1. MongoDB 동기화
    // await handleMongodbSyncJobs();

    // 2. Foundation ETL
    await handleFoundationEtlJobs();

    // 3. Summary ETL
    await handleSummaryEtlJobs();

    log.info('✅ 전체 ETL 파이프라인 완료', 'SCHEDULER', 'LOW', { scheduler: SCHEDULER_NAME });
  } catch (error) {
    void log.error('❌ 전체 ETL 파이프라인 실패', 'SCHEDULER', 'HIGH', {
      scheduler: SCHEDULER_NAME,
      error: error instanceof Error ? error.message : 'Unknown error',
    });
  }
};
