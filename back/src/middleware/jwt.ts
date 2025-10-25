import { Context } from 'koa';
import db from 'models';
import { decodeJWT } from 'utils/jwt';

export default async (ctx: Context, next: () => Promise<any>) => {
  const token = ctx.header.authorization;
  if (token) {
    try {
      const user = decodeJWT(token.replace(/^Bearer /, ''));
      ctx.state.user = user;
      const session = await db.Session.findOne({
        userId: user._id,
      });
      if (session) {
        ctx.state.socketId = session.connectionId;
      }
    } catch (e) {
      ctx.status = 401;
      if (e instanceof Error) {
        ctx.body = e.message;
      } else {
        ctx.body = 'Unauthorized';
      }
      return;
    }
  } else {
    ctx.body = 'login required';
    ctx.status = 401;
    return;
  }
  await next();
};
