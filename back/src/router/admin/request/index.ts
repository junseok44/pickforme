import Router from '@koa/router';
import db from 'models';
import sendPush from 'utils/push';

import { RequestType, RequestStatus } from 'models/request';

const router = new Router({
  prefix: '/request',
});

router.post('/answer', async (ctx) => {
  const { body } = <any>ctx.request;
  const request = await db.Request.findById(body.requestId).populate('userId');
  if (!request) {
    throw new Error('Request 존재하지 않음');
  }

  const deeplink = `/product-detail?productUrl=${encodeURIComponent(request!.product.url)}&tab=question`;

  const user = await db.User.findById(request!.userId);

  if (user && user.pushToken && user.push.service === 'on') {
    sendPush({
      to: user.pushToken,
      body:
        request!.type === RequestType.QUESTION
          ? `'${request!.product.name.slice(0, 13)}...' 상품에 대한 매니저 답변이 도착했습니다.`
          : '매니저 답변이 도착했습니다.',
      data: { url: deeplink, type: 'answer' },
    });
  }

  request!.answer = body.answer;
  request!.status = RequestStatus.SUCCESS;
  await request!.save();
  ctx.body = request;
});

router.get('/', async (ctx) => {
  const { start, end, page = 1, pageSize = 10, type = 'ALL' } = ctx.query;
  const startDate = start ? new Date(start as string) : new Date('1999-01-01');
  const endDate = start ? new Date(end as string) : new Date('2999-01-01');
  const pageNum = parseInt(page as string, 10);
  const pageSizeNum = parseInt(pageSize as string, 10);
  const skip = (pageNum - 1) * pageSizeNum;

  const totalRequests = await db.Request.countDocuments({
    type:
      type === 'ALL'
        ? {
            $ne: RequestType.AI,
          }
        : {
            $eq: type,
          },
    createdAt: {
      $gte: startDate,
      $lte: endDate,
    },
  });

  const requests = await db.Request.find({
    type:
      type === 'ALL'
        ? {
            $ne: RequestType.AI,
          }
        : {
            $eq: type,
          },
    createdAt: {
      $gte: startDate,
      $lte: endDate,
    },
  })
    .sort({
      createdAt: -1,
    })
    .skip(skip)
    .limit(pageSizeNum);

  ctx.body = {
    requests,
    totalRequests,
    totalPages: Math.ceil(totalRequests / pageSizeNum),
    currentPage: pageNum,
  };
});

router.delete('/:requestId', async (ctx) => {
  const { requestId } = ctx.params;
  await db.Request.findByIdAndDelete(requestId);
  ctx.status = 204;
});

// 의뢰 수 별 유저 수 분포
router.get('/user-stats', async (ctx) => {
  try {
    const stats = await db.Request.aggregate([
      // 각 userId별로 문서를 그룹화하고, 각 그룹의 요청 수를 계산합니다.
      {
        $group: {
          _id: {
            userId: '$userId',
            type: '$type',
          },
          requestCount: { $sum: 1 },
        },
      },
      // 다음으로, 앞서 구한 요청 횟수와 타입별로 사용자를 그룹화하고, 각 그룹의 사용자 수를 계산합니다.
      {
        $group: {
          _id: {
            requestCount: '$requestCount',
            type: '$_id.type',
          },
          userCount: { $sum: 1 },
        },
      },
      // 결과를 타입과 요청 횟수별로 정렬합니다.
      {
        $sort: {
          '_id.type': 1,
          '_id.requestCount': 1,
        },
      },
    ]);

    ctx.body = stats;
  } catch (error) {
    ctx.status = 500;
    ctx.body = { message: '서버 오류가 발생했습니다' };
  }
});

router.get('/request-stats', async (ctx) => {
  try {
    const stats = await db.Request.aggregate([
      {
        $match: {
          type: {
            $ne: RequestType.AI,
          },
          'review.rating': { $exists: true },
        },
      },
      {
        $group: {
          _id: '$type', // 타입별로 그룹화
          totalReviews: { $sum: 1 }, // 평가의 총 수
          averageRating: { $avg: '$review.rating' }, // 평점 평균
          reviewTexts: { $push: '$review.text' }, // review.text의 값들을 배열로 수집
        },
      },
      {
        $sort: { _id: 1 }, // 타입별로 정렬
      },
    ]);

    ctx.body = stats.map((stat) => ({
      type: stat._id,
      totalReviews: stat.totalReviews,
      averageRating: stat.averageRating ? parseFloat(stat.averageRating.toFixed(2)) : 0, // 소수점 둘째 자리까지 반올림
      reviewTexts: stat.reviewTexts, // review.text의 문자열 리스트
    }));
  } catch (error) {
    console.log(error);
    ctx.status = 500;
    ctx.body = { message: '서버 오류가 발생했습니다' };
  }
});

router.get('/detail/:requestId', async (ctx) => {
  const { requestId } = ctx.params;
  const request = await db.Request.findById(requestId).populate('userId');
  ctx.body = request;
});

// 채팅 입력
// router.post('/chat', async (ctx) => {
//   const {
//     body,
//   } = <any>ctx.request;
//   const request = await db.Request.findById(body.requestId);
//   const chat = await db.Chat.create({
//     ...(body as Object),
//     isMine: false,
//     userId: request.userId,
//   });
//   request.chats.push(chat._id);
//   request.unreadCount += 1;
//   await request.save();
//   const session = await db.Session.findOne({
//     userId: request.userId,
//   });
//   if (session) {
//     socket.emit(session.connectionId, 'message', {
//       chat, unreadCount: request.unreadCount,
//     });
//   }
//   const user = await db.User.findById(request.userId);
//   if (user && user.pushToken && user.push.service === 'on') {
//     sendPush({
//       to: user.pushToken,
//       body: chat.text,
//       data: { url: `/chat?requestId=${request._id}` },
//     });
//   }
//   ctx.body = chat;
// });

export default router;
