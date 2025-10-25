import Router from '@koa/router';
import requireAuth from 'middleware/jwt';
import client from 'utils/axios';
import slack from 'utils/slack';
import { RequestType } from 'models/request';
import db from 'models';

const router = new Router({
  prefix: '/request',
});

// 의뢰생성
router.post('/', requireAuth, async (ctx) => {
  const user = await db.User.findById(ctx.state.user._id);
  if (!user) {
    return;
  }
  const {
    body: { product, ...body },
  } = <any>ctx.request;

  const request = await db.Request.create({
    ...body,
    userId: user._id,
    name: product.name,
    product,
  });
  // if (body.type !== RequestType.AI) {
  //   const chat = await db.Chat.create({
  //     text: `${requestName} 의뢰가 성공적으로 접수되었습니다. 답변은 1~2시간 이내에 작성되며, 추가적인 문의사항이 있으실 경우 메세지를 남겨주세요.`,
  //     isMine: false,
  //     userId: user._id,
  //     requestId: request._id,
  //     button: {
  //       text: '의뢰 내용 보기',
  //       deeplink: `/request?requestId=${request._id}`,
  //     },
  //   });
  //   request.chats = [chat._id];
  //   await request.save();
  // }
  // 추후 admin들 broadcast socket 통신 or 어드민별 assign시스템 구축
  ctx.body = request;
  ctx.status = 200;

  // slack 의뢰 도착 알림
  if (body.type !== RequestType.AI) {
    // slack
    try {
      if (user.point <= 0) {
        throw new Error('pick error');
      }
      await user.usePoint(1);
    } catch (e) {
      ctx.status = 400;
      ctx.body = {
        errorMessage: '요청하실 포인트가 부족합니다.',
      };
      return;
    }
    const slackMsg = `[픽포미 의뢰가 도착했습니다]\n
상품명: ${product.name}\n
의뢰 내용: ${body.text}\n
상품 링크: ${product.url}\n
어드민 링크: ${process.env.CLIENT_ORIGIN}/request?requestId=${request._id}`;

    await slack.post('/chat.postMessage', {
      text: slackMsg,
      channel: process.env.SLACK_SERVICE_NOTIFICATION_CHANNEL_ID,
    });
  } else {
    // slack ai 응답 생성
    const purchase = await db.Purchase.findOne({ userId: user._id }).sort({ createdAt: -1 }).lean();

    if (purchase) {
      // 이 부분 로직은 스케쥴러에서 처리하도록 변경했습니다. feat/membership-scheduler
      // const today = new Date();
      // const oneMonthLater = new Date(purchase.createdAt);
      // oneMonthLater.setMonth(oneMonthLater.getMonth() + 1);
      // if (oneMonthLater < new Date(today.setHours(0, 0, 0, 0))) {
      //   await purchase.updateExpiration();
      //   await user.processExpiredMembership();
      // }
    } else {
      // 마지막 요청이 오늘의 달과 다르면 유저 횟수 초기화 (AI 횟수만, 매니저 횟수는 X)
      const today = new Date();
      const lastRequest = await db.Request.findOne({ userId: user._id })
        .sort({ createdAt: -1 })
        .lean();
      if (lastRequest && lastRequest.createdAt.getMonth() !== today.getMonth()) {
        await user.initMonthPoint();
      }
    }

    if (user.aiPoint <= 0) {
      ctx.status = 400;
      ctx.body = {
        errorMessage: '요청하실 포인트가 부족합니다.',
      };
      return;
    }
    await user.useAiPoint(1);

    const {
      data: { answer },
    } = await client.post('/test/ai-answer', {
      product,
      ...body,
      model: 'gpt',
    });

    await slack.post('/chat.postMessage', {
      text: `[AI 답변이 생성되었습니다]\n의뢰 내용: ${body.text}\nAI 답변: ${answer}`,
      channel: process.env.SLACK_SERVICE_NOTIFICATION_CHANNEL_ID,
    });
  }
});

router.get('/', requireAuth, async (ctx) => {
  const requests = await db.Request.find({
    userId: ctx.state.user._id,
  });
  ctx.body = requests;
});

