import Router from '@koa/router';

import * as fs from 'fs';
import authRouter from './auth';
import requestRouter from './request';
import purchaseRouter from './purchase';
import adminRouter from './admin';
import noticeRouter from './notice';
import discoverRouter from './discover';
import userRouter from './user';
import logRouter from './log';
import productRouter from './product';
import popupRouter from './popup';
import coupangRouter from '../feature/coupang/router';
import crawlReportRouter from './crawl-report';
import db from '../models';
import { log } from 'utils/logger';
import searchLogsRouter from './searchLogs';
import statisticsRouter from '../feature/analytics/routes/statistics.router';
import urlTransformLogRouter from '../feature/urlTransformLog/router';

const router = new Router();

[
  userRouter,
  adminRouter,
  noticeRouter,
  authRouter,
  requestRouter,
  purchaseRouter,
  discoverRouter,
  logRouter,
  productRouter,
  popupRouter,
  coupangRouter,
  crawlReportRouter,
  searchLogsRouter,
  statisticsRouter,
  urlTransformLogRouter,
].forEach((subrouter) => {
  router.use(subrouter.routes());
});

router.get('/error-test', async (ctx) => {
  throw new Error('test');
});

router.get('/logger-test', async (ctx) => {
  try {
    throw new Error('테스트용 에러입니다. 테스트 잘 되고 있나요??');
  } catch (error) {
    if (error instanceof Error) {
      void log.error(error.message, 'SYSTEM', 'HIGH', {
        endPoint: '/logger-test',
        method: 'GET',
        stack: error.stack,
      });
    }
  }

  ctx.body = 'test';
  return;
});

router.get('/health-check', async (ctx) => {
  ctx.body = 'ok';
});

router.get('/export', async (ctx) => {
  const requests = await db.Request.find({}).populate('userId').sort({
    createdAt: -1,
  });

  const data = requests.map((request) => ({
    id: request._id.toString(),
    type: request.type,
    email: request.userId.email,
    name: request.name,
    text: request.text,
    review: request.review.rating ?? '없음',
  }));
  const array = data;

  const convertToCSV = (arr: Array<{ [key: string]: any }>) => {
    const header = `${Object.keys(arr[0]).join(',')}\n`;
    const content = arr.map((row) => Object.values(row).join(',')).join('\n');
    return `${header + content}\n`;
  };
  const saveToCSV = (inData: string, fileName: string) => {
    fs.writeFileSync(fileName, inData);
  };

  const csvData = convertToCSV(array);
  saveToCSV(csvData, 'output.csv');
  ctx.body = csvData;
});

export default router;
