// back/src/utils/logger/transports.ts
import winston from 'winston';
import path from 'path';
import { CustomLogInfo, colors, LogSeverity, LogContext } from './types';
import slackClient from '../slack';
import { config } from './config';

const { logDir, isProduction, slackChannelId, isStagingServer } = config;

// 공통 포맷 함수
const createLogFormat = (useColors: boolean = false) => {
  return winston.format.combine(
    winston.format.timestamp(),
    winston.format.printf((info) => {
      const { timestamp, level, message, ...meta } = info as unknown as CustomLogInfo;
      const context = meta.context || 'unknown';
      const severity = meta.severity || 'MEDIUM';

      const { context: contextValue, severity: severityValue, ...restMeta } = meta;
      const additionalMeta = Object.keys(restMeta).length ? JSON.stringify(restMeta) : '';

      const logMessage = `[${timestamp}] [${level}] [${context}/${severity}] ${message}${
        additionalMeta ? ' ' + additionalMeta : ''
      }`;

      // 색상 적용 여부에 따라 반환
      if (useColors) {
        const color = colors[level as keyof typeof colors] || colors.reset;
        return `${color}${logMessage}${colors.reset}`;
      }
      return logMessage;
    })
  );
};

// 콘솔 전송 설정
const createConsoleTransport = () =>
  new winston.transports.Console({
    format: createLogFormat(true), // 색상 적용
  });

// severity를 텍스트로 변환하는 함수
const getSeverityText = (severity: LogSeverity): string => {
  switch (severity) {
    case 'CRITICAL':
      return '🔴 CRITICAL';
    case 'HIGH':
      return '🟠 HIGH';
    case 'MEDIUM':
      return '🟡 MEDIUM';
    case 'LOW':
      return '🟢 LOW';
    default:
      return '⚪ UNKNOWN';
  }
};

interface SlackErrorPayload {
  context: LogContext;
  message: string;
  severity: LogSeverity;
  stack?: string;
  meta?: Record<string, any>;
  channelId?: string;
}

// 슬랙 전송 함수
export const sendToSlack = async (payload: SlackErrorPayload) => {
  try {
    const { context, message, severity, stack, meta, channelId } = payload;

    let formattedMessage = '';

    // 서버 환경에 따른 제목 설정
    const serverEnv = isStagingServer ? 'development' : 'production';
    formattedMessage = `🚨 *[${serverEnv}] backend server에서 ERROR 발생*\n\n`;
    formattedMessage += `*Context / Message / Severity*\n\`\`\`\nContext: ${context}\nMessage: ${message}\nSeverity: ${getSeverityText(
      severity
    )}\n\`\`\`\n\n`;

    // 스택 트레이스가 있으면 코드 블록으로 포맷팅
    if (stack) {
      formattedMessage += `*Stack Trace*\n\`\`\`\n${stack}\n\`\`\`\n\n`;
    }

    // 나머지 메타데이터가 있으면 추가
    if (meta && Object.keys(meta).length > 0) {
      formattedMessage += `*Additional Info*\n\`\`\`${JSON.stringify(meta, null, 2)}\n\`\`\``;
    }

    await slackClient.post('/chat.postMessage', {
      text: formattedMessage,
      channel: channelId || slackChannelId,
    });
  } catch (error) {
    console.error('슬랙 메시지 전송 실패:', error);
  }
};

// 파일 전송 설정
const createFileTransports = () => {
  try {
    return [
      new winston.transports.File({
        filename: path.join(logDir, 'error.log'),
        level: 'error',
        format: createLogFormat(false), // 색상 미적용
        // 파일 시스템 에러를 처리
        handleExceptions: true,
        handleRejections: true,
      }),
      new winston.transports.File({
        filename: path.join(logDir, 'combined.log'),
        format: createLogFormat(false), // 색상 미적용
        // 파일 시스템 에러를 처리
        handleExceptions: true,
        handleRejections: true,
      }),
    ];
  } catch (error) {
    // 파일 시스템 에러 발생 시 콘솔로만 로깅
    process.stderr.write(`파일 로깅 설정 실패: ${error}\n`);

    // Slack으로도 알림 (실패해도 무시)
    if (isProduction) {
      sendToSlack({
        context: 'SYSTEM',
        message: `파일 로깅 설정 실패: ${error}`,
        severity: 'HIGH',
      }).catch(() => {});
    }

    return [createConsoleTransport()];
  }
};

// 전체 transport 설정
export const getTransports = () => {
  try {
    return isProduction ? createFileTransports() : [createConsoleTransport()];
  } catch (error) {
    // 모든 transport 설정이 실패하면 최소한의 콘솔 로깅만 사용
    console.error('로거 설정 실패:', error);

    // Slack으로도 알림 (실패해도 무시)
    if (isProduction) {
      sendToSlack({
        context: 'SYSTEM',
        message: `로거 설정 실패: ${error}`,
        severity: 'HIGH',
      }).catch(() => {});
    }

    return [createConsoleTransport()];
  }
};
