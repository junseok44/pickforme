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

router.delete('/detail/:noticeId', async (ctx) => {
  const { noticeId } = ctx.params;
  const notice = await db.Notice.deleteOne({
    _id: noticeId,
  });
  ctx.body = notice;
});

router.get('/', async (ctx) => {
  const notices = await db.Notice.find({}).sort({
    createdAt: -1,
  });
  ctx.body = notices;
});

router.put('/', async (ctx) => {
  const { body } = <any>ctx.request;
  const notice = await db.Notice.findById(body._id);
  notice.title = body.title;
  notice.text = body.text;
  await notice.save();
  ctx.body = notice;
});

router.post('/', async (ctx) => {
  const { body } = <any>ctx.request;
  const notice = await db.Notice.create(body);
  ctx.body = notice;
});

/*
// 추후 규모 커지면 퍼포먼스 개선을 위해 필요한 api들

// 의뢰창 미리보기 (채팅은 한개씩. 미리보기만)
router.get("/preview", async (ctx) => {
});
*/

export default router;
