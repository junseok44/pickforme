import cron from 'node-cron';
import { preloadCoupangAPI } from './api.service';
import { log } from 'utils/logger/logger';

const SCHEDULER_NAME = 'coupang-preload';

export const handleCoupangPreload = async () => {
  try {
    await preloadCoupangAPI();
    log.info('✅ Coupang 캐시 스케줄러 실행 완료', 'SCHEDULER', 'LOW', {
      scheduler: SCHEDULER_NAME,
    });
  } catch (error) {
    if (error instanceof Error)
      void log.error('❌ Coupang 캐시 스케줄러 실행 실패', 'SCHEDULER', 'HIGH', {
        scheduler: SCHEDULER_NAME,
        name: error.name,
        message: error.message,
        stack: error.stack,
      });
  }
};

export function registerCoupangAPIScheduler() {
  cron.schedule('0 0 * * *', handleCoupangPreload, {
    timezone: 'Asia/Seoul',
  });
}
