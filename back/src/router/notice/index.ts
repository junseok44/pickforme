import Router from '@koa/router';
import db from 'models';

const router = new Router({
  prefix: '/notice',
});

router.get('/detail/:noticeId', async (ctx) => {
  const { noticeId } = ctx.params;
  const notice = await db.Notice.findById(noticeId);
  ctx.body = notice;
});

router.get('/', async (ctx) => {
  const notices = await db.Notice.find({}).sort({
    createdAt: -1,
  });
  ctx.body = notices;
});

export default router;
