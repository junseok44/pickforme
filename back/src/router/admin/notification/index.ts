import Router from '@koa/router';
import db from 'models';
import { sendPushs } from 'utils/push';

const router = new Router({
  prefix: '/notification',
});

router.get('/detail/:notificationId', async (ctx) => {
  const { notificationId } = ctx.params;
  const notification = await db.Notification.findById(notificationId);
  ctx.body = notification;
});

router.get('/', async (ctx) => {
  const notifications = await db.Notification.find({}).sort({
    createdAt: -1,
  });
  ctx.body = notifications;
});

router.post('/', async (ctx) => {
  const { body } = <any>ctx.request;
  const notification = await db.Notification.create(body);
  const users = await db.User.find({ pushToken: { $ne: null }, 'push.service': 'on' });
  const pushTokens: string[] = users.reduce(
    (arr, { pushToken }) => (pushToken ? arr.concat([pushToken]) : arr),
    [] as string[]
  );
  sendPushs(pushTokens, {
    body: body.body,
    title: body.title,
  });

  ctx.body = notification;
});

export default router;
