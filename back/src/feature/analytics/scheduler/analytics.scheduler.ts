import cron from 'node-cron';
import {
  handleFoundationEtlJobs,
  handleSummaryEtlJobs,
  handleMongodbSyncJobs,
} from '../analytics.handlers';
import { log } from '../../../utils/logger/logger'; // 실제 로거 경로에 맞게 수정

const FOUNDATION_SCHEDULER_NAME = 'bigquery-foundation-etl';
const SUMMARY_SCHEDULER_NAME = 'bigquery-summary-etl';
const MONGODB_SYNC_SCHEDULER_NAME = 'mongodb-sync-etl';

/**
 * 1단계: Foundation ETL 스케줄러 등록
 * Raw 데이터를 가공하여 중간 테이블을 생성합니다.
 */
function registerFoundationEtlScheduler() {
  // 매일 9시에 실행
  cron.schedule(
    '0 9 * * *',
    async () => {
      log.info('🚀 Foundation ETL 스케줄러 실행됨', 'SCHEDULER', 'LOW', {
        scheduler: FOUNDATION_SCHEDULER_NAME,
      });
      await handleFoundationEtlJobs();
    },
    {
      timezone: 'Asia/Seoul',
    }
  );
}

/**
 * 2단계: Summary ETL 스케줄러 등록
 * Raw 데이터와 중간 테이블을 사용하여 최종 요약 테이블을 생성합니다.
 */
function registerSummaryEtlScheduler() {
  // 매일 9시 5분에 실행 (Foundation 작업이 끝날 시간을 충분히 확보)
  cron.schedule(
    '5 9 * * *',
    async () => {
      log.info('📊 Summary ETL 스케줄러 실행됨', 'SCHEDULER', 'LOW', {
        scheduler: SUMMARY_SCHEDULER_NAME,
      });
      await handleSummaryEtlJobs();
    },
    {
      timezone: 'Asia/Seoul',
    }
  );
}

/**
 * 3단계: MongoDB 동기화 스케줄러 등록
 * MongoDB 데이터를 BigQuery로 동기화합니다.
 */
function registerMongodbSyncScheduler() {
  // 매일 자정에 증분 동기화
  cron.schedule(
    '0 0 * * *',
    async () => {
      log.info('🔄 MongoDB 동기화 스케줄러 실행됨', 'SCHEDULER', 'LOW', {
        scheduler: MONGODB_SYNC_SCHEDULER_NAME,
      });
      await handleMongodbSyncJobs();
    },
    {
      timezone: 'Asia/Seoul',
    }
  );
}

/**
 * 모든 Analytics 관련 스케줄러를 등록하고 시작합니다.
 * 이 함수를 애플리케이션의 메인 시작점에서 호출합니다.
 */
export function registerAnalyticsSchedulers() {
  registerMongodbSyncScheduler();
  registerFoundationEtlScheduler();
  registerSummaryEtlScheduler();

  log.info('✅ All Analytics schedulers have been registered.', 'SCHEDULER', 'LOW');
}
