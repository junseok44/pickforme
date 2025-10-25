const logDir = process.cwd() + '/logs';

// 로깅 행동 : production 환경에서는 파일에 저장, 그렇지 않으면 콘솔에 출력
const isProduction = process.env.NODE_ENV === 'production';

const isStagingServer = isProduction && process.env.MODE === 'dev';

const slackChannelId = process.env.SLACK_ERROR_CHANNEL_ID;

export const config = {
  logDir,
  isProduction,
  slackChannelId,
  isStagingServer,
};
