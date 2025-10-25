import './env';
import './instruments';
import Koa from 'koa';
import cors from '@koa/cors';
import bodyParser from 'koa-bodyparser';
import http from 'http';
import router from './router';
import socket from './socket';
import { registerAllSchedulers } from 'scheduler';
import { log } from './utils/logger';
import * as Sentry from '@sentry/node';

const PORT = process.env.PORT || 3000;
const app = new Koa();

const corsOptions = {
  origin: process.env.CLIENT_ORIGIN,
  credentials: true,
};

// 전역 에러 핸들러 미들웨어
app.use(async (ctx, next) => {
  try {
    await next();
  } catch (err: any) {
    const error = err as Error;

    Sentry.captureException(error);
    // 에러 로깅
    void log.error(`Global error: ${error.message}`, 'SYSTEM', 'HIGH', {
      stack: error.stack,
      path: ctx.path,
      method: ctx.method,
      status: ctx.status,
    });

    // 클라이언트에 에러 응답
    ctx.status = err.status || 500;
    ctx.body = {
      error: {
        message: process.env.NODE_ENV === 'production' ? 'Internal Server Error' : error.message,
      },
    };
    ctx.app.emit('error', err, ctx);
  }
});

app.use(cors(corsOptions)).use(bodyParser()).use(router.routes()).use(router.allowedMethods());

const server = http.createServer(app.callback());
socket.setServer(server);

server.listen(PORT, () => {
  // eslint-disable-next-line no-console
  console.log(`server listen in port ${PORT}`);
});

if (process.env.NODE_ENV === 'production') {
  registerAllSchedulers();
}
