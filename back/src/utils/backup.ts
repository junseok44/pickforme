import { exec } from 'child_process';
import { promisify } from 'util';
import path from 'path';
import fs from 'fs';
import { log } from './logger';

const execAsync = promisify(exec);

const BACKUP_DIR = path.join(process.cwd(), 'backups');
const RETENTION_DAYS = 7;
const dbName = process.env.MODE === 'dev' ? 'pickforme-dev' : 'pickforme-production';

// 백업 디렉토리 생성
const ensureBackupDir = () => {
  if (!fs.existsSync(BACKUP_DIR)) {
    fs.mkdirSync(BACKUP_DIR, { recursive: true });
  }
};

// 오래된 백업 파일 삭제
const cleanupOldBackups = async () => {
  try {
    const files = fs.readdirSync(BACKUP_DIR);
    const now = Date.now();

    for (const file of files) {
      // backup-타임스탬프 형식만 처리
      const match = file.match(/^backup-(\d+)$/);
      if (!match) continue;

      const fileTimestamp = Number(match[1]);
      const fileAge = (now - fileTimestamp) / (1000 * 60 * 60 * 24);

      if (fileAge > RETENTION_DAYS) {
        const filePath = path.join(BACKUP_DIR, file);
        fs.rmSync(filePath, { recursive: true, force: true });
        void log.info(`오래된 백업 파일 삭제: ${file}`, 'SYSTEM', 'LOW');
      }
    }
  } catch (error) {
    void log.error('백업 파일 정리 중 오류 발생', 'SYSTEM', 'HIGH', { error });
  }
};

// MongoDB Atlas 백업 실행
export const backupDatabase = async () => {
  try {
    ensureBackupDir();

    const timestamp = Date.now(); // 유닉스 타임스탬프 (ms)
    const backupPath = path.join(BACKUP_DIR, `backup-${timestamp}`);

    // MongoDB Atlas URI에서 데이터베이스 이름 추출

    // mongodump 명령어 실행
    await execAsync(
      `mongodump --uri="${process.env.MONGO_URI}" --db="${dbName}" --out="${backupPath}"`
    );

    void log.info('데이터베이스 백업 완료', 'SYSTEM', 'LOW', {
      backupPath,
      timestamp,
    });

    // 오래된 백업 정리
    await cleanupOldBackups();

    return { success: true, backupPath };
  } catch (error) {
    void log.error('데이터베이스 백업 실패', 'SYSTEM', 'HIGH', { error });
    return { success: false, error };
  }
};
