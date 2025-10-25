import Router from '@koa/router';
import db from 'models'; // 'models'는 DB 모델을 정의한 모듈입니다.

const router = new Router({
  prefix: '/user',
});

router.get('/', async (ctx) => {
  // URL 쿼리에서 시작 및 종료 날짜를 가져옵니다.
  const { start, end } = ctx.query;
  const startDate = start ? new Date(start as string) : new Date('1999-01-01');
  const endDate = start ? new Date(end as string) : new Date('2999-01-01');

  try {
    // MongoDB에서 start와 end 기간 사이의 사용자를 조회합니다.
    const users = await db.User.find({
      createdAt: {
        $gte: startDate, // '이상'
        $lte: endDate, // '이하'
      },
    });

    // 조회된 사용자 목록을 응답으로 반환합니다.
    ctx.body = users;
  } catch (error) {
    // 에러 처리
    ctx.status = 500;
    ctx.body = { message: '서버 오류가 발생했습니다.' };
  }
});

export default router;
