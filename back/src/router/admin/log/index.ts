import Router from '@koa/router';
import db from 'models';

const router = new Router({
  prefix: '/log',
});

router.get('/', async (ctx) => {
  const { start, end } = ctx.query;
  const startDate = start ? new Date(start as string) : new Date('1999-01-01');
  const endDate = start ? new Date(end as string) : new Date('2999-01-01');
  const logs = await db.Log.find({
    createdAt: {
      $gte: startDate,
      $lte: endDate,
    },
  });
  ctx.body = logs;
});

export default router;
