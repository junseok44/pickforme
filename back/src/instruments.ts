// instrument.ts
import * as Sentry from '@sentry/node';

const getEnvironment = () => {
  const nodeEnv = process.env.NODE_ENV;
  const mode = process.env.MODE;

  if (nodeEnv === 'production') {
    if (mode === 'prod') {
      return 'production';
    } else if (mode === 'dev') {
      return 'development';
    }
  }

  return 'local';
};

Sentry.init({
  dsn: process.env.SENTRY_DSN,
  environment: getEnvironment(),
  tracesSampleRate: 1.0,
  profileSessionSampleRate: 1.0,
  profileLifecycle: 'trace',
  sendDefaultPii: true,
});
