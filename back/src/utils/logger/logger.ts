// back/src/utils/logger/logger.ts
import winston from 'winston';
import { LogLevel, LogContext, LogSeverity, DEFAULT_CONTEXT, DEFAULT_SEVERITY } from './types';
import { getTransports, sendToSlack } from './transports';
import { config } from './config';

const { isProduction } = config;

// 로거 생성
const logger = winston.createLogger({
  level: isProduction ? 'info' : 'debug',
  format: winston.format.combine(winston.format.timestamp(), winston.format.json()),
  transports: getTransports(),

  handleExceptions: true,
  handleRejections: true,
  exitOnError: false, // 로거 에러가 발생해도 프로세스가 종료되지 않도록
});

// 로거 자체의 에러를 처리하는 이벤트 리스너
logger.on('error', (error) => {
  // 로거가 실패하면 최소한 console.error로라도 기록
  console.error('로거 에러 발생:', error);
});

// 안전한 로깅을 위한 래퍼 함수
const safeLog = (
  level: LogLevel,
  context: LogContext,
  message: string,
  severity: LogSeverity,
  meta?: any
) => {
  try {
    logger.log(level, message, { context, severity, ...meta });
  } catch (error) {
    // 로거 자체가 실패하면 console.error로 기록
    console.error(`로깅 실패 (${level}):`, { context, message, severity, meta, error });
  }
};

// 로깅 함수 추상화
export const log = {
  error: async (
    message: string,
    context: LogContext = DEFAULT_CONTEXT,
    severity: LogSeverity = DEFAULT_SEVERITY,
    meta?: any,
    channelId?: string
  ) => {
    // 기본 로깅은 안전하게 수행
    safeLog('error', context, message, severity, meta);

    // Slack 전송
    if (isProduction && (severity === 'HIGH' || severity === 'CRITICAL')) {
      await sendToSlack({
        context,
        message,
        severity,
        stack: meta?.stack,
        meta: meta ? { ...meta, stack: undefined } : undefined,
        channelId,
      });
    }
  },
  warn: (
    message: string,
    context: LogContext = DEFAULT_CONTEXT,
    severity: LogSeverity = DEFAULT_SEVERITY,
    meta?: any
  ) => {
    safeLog('warn', context, message, severity, meta);
  },
  info: (
    message: string,
    context: LogContext = DEFAULT_CONTEXT,
    severity: LogSeverity = 'LOW',
    meta?: any
  ) => {
    safeLog('info', context, message, severity, meta);
  },
  debug: (
    message: string,
    context: LogContext = DEFAULT_CONTEXT,
    severity: LogSeverity = 'LOW',
    meta?: any
  ) => {
    safeLog('debug', context, message, severity, meta);
  },
};

export default logger;
