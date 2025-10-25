import Router from '@koa/router';
import db from 'models';

const router = new Router({
  prefix: '/log',
});

router.post('/', async (ctx) => {
  // const {
  //   body: { userId, product, action, metaData },
  // } = <any>ctx.request;
  // await db.Log.create({
  //   userId,
  //   product,
  //   action,
  //   metaData,
  // });
  ctx.status = 200;
});

export default router;