// router.post('/review', requireAuth, async (ctx) => {
//   const {
//     body: {
//       _id,
//       ...review
//     },
//   } = <any>ctx.request;
//   const request = await db.Request.findOne({
//     _id, userId: ctx.state.user._id,
//   });
//   request.review = review;
//   await request.save();
//   ctx.status = 200;
// });
// router.post('/preview', requireAuth, async (ctx) => {
//   const {
//     link,
//   } = (<{ link: string }>ctx.request.body);
//   const {
//     result: {
//       ogTitle: title,
//       ogDescription: desc,
//       ogImage: [{
//         url: image,
//       }] = [{
//         url: '',
//       }],
//     },
//   } = await ogs({
//     url: link,
//   });

//   ctx.body = {
//     image,
//     title,
//     desc,
//     link,
//   };
// });
/*
// 추후 규모 커지면 퍼포먼스 개선을 위해 필요한 api들

// 의뢰창 미리보기 (채팅은 한개씩. 미리보기만)
router.get("/preview", async (ctx) => {
});
*/

// router.get('/read/:requestId', requireAuth, async (ctx) => {
//   const {
//     requestId,
//   } = ctx.params;
//   const request = await db.Request.findOne({
//     _id: requestId, userId: ctx.state.user._id,
//   });
//   request.unreadCount = 0;
//   await request.save();
//   ctx.body = {
//     _id: request._id,
//     unreadCount: request.unreadCount,
//   };
// });

// router.get('/detail/:requestId', requireAuth, async (ctx) => {
//   const {
//     requestId,
//   } = ctx.params;
//   const request = await db.Request.findOne({
//     _id: requestId, userId: ctx.state.user._id,
//   });
//   request.unreadCount = 0;
//   await request.save();
//   const res = await request.populate('chats');
//   ctx.body = res;
// });

// 채팅 입력
// router.post('/chat', requireAuth, async (ctx) => {
//   const {
//     body,
//   } = <any>ctx.request;
//   const request = await db.Request.findById(body.requestId);
//   if (!request) {
//     ctx.status = 404;
//     return;
//   }
//   const chat = await db.Chat.create({
//     ...(body as Object),
//     isMine: true,
//     userId: ctx.state.user._id,
//   });
//   request.chats.push(chat._id);
//   request.unreadCount = 0;
//   if (request.type === RequestType.AI) {
//     (async () => {
//       const responseBody = {
//         text: '',
//         products: [],
//         questions: [],
//       };
//       try {
//         const {
//           data: {
//             answer: message,
//             data,
//           },
//         } = await client.post<{ answer: string, data: any }>('/shopping-chat', {
//           text: body.text,
//           ...(request.data ? {
//             data: request.data,
//           } : {}),
//         });
//         if (data) {
//           request.data = data;
//           if (data.products) {
//             responseBody.products = data.products;
//           }
//           if (data.questions) {
//             responseBody.questions = data.questions;
//           }
//         }
//         responseBody.text = message;
//       } catch (e) {
//         responseBody.text = '죄송합니다. 다시 시도해주세요.';
//       }
//       const autoChat = await db.Chat.create({
//         requestId: body.requestId,
//         isMine: false,
//         userId: ctx.state.user._id,
//         ...responseBody,
//       });
//       request.chats.push(autoChat._id);
//       request.unreadCount += 1;
//       await request.save();

//       const session = await db.Session.findOne({
//         userId: ctx.state.user._id,
//       });
//       if (session) {
//         socket.emit(session.connectionId, 'message', {
//           chat: autoChat, unreadCount: request.unreadCount,
//         });
//       }
//       const user = await db.User.findById(ctx.state.user._id);
//       if (user && user.pushToken && user.push.chat === 'all') {
//         sendPush({
//           to: user.pushToken,
//           body: autoChat.text,
//           data: { url: `/chat?requestId=${request._id}` },
//         });
//       }
//     })();
//   } else {
//     const slack_msg = `
// 채팅이 도착했습니다.\n
// ${body.text}
//     `;
//     slack.post('/chat.postMessage', {
//       text: slack_msg, channel: 'C05NTFL1Q4C',
//     });
//   }
//   await request.save();
//   // 추후 admin들 broadcast socket 통신 or 어드민별 assign시스템 구축
//   ctx.body = chat;
//   ctx.status = 200;
// });

export default router;
