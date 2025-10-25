// back/src/utils/logger/types.ts
import winston from 'winston';

export type LogLevel = 'error' | 'warn' | 'info' | 'debug';

export type LogContext =
  | 'PURCHASE'
  | 'AUTH'
  | 'USER'
  | 'PRODUCT'
  | 'SYSTEM'
  | 'SCHEDULER'
  | 'COUPANG'
  | 'COMMON' // 공통/일반적인 로직
  | 'API' // API 관련
  | 'DATABASE' // 데이터베이스 관련
  | 'CACHE' // 캐시 관련
  | 'VALIDATION' // 유효성 검증
  | 'MIDDLEWARE' // 미들웨어
  | 'SERVICE' // 서비스 레이어
  | 'CONTROLLER' // 컨트롤러
  | 'UTIL' // 유틸리티 함수
  | 'EXTERNAL' // 외부 API 호출
  | 'CRAWL' // 크롤링 관련
  | 'ANALYTICS';

export type LogSeverity = 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';

export const DEFAULT_CONTEXT: LogContext = 'SYSTEM';
export const DEFAULT_SEVERITY: LogSeverity = 'MEDIUM';

export interface CustomLogInfo extends winston.Logform.TransformableInfo {
  timestamp: string;
  context?: string;
  severity?: string;
}

export const colors = {
  error: '\x1b[31m',
  warn: '\x1b[33m',
  info: '\x1b[32m',
  debug: '\x1b[34m',
  reset: '\x1b[0m',
} as const;
