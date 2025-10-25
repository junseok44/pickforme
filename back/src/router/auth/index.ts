import Router from '@koa/router';
import axios from 'axios';
import db from 'models';
import verifyAppleToken from 'verify-apple-id-token';
import requireAuth from 'middleware/jwt';
import { PushService, PushSetting } from 'models/user/types';

const router = new Router({
  prefix: '/auth',
});

const handleLogin = async (email: string) => {
  let user = await db.User.findOne({
    email,
  });

  // 상황에 따라 사용할 변수들
  let isRegister = false;
  let isNewLoginInEvent = false;

  if (!user) {
    // 신규 회원
    user = await db.User.create({
      email,
      point: 0,
      aiPoint: 15,
    });

    isRegister = true;
  } else {
    // update last login date
    user.lastLoginAt = new Date();
  }

  await user.save();

  const token = await user.generateToken();
  // const refreshToken = await user.generateRefreshToken();

  return {
    user: {
      ...user.toObject(),
      // refreshToken,
      token,
    },
    isRegister,
    isNewLoginInEvent,
  };
};

router.post('/google', async (ctx) => {
  const { accessToken } = <{ accessToken: string }>ctx.request.body;
  const { data } = await axios.get<{ email: string; verified_email: boolean }>(
    `https://www.googleapis.com/oauth2/v1/tokeninfo?access_token=${accessToken}
  `
  );

  const { email, verified_email } = data;
  if (!verified_email || !email) {
    ctx.body = {
      error: '잘못된 접근입니다',
    };
    return;
  }

  ctx.body = await handleLogin(email);
});

router.post('/kakao', async (ctx) => {
  const { accessToken } = <{ accessToken: string }>ctx.request.body;
  const data = await axios.get('https://kapi.kakao.com/v2/user/me', {
    headers: {
      Authorization: `Bearer ${accessToken}`,
    },
  });

  const { is_email_verified, is_email_valid, email } = data?.data?.kakao_account || {};
  if (!is_email_valid || !is_email_verified || !email) {
    ctx.body = {
      error: '잘못된 접근입니다',
    };
    return;
  }

  ctx.body = await handleLogin(email);
});

router.post('/apple', async (ctx) => {
  const { identityToken } = <{ identityToken: string }>ctx.request.body;
  const { email_verified, email } = await verifyAppleToken({
    idToken: identityToken,
    clientId: process.env.APPLE_CLIENT_ID as string,
  });

  if (!email_verified || !email) {
    ctx.body = {
      error: '잘못된 접근입니다',
    };
    return;
  }
  ctx.body = await handleLogin(email);
});

router.post('/pushtoken', requireAuth, async (ctx) => {
  const user = await db.User.findById(ctx.state.user._id);
  if (user) {
    const { token } = <{ token: string }>ctx.request.body;
    user.pushToken = token;
    await user.save();
    ctx.status = 200;
  }
});

router.put('/pushsetting', requireAuth, async (ctx) => {
  const user = await db.User.findById(ctx.state.user._id);
  if (user) {
    user.push = <PushSetting>ctx.request.body;
    await user.save();
    ctx.body = ctx.request.body;
  }
});

router.post('/quit', requireAuth, async (ctx) => {
  const user = await db.User.findById(ctx.state.user._id);
  if (!user) {
    ctx.status = 404;
    return;
  }

  if (user.email.includes('_deleted_')) {
    ctx.status = 400;
    ctx.body = {
      error: '이미 탈퇴한 사용자입니다',
    };
    return;
  }

  user.originEmail = user.email;
  user.email = `${user.email}_deleted_${new Date()}`;
  user.pushToken = undefined;
  user.phone = undefined;
  user.push = {
    service: PushService.off,
  };
  user.point = 0;
  user.aiPoint = 0;
  user.level = 1;
  user.lastLoginAt = new Date();
  user.MembershipAt = null;
  user.lastMembershipAt = null;
  user.event = null;
  user.hide = [];

  await user.save();
  ctx.status = 200;
});

export default router;
