import { log } from 'utils/logger';
import { backupDatabase } from 'utils/backup';
import cron from 'node-cron';
import '../env';

const SCHEDULER_NAME = 'backup';

const handleBackupScheduler = async () => {
  try {
    void log.info('데이터베이스 백업 스케줄러 실행', 'SYSTEM', 'LOW', {
      scheduler: SCHEDULER_NAME,
    });

    const result = await backupDatabase();

    if (!result.success) {
      throw new Error('백업 실패');
    }
  } catch (error) {
    void log.error('백업 스케줄러 실행 중 오류 발생', 'SYSTEM', 'HIGH', {
      scheduler: SCHEDULER_NAME,
      error,
    });
  }
};

// 수동 테스트를 위한 함수 추가
export const testBackupScheduler = handleBackupScheduler;

export const registerBackupScheduler = () => {
  // 매일 자정에 실행
  cron.schedule('0 0 * * *', handleBackupScheduler);
};
